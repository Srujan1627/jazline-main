#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Jazline Home Care
Base URL: https://rent-buy-care.preview.emergentagent.com/api
"""

import requests
import json
import sys
from datetime import datetime
import time

# Configuration
BASE_URL = "http://localhost:8001/api"
PHONE_NUMBER = "9876543210"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.user_id = None
        self.otp_code = None
        self.product_id = None
        self.kit_id = None
        self.order_id = None
        self.rental_id = None
        self.results = []

    def log_result(self, test_name, success, details, response_data=None):
        """Log test results"""
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()
        
        self.results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request and handle errors"""
        url = f"{BASE_URL}{endpoint}"
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except Exception as e:
            return None

    def test_api_root(self):
        """Test API root endpoint"""
        response = self.make_request('GET', '/')
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.log_result("API Root Endpoint", True, f"Status: {response.status_code}, Message: {data.get('message', 'Unknown')}")
                return True
            except:
                self.log_result("API Root Endpoint", False, f"Status: {response.status_code}, Invalid JSON response")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("API Root Endpoint", False, f"Failed to connect or bad status code: {status_code}")
            return False

    def test_send_otp(self):
        """Test OTP sending"""
        data = {"phone": PHONE_NUMBER}
        response = self.make_request('POST', '/auth/send-otp', data)
        
        if response and response.status_code == 200:
            try:
                resp_data = response.json()
                if resp_data.get('success') and 'otp' in resp_data:
                    self.otp_code = resp_data['otp']
                    self.log_result("Send OTP", True, f"OTP generated: {self.otp_code}")
                    return True
                else:
                    self.log_result("Send OTP", False, "Missing success flag or OTP in response", resp_data)
                    return False
            except Exception as e:
                self.log_result("Send OTP", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Send OTP", False, f"Request failed with status: {status_code}")
            return False

    def test_verify_otp(self):
        """Test OTP verification"""
        if not self.otp_code:
            self.log_result("Verify OTP", False, "No OTP available from previous test")
            return False
            
        data = {"phone": PHONE_NUMBER, "otp": self.otp_code}
        response = self.make_request('POST', '/auth/verify-otp', data)
        
        if response and response.status_code == 200:
            try:
                resp_data = response.json()
                if resp_data.get('success') and 'user' in resp_data:
                    # Handle both _id and id fields
                    user_data = resp_data['user']
                    self.user_id = user_data.get('id') or user_data.get('_id')
                    if self.user_id:
                        self.log_result("Verify OTP", True, f"User authenticated with ID: {self.user_id}")
                        return True
                    else:
                        self.log_result("Verify OTP", False, "Missing user ID in response", resp_data)
                        return False
                else:
                    self.log_result("Verify OTP", False, "Missing success flag or user data", resp_data)
                    return False
            except Exception as e:
                self.log_result("Verify OTP", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Verify OTP", False, f"Request failed with status: {status_code}")
            return False

    def test_get_all_products(self):
        """Test getting all products"""
        response = self.make_request('GET', '/products')
        
        if response and response.status_code == 200:
            try:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    # Store first product ID for later testing - handle both _id and id fields
                    first_product = products[0]
                    self.product_id = first_product.get('id') or first_product.get('_id')
                    product_count = len(products)
                    self.log_result("Get All Products", True, f"Retrieved {product_count} products")
                    return True
                else:
                    self.log_result("Get All Products", False, "No products returned or invalid format")
                    return False
            except Exception as e:
                self.log_result("Get All Products", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Get All Products", False, f"Request failed with status: {status_code}")
            return False

    def test_get_products_by_category(self):
        """Test getting products by category"""
        success_count = 0
        
        for category in ['buy', 'rent']:
            response = self.make_request('GET', '/products', params={'category': category})
            
            if response and response.status_code == 200:
                try:
                    products = response.json()
                    if isinstance(products, list):
                        product_count = len(products)
                        self.log_result(f"Get Products by Category ({category})", True, f"Retrieved {product_count} {category} products")
                        success_count += 1
                    else:
                        self.log_result(f"Get Products by Category ({category})", False, "Invalid response format")
                except Exception as e:
                    self.log_result(f"Get Products by Category ({category})", False, f"JSON parse error: {str(e)}")
            else:
                status_code = response.status_code if response else "No Response"
                self.log_result(f"Get Products by Category ({category})", False, f"Request failed with status: {status_code}")
        
        return success_count == 2

    def test_get_product_by_id(self):
        """Test getting specific product"""
        if not self.product_id:
            self.log_result("Get Product by ID", False, "No product ID available from previous test")
            return False
            
        response = self.make_request('GET', f'/products/{self.product_id}')
        
        if response and response.status_code == 200:
            try:
                product = response.json()
                product_id_match = product.get('id') == self.product_id or product.get('_id') == self.product_id
                if isinstance(product, dict) and product_id_match:
                    product_name = product.get('name', 'Unknown')
                    self.log_result("Get Product by ID", True, f"Retrieved product: {product_name}")
                    return True
                else:
                    self.log_result("Get Product by ID", False, "Invalid product data or ID mismatch", product)
                    return False
            except Exception as e:
                self.log_result("Get Product by ID", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Get Product by ID", False, f"Request failed with status: {status_code}")
            return False

    def test_get_kits(self):
        """Test getting all kits"""
        response = self.make_request('GET', '/kits')
        
        if response and response.status_code == 200:
            try:
                kits = response.json()
                if isinstance(kits, list):
                    if len(kits) > 0:
                        first_kit = kits[0]
                        self.kit_id = first_kit.get('id') or first_kit.get('_id')
                        kit_count = len(kits)
                        self.log_result("Get All Kits", True, f"Retrieved {kit_count} kits")
                        return True
                    else:
                        self.log_result("Get All Kits", True, "No kits available but endpoint working")
                        return True
                else:
                    self.log_result("Get All Kits", False, "Invalid response format")
                    return False
            except Exception as e:
                self.log_result("Get All Kits", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Get All Kits", False, f"Request failed with status: {status_code}")
            return False

    def test_get_kit_by_id(self):
        """Test getting specific kit"""
        if not self.kit_id:
            self.log_result("Get Kit by ID", True, "No kit ID available - skipping test (no kits in database)")
            return True
            
        response = self.make_request('GET', f'/kits/{self.kit_id}')
        
        if response and response.status_code == 200:
            try:
                kit = response.json()
                kit_id_match = kit.get('id') == self.kit_id or kit.get('_id') == self.kit_id
                if isinstance(kit, dict) and kit_id_match:
                    kit_name = kit.get('name', 'Unknown')
                    self.log_result("Get Kit by ID", True, f"Retrieved kit: {kit_name}")
                    return True
                else:
                    self.log_result("Get Kit by ID", False, "Invalid kit data or ID mismatch", kit)
                    return False
            except Exception as e:
                self.log_result("Get Kit by ID", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Get Kit by ID", False, f"Request failed with status: {status_code}")
            return False

    def test_create_order(self):
        """Test creating an order"""
        if not self.user_id or not self.product_id:
            self.log_result("Create Order", False, "Missing user ID or product ID from previous tests")
            return False
            
        # Need to get product details first for creating proper OrderItem
        product_response = self.make_request('GET', f'/products/{self.product_id}')
        if not product_response or product_response.status_code != 200:
            self.log_result("Create Order", False, "Failed to get product details for order creation")
            return False
            
        product = product_response.json()
        price = product.get('selling_price') or product.get('mrp', 0)
        
        order_data = {
            "user_id": self.user_id,
            "items": [{
                "product_id": self.product_id,
                "product_name": product.get('name', 'Unknown Product'),
                "quantity": 2,
                "price": price,
                "image": product.get('image', '')
            }],
            "address": {
                "name": "Sarah Medical Centre",
                "phone": PHONE_NUMBER,
                "address_line1": "456 Healthcare Avenue",
                "address_line2": "Medical District",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "is_default": True
            },
            "payment_method": "UPI"
        }
        
        response = self.make_request('POST', '/orders', order_data)
        
        if response and response.status_code == 200:
            try:
                resp_data = response.json()
                # The API returns the order directly, not wrapped in success
                if isinstance(resp_data, dict) and ('_id' in resp_data or 'id' in resp_data):
                    order_id = resp_data.get('_id') or resp_data.get('id')
                    if order_id:
                        self.order_id = order_id
                        total_amount = resp_data.get('total', 0)
                        self.log_result("Create Order", True, f"Order created with ID: {self.order_id}, Total: ₹{total_amount}")
                        return True
                    else:
                        self.log_result("Create Order", False, "Missing order ID", resp_data)
                        return False
                else:
                    self.log_result("Create Order", False, "Invalid response format", resp_data)
                    return False
            except Exception as e:
                self.log_result("Create Order", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Create Order", False, f"Request failed with status: {status_code}")
            return False

    def test_get_user_orders(self):
        """Test getting user orders"""
        if not self.user_id:
            self.log_result("Get User Orders", False, "No user ID available from previous tests")
            return False
            
        response = self.make_request('GET', f'/orders/user/{self.user_id}')
        
        if response and response.status_code == 200:
            try:
                orders = response.json()
                if isinstance(orders, list):
                    order_count = len(orders)
                    self.log_result("Get User Orders", True, f"Retrieved {order_count} orders for user")
                    return True
                else:
                    self.log_result("Get User Orders", False, "Invalid response format")
                    return False
            except Exception as e:
                self.log_result("Get User Orders", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Get User Orders", False, f"Request failed with status: {status_code}")
            return False

    def test_create_rental(self):
        """Test creating a rental"""
        if not self.user_id or not self.product_id:
            self.log_result("Create Rental", False, "Missing user ID or product ID from previous tests")
            return False
            
        rental_data = {
            "user_id": self.user_id,
            "product_id": self.product_id,
            "rental_duration": 30,  # 30 days for monthly
            "rental_type": "monthly",
            "address": {
                "name": "Sarah Medical Centre",
                "phone": PHONE_NUMBER,
                "address_line1": "456 Healthcare Avenue",
                "address_line2": "Medical District",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "is_default": True
            },
            "payment_method": "UPI"
        }
        
        response = self.make_request('POST', '/rentals', rental_data)
        
        if response and response.status_code == 200:
            try:
                resp_data = response.json()
                # The API returns the rental directly, not wrapped in success
                if isinstance(resp_data, dict) and ('_id' in resp_data or 'id' in resp_data):
                    rental_id = resp_data.get('_id') or resp_data.get('id')
                    if rental_id:
                        self.rental_id = rental_id
                        total_amount = resp_data.get('total', 0)
                        self.log_result("Create Rental", True, f"Rental created with ID: {self.rental_id}, Total: ₹{total_amount}")
                        return True
                    else:
                        self.log_result("Create Rental", False, "Missing rental ID", resp_data)
                        return False
                else:
                    self.log_result("Create Rental", False, "Invalid response format", resp_data)
                    return False
            except Exception as e:
                self.log_result("Create Rental", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Create Rental", False, f"Request failed with status: {status_code}")
            return False

    def test_get_user_rentals(self):
        """Test getting user rentals"""
        if not self.user_id:
            self.log_result("Get User Rentals", False, "No user ID available from previous tests")
            return False
            
        response = self.make_request('GET', f'/rentals/user/{self.user_id}')
        
        if response and response.status_code == 200:
            try:
                rentals = response.json()
                if isinstance(rentals, list):
                    rental_count = len(rentals)
                    self.log_result("Get User Rentals", True, f"Retrieved {rental_count} rentals for user")
                    return True
                else:
                    self.log_result("Get User Rentals", False, "Invalid response format")
                    return False
            except Exception as e:
                self.log_result("Get User Rentals", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Get User Rentals", False, f"Request failed with status: {status_code}")
            return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.user_id:
            self.log_result("Get User Profile", False, "No user ID available from previous tests")
            return False
            
        response = self.make_request('GET', f'/users/{self.user_id}')
        
        if response and response.status_code == 200:
            try:
                user = response.json()
                user_id_match = user.get('id') == self.user_id or user.get('_id') == self.user_id
                if isinstance(user, dict) and user_id_match:
                    user_name = user.get('name', 'Unknown')
                    self.log_result("Get User Profile", True, f"Retrieved user profile: {user_name}")
                    return True
                else:
                    self.log_result("Get User Profile", False, "Invalid user data or ID mismatch", user)
                    return False
            except Exception as e:
                self.log_result("Get User Profile", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Get User Profile", False, f"Request failed with status: {status_code}")
            return False

    def test_update_user_profile(self):
        """Test updating user profile"""
        if not self.user_id:
            self.log_result("Update User Profile", False, "No user ID available from previous tests")
            return False
            
        update_data = {
            "name": "Sarah Medical Professional",
            "email": "sarah.medical@jazlinecare.com"
        }
        
        response = self.make_request('PUT', f'/users/{self.user_id}', update_data)
        
        if response and response.status_code == 200:
            try:
                resp_data = response.json()
                # The API returns the user directly, not wrapped in success
                if isinstance(resp_data, dict) and ('name' in resp_data or '_id' in resp_data):
                    updated_name = resp_data.get('name', 'Unknown')
                    self.log_result("Update User Profile", True, f"Profile updated: {updated_name}")
                    return True
                else:
                    self.log_result("Update User Profile", False, "Invalid response format", resp_data)
                    return False
            except Exception as e:
                self.log_result("Update User Profile", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Update User Profile", False, f"Request failed with status: {status_code}")
            return False

    def test_add_user_address(self):
        """Test adding user address"""
        if not self.user_id:
            self.log_result("Add User Address", False, "No user ID available from previous tests")
            return False
            
        address_data = {
            "name": "Home Address",
            "phone": PHONE_NUMBER,
            "address_line1": "789 Medical Complex",
            "address_line2": "Healthcare Zone",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400002",
            "is_default": False
        }
        
        response = self.make_request('POST', f'/users/{self.user_id}/addresses', address_data)
        
        if response and response.status_code == 200:
            try:
                resp_data = response.json()
                if resp_data.get('success'):
                    self.log_result("Add User Address", True, "Address added successfully")
                    return True
                else:
                    self.log_result("Add User Address", False, "Missing success flag", resp_data)
                    return False
            except Exception as e:
                self.log_result("Add User Address", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("Add User Address", False, f"Request failed with status: {status_code}")
            return False

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        admin_endpoints = [
            ('/admin/orders', 'Get Admin Orders'),
            ('/admin/rentals', 'Get Admin Rentals'),
            ('/admin/analytics', 'Get Admin Analytics')
        ]
        
        success_count = 0
        for endpoint, test_name in admin_endpoints:
            response = self.make_request('GET', endpoint)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, (list, dict)):
                        self.log_result(test_name, True, "Admin endpoint accessible")
                        success_count += 1
                    else:
                        self.log_result(test_name, False, "Invalid response format")
                except Exception as e:
                    self.log_result(test_name, False, f"JSON parse error: {str(e)}")
            else:
                status_code = response.status_code if response else "No Response"
                self.log_result(test_name, False, f"Request failed with status: {status_code}")
        
        return success_count == 3

    def test_emi_calculator(self):
        """Test EMI calculator"""
        emi_data = {
            "amount": 65000,
            "tenure": 12
        }
        
        response = self.make_request('POST', '/calculate-emi', emi_data)
        
        if response and response.status_code == 200:
            try:
                resp_data = response.json()
                if 'emi' in resp_data or 'monthly_emi' in resp_data:
                    emi_amount = resp_data.get('emi') or resp_data.get('monthly_emi', 0)
                    self.log_result("EMI Calculator", True, f"EMI calculated: ₹{emi_amount} for ₹65,000 over 12 months")
                    return True
                else:
                    self.log_result("EMI Calculator", False, "Missing EMI data in response", resp_data)
                    return False
            except Exception as e:
                self.log_result("EMI Calculator", False, f"JSON parse error: {str(e)}")
                return False
        else:
            status_code = response.status_code if response else "No Response"
            self.log_result("EMI Calculator", False, f"Request failed with status: {status_code}")
            return False

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("Starting Comprehensive Backend API Testing for Jazline Home Care")
        print(f"🌐 Base URL: {BASE_URL}")
        print(f"📱 Test Phone: {PHONE_NUMBER}")
        print("="*80)
        
        tests = [
            self.test_api_root,
            self.test_send_otp,
            self.test_verify_otp,
            self.test_get_all_products,
            self.test_get_products_by_category,
            self.test_get_product_by_id,
            self.test_get_kits,
            self.test_get_kit_by_id,
            self.test_create_order,
            self.test_get_user_orders,
            self.test_create_rental,
            self.test_get_user_rentals,
            self.test_get_user_profile,
            self.test_update_user_profile,
            self.test_add_user_address,
            self.test_admin_endpoints,
            self.test_emi_calculator
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            time.sleep(0.5)  # Small delay between tests
        
        print("="*80)
        print(f"📊 FINAL RESULTS: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            print("ALL TESTS PASSED - Backend APIs are fully functional!")
        else:
            print("SOME TESTS FAILED - Review the results above for details")
        
        return passed == total

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)