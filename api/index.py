from fastapi import FastAPI, APIRouter, HTTPException, Body, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import random
import jwt
import bcrypt
import httpx

import sys
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR))
load_dotenv(ROOT_DIR / '.env')

# Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'jazline_super_secret_2026')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 168  # 7 days
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

# MongoDB connection (falls back to in-memory if MongoDB is not available)
mongo_url = os.environ.get('DATABASE_URL', os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
db_name = os.environ.get('DB_NAME', 'jazline')

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    import pymongo
    # Quick connectivity check
    test_client = pymongo.MongoClient(mongo_url, serverSelectionTimeoutMS=2000)
    test_client.server_info()
    test_client.close()
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logging.info(f"✅ Connected to MongoDB successfully! ({db_name})")
except Exception as e:
    logging.warning(f"⚠️ MongoDB not available ({e}). Using in-memory database instead.")
    from memory_db import InMemoryClient
    client = InMemoryClient()
    db = client[db_name]

# Create the main app without a prefix
app = FastAPI()

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api")
async def api_root():
    return {"message": "Jazline Medical Supplies API", "version": "1.0"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static product images
static_dir = ROOT_DIR / 'static'
if static_dir.exists():
    app.mount('/static', StaticFiles(directory=str(static_dir)), name='static')

# ==================== SEEDING LOGIC ====================

async def seed_if_empty():
    """Seed the database with initial items if it is empty."""
    try:
        count = await db.products.count_documents({})
        if count == 0:
            logging.info("Database is empty. Seeding initial data...")
            from seed_hybrid_data import HYBRID_PRODUCTS, BUY_ONLY_PRODUCTS, CURATED_KITS
            
            if HYBRID_PRODUCTS:
                await db.products.insert_many(HYBRID_PRODUCTS)
            if BUY_ONLY_PRODUCTS:
                await db.products.insert_many(BUY_ONLY_PRODUCTS)
            if CURATED_KITS:
                await db.kits.insert_many(CURATED_KITS)
            logging.info("✅ Database seeded successfully!")
    except Exception as e:
        logging.error(f"Failed to seed database: {e}")

@app.on_event("startup")
async def startup_event():
    """Run all startup tasks safely."""
    try:
        logging.info("🚀 Jazline API Starting Up...")
        await seed_if_empty()
    except Exception as e:
        logging.error(f"Startup task failed (soft failure): {e}")

# Security
security = HTTPBearer(auto_error=False)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== JWT HELPERS ====================

def create_jwt_token(user_id: str, email: str, name: str = '') -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'name': name,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token has expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    payload = verify_jwt_token(credentials.credentials)
    return payload

# ==================== MODELS ====================

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    is_default: bool = False

class User(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    phone: Optional[str] = ""
    name: Optional[str] = ""
    email: Optional[str] = ""
    password_hash: Optional[str] = None
    auth_provider: str = "email"  # "email", "google", "phone"
    google_id: Optional[str] = None
    profile_picture: Optional[str] = None
    addresses: List[Address] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Product Models
class Product(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    name: str
    description: str
    whats_included: List[str] = []
    category: str  # "hybrid", "buy_only", "rent_only", or "kit"
    product_type: str  # "equipment", "consumable", "kit"
    image: str  # base64 image
    images: List[str] = []  # Multiple images
    mrp: float
    selling_price: Optional[float] = None  # For buy products
    rental_price_per_day: Optional[float] = None
    rental_price_per_week: Optional[float] = None
    rental_price_per_month: Optional[float] = None
    security_deposit: Optional[float] = None
    stock: int = 0
    reviews: List[Dict[str, Any]] = []
    average_rating: float = 0.0
    damage_policy: Optional[str] = ""
    late_fee_per_day: Optional[float] = 0.0
    maintenance_included: bool = True
    sanitization_certified: bool = True
    emi_available: bool = False
    emi_plans: List[Dict[str, Any]] = []  # EMI options
    is_active: bool = True
    tags: List[str] = []
    best_for: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Curated Kit Model
class CuratedKit(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    name: str
    description: str
    image: str
    best_for: str
    rent_items: List[Dict[str, Any]] = []  # {product_id, product_name, quantity}
    buy_items: List[Dict[str, Any]] = []   # {product_id, product_name, quantity}
    total_rent_price: float
    total_buy_price: float
    security_deposit: float
    savings: float  # Amount saved by buying kit
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Service Booking Model
class ServiceBooking(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: str
    service_type: str  # "technician", "pickup", "video_demo", "installation"
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    scheduled_date: datetime
    scheduled_time: str
    address: Address
    status: str = "requested"  # "requested", "confirmed", "completed", "cancelled"
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Rental Eligibility Model
class RentalEligibility(BaseModel):
    user_id: str
    id_proof_type: str  # "aadhar", "pan", "driving_license"
    id_proof_number: str
    id_proof_image: str  # base64
    is_verified: bool = False
    verified_at: Optional[datetime] = None

# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    image: str

class Order(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: str
    items: List[OrderItem]
    subtotal: float
    tax: float
    delivery_charges: float
    total: float
    address: Address
    payment_method: str  # "UPI", "CARD", "COD"
    payment_status: str = "pending"  # "pending", "paid", "failed"
    order_status: str = "placed"  # "placed", "confirmed", "shipped", "delivered", "cancelled"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Rental Models
class Rental(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: str
    product_id: str
    product_name: str
    product_image: str
    rental_duration: int  # in days
    rental_type: str  # "weekly" or "monthly"
    rental_price: float
    gst: float = 0.0
    security_deposit: float
    delivery_charges: float
    total: float
    address: Address
    payment_method: str
    payment_status: str = "pending"
    rental_status: str = "requested"  # "requested", "approved", "out_for_delivery", "active", "return_requested", "inspected", "closed"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    actual_return_date: Optional[datetime] = None
    late_fee: float = 0.0
    damage_fee: float = 0.0
    refund_amount: float = 0.0
    agreement_accepted: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# OTP Model
class OTP(BaseModel):
    phone: str
    otp: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime

# Request Models
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class CreateOrderRequest(BaseModel):
    user_id: str
    items: List[OrderItem]
    address: Address
    payment_method: str

class CreateRentalRequest(BaseModel):
    user_id: str
    product_id: str
    rental_duration: int
    rental_type: str
    address: Address
    payment_method: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class UpdateRentalStatusRequest(BaseModel):
    status: str
    damage_fee: Optional[float] = 0.0

# ==================== HELPER FUNCTIONS ====================

def calculate_tax(subtotal: float) -> float:
    return round(subtotal * 0.18, 2)  # 18% GST

def calculate_delivery_charges(subtotal: float) -> float:
    if subtotal > 500:
        return 0.0
    return 50.0

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/signup")
async def signup(request: SignupRequest):
    """Register a new user with email and password"""
    try:
        # Check if email already exists
        existing = await db.users.find_one({"email": request.email.lower()})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered. Please login.")
        
        # Create user
        new_user = {
            "name": request.name,
            "email": request.email.lower(),
            "phone": "",
            "password_hash": hash_password(request.password),
            "auth_provider": "email",
            "profile_picture": None,
            "addresses": [],
            "created_at": datetime.utcnow()
        }
        result = await db.users.insert_one(new_user)
        user = await db.users.find_one({"_id": result.inserted_id})
        user["_id"] = str(user["_id"])
        
        # Generate JWT
        token = create_jwt_token(user["_id"], user["email"], user.get("name", ""))
        
        # Remove password hash before sending back
        user.pop("password_hash", None)
        
        return {"success": True, "user": user, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    """Login with email and password"""
    try:
        user = await db.users.find_one({"email": request.email.lower()})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check password
        if not user.get("password_hash"):
            raise HTTPException(status_code=401, detail="This account uses Google Sign-In. Please login with Google.")
        
        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user["_id"] = str(user["_id"])
        
        # Generate JWT
        token = create_jwt_token(user["_id"], user["email"], user.get("name", ""))
        
        user.pop("password_hash", None)
        
        return {"success": True, "user": user, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/google")
async def google_auth(request: GoogleAuthRequest):
    """Authenticate with Google ID token"""
    try:
        # Verify Google ID token via Google's tokeninfo endpoint
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={request.id_token}"
            )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        google_data = resp.json()
        
        # Verify audience (Client ID)
        if google_data.get("aud") != GOOGLE_CLIENT_ID:
            logging.warning(f"Google Token audience mismatch: {google_data.get('aud')} != {GOOGLE_CLIENT_ID}")
            # raise HTTPException(status_code=401, detail="Token audience mismatch")

        google_email = google_data.get("email", "").lower()
        google_name = google_data.get("name", google_data.get("given_name", ""))
        google_picture = google_data.get("picture", "")
        google_sub = google_data.get("sub", "")
        
        if not google_email:
            raise HTTPException(status_code=400, detail="Could not get email from Google")
        
        # Find or create user
        user = await db.users.find_one({"email": google_email})
        if user:
            # Update Google info
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "google_id": google_sub,
                    "profile_picture": google_picture,
                    "name": google_name if not user.get("name") else user["name"],
                    "auth_provider": "google" if not user.get("password_hash") else user.get("auth_provider", "google"),
                }}
            )
            user = await db.users.find_one({"_id": user["_id"]})
        else:
            new_user = {
                "name": google_name,
                "email": google_email,
                "phone": "",
                "password_hash": None,
                "auth_provider": "google",
                "google_id": google_sub,
                "profile_picture": google_picture,
                "addresses": [],
                "created_at": datetime.utcnow()
            }
            result = await db.users.insert_one(new_user)
            user = await db.users.find_one({"_id": result.inserted_id})
        
        user["_id"] = str(user["_id"])
        token = create_jwt_token(user["_id"], user["email"], user.get("name", ""))
        user.pop("password_hash", None)
        
        return {"success": True, "user": user, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user from JWT token"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to phone number (Mock implementation)"""
    try:
        otp_code = str(random.randint(100000, 999999))
        await db.otps.delete_many({"phone": request.phone})
        otp_data = {
            "phone": request.phone,
            "otp": otp_code,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        }
        await db.otps.insert_one(otp_data)
        logging.info(f"OTP for {request.phone}: {otp_code}")
        return {"success": True, "message": "OTP sent successfully", "otp": otp_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and create/login user"""
    try:
        otp_doc = await db.otps.find_one({
            "phone": request.phone,
            "otp": request.otp,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        if not otp_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        await db.otps.delete_one({"_id": otp_doc["_id"]})
        user = await db.users.find_one({"phone": request.phone})
        if not user:
            new_user = {
                "phone": request.phone,
                "name": "",
                "email": "",
                "auth_provider": "phone",
                "addresses": [],
                "created_at": datetime.utcnow()
            }
            result = await db.users.insert_one(new_user)
            user = await db.users.find_one({"_id": result.inserted_id})
        user["_id"] = str(user["_id"])
        token = create_jwt_token(user["_id"], user.get("email", ""), user.get("name", ""))
        user.pop("password_hash", None)
        return {"success": True, "user": user, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== USER ROUTES ====================

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user["_id"] = str(user["_id"])
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, request: UpdateProfileRequest):
    try:
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        if update_data:
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        user["_id"] = str(user["_id"])
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/{user_id}/addresses")
async def add_address(user_id: str, address: Address):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        addresses = user.get("addresses", [])
        
        # If this is the first address or marked as default, set as default
        if not addresses or address.is_default:
            for addr in addresses:
                addr["is_default"] = False
            address.is_default = True
        
        addresses.append(address.dict())
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"addresses": addresses}}
        )
        return {"success": True, "address": address}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products")
async def get_products(category: Optional[str] = None):
    try:
        query = {"is_active": True}
        if category:
            query["category"] = category
        
        products = await db.products.find(query).to_list(1000)
        for product in products:
            product["_id"] = str(product["_id"])
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product["_id"] = str(product["_id"])
        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ORDER ROUTES ====================

@api_router.post("/orders")
async def create_order(request: CreateOrderRequest):
    try:
        subtotal = sum(item.price * item.quantity for item in request.items)
        tax = calculate_tax(subtotal)
        delivery_charges = calculate_delivery_charges(subtotal)
        total = subtotal + tax + delivery_charges
        
        order_data = {
            "user_id": request.user_id,
            "items": [item.dict() for item in request.items],
            "subtotal": subtotal,
            "tax": tax,
            "delivery_charges": delivery_charges,
            "total": total,
            "address": request.address.dict(),
            "payment_method": request.payment_method,
            "payment_status": "paid" if request.payment_method != "COD" else "pending",
            "order_status": "placed",
            "created_at": datetime.utcnow()
        }
        
        result = await db.orders.insert_one(order_data)
        order_data["_id"] = str(result.inserted_id)
        
        # Update stock
        for item in request.items:
            await db.products.update_one(
                {"_id": ObjectId(item.product_id)},
                {"$inc": {"stock": -item.quantity}}
            )
        
        return order_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/orders/user/{user_id}")
async def get_user_orders(user_id: str):
    try:
        orders = await db.orders.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
        for order in orders:
            order["_id"] = str(order["_id"])
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RENTAL ROUTES ====================

@api_router.post("/rentals")
async def create_rental(request: CreateRentalRequest):
    try:
        product = await db.products.find_one({"_id": ObjectId(request.product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Calculate rental price
        if request.rental_type == "weekly":
            rental_price = product["rental_price_per_week"] * (request.rental_duration / 7)
        else:
            rental_price = product["rental_price_per_month"] * (request.rental_duration / 30)
        
        gst = round(rental_price * 0.18, 2)
        delivery_charges = 100.0  # Fixed for rentals
        security_deposit = product["security_deposit"]
        total = rental_price + gst + security_deposit + delivery_charges
        
        rental_data = {
            "user_id": request.user_id,
            "product_id": request.product_id,
            "product_name": product["name"],
            "product_image": product["image"],
            "rental_duration": request.rental_duration,
            "rental_type": request.rental_type,
            "rental_price": rental_price,
            "gst": gst,
            "security_deposit": security_deposit,
            "delivery_charges": delivery_charges,
            "total": total,
            "address": request.address.dict(),
            "payment_method": request.payment_method,
            "payment_status": "paid",
            "rental_status": "requested",
            "late_fee": 0.0,
            "damage_fee": 0.0,
            "refund_amount": 0.0,
            "agreement_accepted": True,
            "created_at": datetime.utcnow()
        }
        
        result = await db.rentals.insert_one(rental_data)
        rental_data["_id"] = str(result.inserted_id)
        
        return rental_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/rentals/user/{user_id}")
async def get_user_rentals(user_id: str):
    try:
        rentals = await db.rentals.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
        for rental in rentals:
            rental["_id"] = str(rental["_id"])
        return rentals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/rentals/{rental_id}/status")
async def update_rental_status(rental_id: str, request: UpdateRentalStatusRequest):
    try:
        update_data = {"rental_status": request.status}
        
        if request.status == "approved":
            update_data["start_date"] = datetime.utcnow()
            # Calculate end date based on rental duration
            rental = await db.rentals.find_one({"_id": ObjectId(rental_id)})
            update_data["end_date"] = datetime.utcnow() + timedelta(days=rental["rental_duration"])
        
        if request.status == "inspected":
            update_data["damage_fee"] = request.damage_fee
            rental = await db.rentals.find_one({"_id": ObjectId(rental_id)})
            refund = rental["security_deposit"] - request.damage_fee
            update_data["refund_amount"] = refund
        
        await db.rentals.update_one(
            {"_id": ObjectId(rental_id)},
            {"$set": update_data}
        )
        
        rental = await db.rentals.find_one({"_id": ObjectId(rental_id)})
        rental["_id"] = str(rental["_id"])
        return rental
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/rentals/{rental_id}/return")
async def request_return(rental_id: str):
    try:
        await db.rentals.update_one(
            {"_id": ObjectId(rental_id)},
            {"$set": {"rental_status": "return_requested"}}
        )
        rental = await db.rentals.find_one({"_id": ObjectId(rental_id)})
        rental["_id"] = str(rental["_id"])
        return rental
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ADMIN ROUTES ====================

@api_router.post("/admin/products")
async def create_product(product: Product):
    try:
        product_dict = product.dict(by_alias=True, exclude={"id"})
        result = await db.products.insert_one(product_dict)
        product_dict["_id"] = str(result.inserted_id)
        return product_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product: Product):
    try:
        product_dict = product.dict(by_alias=True, exclude={"id", "created_at"})
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": product_dict}
        )
        updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
        updated_product["_id"] = str(updated_product["_id"])
        return updated_product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str):
    try:
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"is_active": False}}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/orders")
async def get_all_orders():
    try:
        orders = await db.orders.find().sort("created_at", -1).to_list(1000)
        for order in orders:
            order["_id"] = str(order["_id"])
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/rentals")
async def get_all_rentals():
    try:
        rentals = await db.rentals.find().sort("created_at", -1).to_list(1000)
        for rental in rentals:
            rental["_id"] = str(rental["_id"])
        return rentals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/analytics")
async def get_analytics():
    try:
        total_orders = await db.orders.count_documents({})
        total_rentals = await db.rentals.count_documents({})
        
        # Calculate revenue
        orders = await db.orders.find({"payment_status": "paid"}).to_list(10000)
        order_revenue = sum(order.get("total", 0) for order in orders)
        
        rentals = await db.rentals.find({"payment_status": "paid"}).to_list(10000)
        rental_revenue = sum(rental.get("rental_price", 0) for rental in rentals)
        
        return {
            "total_orders": total_orders,
            "total_rentals": total_rentals,
            "order_revenue": order_revenue,
            "rental_revenue": rental_revenue,
            "total_revenue": order_revenue + rental_revenue
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CURATED KITS ROUTES ====================

@api_router.get("/kits")
async def get_kits():
    try:
        kits = await db.kits.find({"is_active": True}).to_list(1000)
        for kit in kits:
            kit["_id"] = str(kit["_id"])
        return kits
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/kits/{kit_id}")
async def get_kit(kit_id: str):
    try:
        kit = await db.kits.find_one({"_id": ObjectId(kit_id)})
        if not kit:
            raise HTTPException(status_code=404, detail="Kit not found")
        kit["_id"] = str(kit["_id"])
        return kit
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/kits")
async def create_kit(kit: CuratedKit):
    try:
        kit_dict = kit.dict(by_alias=True, exclude={"id"})
        result = await db.kits.insert_one(kit_dict)
        kit_dict["_id"] = str(result.inserted_id)
        return kit_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SERVICE BOOKING ROUTES ====================

@api_router.post("/services/book")
async def book_service(booking: ServiceBooking):
    try:
        booking_dict = booking.dict(by_alias=True, exclude={"id"})
        result = await db.service_bookings.insert_one(booking_dict)
        booking_dict["_id"] = str(result.inserted_id)
        return booking_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/services/user/{user_id}")
async def get_user_service_bookings(user_id: str):
    try:
        bookings = await db.service_bookings.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
        for booking in bookings:
            booking["_id"] = str(booking["_id"])
        return bookings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== EMI CALCULATOR ROUTE ====================

@api_router.post("/calculate-emi")
async def calculate_emi(data: dict = Body(...)):
    try:
        principal = data.get("amount", 0)
        tenure_months = data.get("tenure", 12)  # default 12 months
        interest_rate = data.get("interest_rate", 0)  # 0% for now
        
        if interest_rate == 0:
            emi = principal / tenure_months
        else:
            monthly_rate = interest_rate / (12 * 100)
            emi = (principal * monthly_rate * pow(1 + monthly_rate, tenure_months)) / (pow(1 + monthly_rate, tenure_months) - 1)
        
        return {
            "principal": principal,
            "tenure_months": tenure_months,
            "interest_rate": interest_rate,
            "monthly_emi": round(emi, 2),
            "total_amount": round(emi * tenure_months, 2),
            "total_interest": round((emi * tenure_months) - principal, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RENTAL ELIGIBILITY ROUTES ====================

@api_router.post("/rental-eligibility")
async def submit_rental_eligibility(data: RentalEligibility):
    try:
        eligibility_dict = data.dict()
        eligibility_dict["submitted_at"] = datetime.utcnow()
        
        # Check if already exists
        existing = await db.rental_eligibility.find_one({"user_id": data.user_id})
        if existing:
            await db.rental_eligibility.update_one(
                {"user_id": data.user_id},
                {"$set": eligibility_dict}
            )
        else:
            await db.rental_eligibility.insert_one(eligibility_dict)
        
        return {"success": True, "message": "Rental eligibility submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/rental-eligibility/{user_id}")
async def get_rental_eligibility(user_id: str):
    try:
        eligibility = await db.rental_eligibility.find_one({"user_id": user_id})
        if not eligibility:
            return {"verified": False}
        return {
            "verified": eligibility.get("is_verified", False),
            "id_proof_type": eligibility.get("id_proof_type", ""),
            "verified_at": eligibility.get("verified_at", None)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "Jazline Medical Supplies API", "version": "1.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# The secondary startup seed is redundant, relying on the consolidated one.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
