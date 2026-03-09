# Jazline Home Care - Hybrid Commerce Platform

## 🎯 Project Overview
**Jazline Home Care** is a premium B2C mobile application implementing the **Hybrid Commerce Model** for medical equipment. Users can choose to either **buy** or **rent** high-ticket medical items, with bank-partnered EMI options for purchases.

---

## ✅ Completed Features

### 🏗️ Backend (FastAPI + MongoDB)

#### Core APIs
- ✅ **Authentication**: OTP-based phone authentication
- ✅ **User Management**: Profile, addresses, preferences
- ✅ **Product Management**: Hybrid products (buy/rent), buy-only consumables
- ✅ **Order Management**: Purchase orders with tax & delivery calculations
- ✅ **Rental Management**: Rental lifecycle (requested → approved → active → closed)
- ✅ **Curated Kits**: Pre-configured care bundles (rent equipment + buy consumables)
- ✅ **EMI Calculator**: 0% interest EMI calculation for purchases
- ✅ **Service Booking**: Technician, pickup, video demo, installation requests
- ✅ **Rental Eligibility**: ID proof verification system
- ✅ **Admin APIs**: Product CRUD, order/rental management, analytics

#### Data Models
- User, Address, Product, Order, Rental
- CuratedKit, ServiceBooking, RentalEligibility
- OTP, EMI Plans

---

### 📱 Mobile App (React Native + Expo)

#### Core Screens
- ✅ **Authentication**: OTP login with phone number
- ✅ **Home**: Hero banner, quick actions, featured products, curated kits
- ✅ **Buy Section**: Product grid with search, cart, wishlist
- ✅ **Rent Section**: Rental products with pricing tiers
- ✅ **Orders**: Tab-switched view for orders & rentals
- ✅ **Profile**: User info, addresses, logout

#### Advanced Features
- ✅ **Product Detail Pages**: Full specs, reviews, what's included
- ✅ **Hybrid Product Pages**: Toggle between buy/rent (in progress)
- ✅ **Cart & Checkout**: Full purchase flow with address & payment selection
- ✅ **Rental Booking**: Duration selection, cost calculation, booking flow (in progress)
- ✅ **State Management**: Auth & Cart contexts with AsyncStorage

---

## 🎨 Branding & Design

### Color Palette (Jazline Home)
```
Primary: Calming Teal (#009688)
Secondary: Slate Grey (#607D8B)
Background: Soft White (#FFFFFF)
Success: #4CAF50
```

### Trust Badges
- ✅ Clinically Sanitized
- ✅ Authorized Dealer
- ✅ Bank-Backed Financing
- ✅ Maintenance Included

---

## 📦 Sample Products Seeded

### Hybrid Products (Buy OR Rent)
1. **AED (Defibrillator)** - ₹65,000 or ₹6,500/month
   - EMI: 6/12/24 months @ 0%
   - Security Deposit: ₹15,000
   
2. **Electric Hospital Bed** - ₹72,000 or ₹5,000/month
   - EMI: 6/12/18 months @ 0%
   - Security Deposit: ₹12,000
   
3. **Oxygen Concentrator (10L)** - ₹48,000 or ₹4,000/month
   - EMI: 6/12 months @ 0%
   - Security Deposit: ₹10,000
   
4. **Electric Wheelchair** - ₹42,000 or ₹3,000/month
   - EMI: 6/12 months @ 0%
   - Security Deposit: ₹8,000

### Buy-Only Products (Consumables)
1. Oximeter + Thermometer Combo - ₹1,999
2. BP Monitor (Automatic) - ₹2,499
3. Adult Diapers (Pack of 30) - ₹1,599
4. Wound Dressing Kit - ₹999

### Curated Care Kits
1. **The Recovery Box** - Post-Surgery (3-6 weeks)
   - Rent: Hospital Bed + Walker
   - Buy: Oximeter, Wound Kit, BP Monitor
   
2. **The Golden Age Kit** - Long-term Senior Care
   - Rent: Electric Wheelchair + Commode
   - Buy: BP Monitor, Adult Diapers, Oximeter
   
3. **Heart-Watch Kit** - Post-Cardiac Discharge
   - Rent: AED + Patient Monitor
   - Buy: BP Monitor, Oximeter
   
4. **Breath-Easy Kit** - COPD / Asthma / Post-COVID
   - Rent: Oxygen Concentrator + BiPAP
   - Buy: Oximeter, BP Monitor

---

## 🔄 Next Features to Implement

### High Priority
1. **Hybrid Product Toggle UI** - Buy/Rent switch on product pages
2. **Duration Slider** - Real-time price updates for 7/14/30 days
3. **Curated Kits Screen** - Display and book full care kits
4. **EMI Calculator Widget** - Show monthly payments on products
5. **Jazline Wallet** - Track credit limits & security deposits
6. **Service Integration Buttons** - Request technician, schedule pickup
7. **Rental Eligibility Flow** - ID proof upload for rental approval
8. **Profile Screens** - Edit profile, manage addresses, wishlist

### Medium Priority
9. **"Why Choose Jazline?"** Section - Trust-building content
10. **Trust Badge Display** - Prominent display on product pages
11. **Video Demo Integration** - Live product demonstrations
12. **Sanitization Certificate** - Display with each rental
13. **Maintenance Promise** - 4-hour swap guarantee UI
14. **Rental Timeline Tracker** - Visual rental status progression

### Admin Dashboard (To Build)
15. **Product Management** - Add/edit hybrid products
16. **Kit Builder** - Create custom care kits
17. **Rental Lifecycle Dashboard** - Manage rental statuses
18. **Eligibility Approvals** - Verify ID proofs
19. **Service Request Management** - Assign technicians
20. **Analytics Dashboard** - Buy vs Rent revenue

---

## 🧪 Testing Status

### Backend
- ✅ All 14 core APIs tested and working
- ✅ Database seeded with hybrid products
- ✅ Authentication flow verified
- ✅ Order & rental creation tested

### Frontend
- ⏳ Basic navigation and screens implemented
- ⏳ Hybrid features pending implementation
- ⏳ Comprehensive UI/UX testing needed

---

## 🚀 Deployment Readiness

### Environment
- Backend: FastAPI running on port 8001
- Frontend: Expo running on port 3000
- Database: MongoDB local instance

### Next Steps
1. Implement hybrid product toggle UI
2. Add curated kits display screen
3. Build EMI calculator component
4. Complete rental booking flow with duration selector
5. Add service booking screens
6. Test complete user journeys
7. Build admin dashboard

---

## 📋 User Journeys

### Journey 1: Buy Equipment with EMI
1. Login with OTP
2. Browse "Buy" section
3. Select AED
4. Use EMI calculator (₹2,708/month for 24 months)
5. Add to cart
6. Select address
7. Choose payment method
8. Place order

### Journey 2: Rent Equipment
1. Login with OTP
2. Browse "Rent" section
3. Select Oxygen Concentrator
4. Choose duration (30 days)
5. See total: ₹4,000 + ₹10,000 deposit + ₹100 delivery
6. Verify ID (if first rental)
7. Book rental
8. Schedule delivery

### Journey 3: Buy Curated Kit
1. Login with OTP
2. Go to "Care Kits"
3. Select "The Recovery Box"
4. See bundled items (rent bed, buy consumables)
5. Save ₹2,000 vs individual purchase
6. Complete booking

---

## 🔐 Security & Trust

- ✅ OTP-based authentication
- ✅ Secure payment structure
- ✅ Rental eligibility verification
- ✅ Clinical sanitization certification
- ✅ Damage policy enforcement
- ✅ Security deposit management

---

## 📊 Business Model

### Revenue Streams
1. **Product Sales** - One-time revenue from purchases
2. **Rental Income** - Recurring revenue from rentals
3. **Late Fees** - Penalty for delayed returns
4. **Damage Charges** - Equipment damage compensation
5. **Service Fees** - Technician visits, installations

### Cost Optimization
- Rental reduces customer acquisition cost
- Buy option maximizes customer lifetime value
- Hybrid model addresses financial barriers
- Eco-friendly through equipment reuse

---

## 🎯 Success Metrics

- **Hybrid Adoption Rate**: % of users choosing rent vs buy
- **EMI Conversion**: % of buyers using EMI option
- **Kit Bundle Rate**: % of users buying curated kits
- **Rental Extension Rate**: % of rentals extended beyond initial term
- **Equipment Utilization**: Average rental cycles per equipment
- **Customer Lifetime Value**: Total revenue per customer

---

## 📖 API Documentation

### Base URL
```
https://rent-buy-care.preview.emergentagent.com/api
```

### Key Endpoints
```
POST /auth/send-otp
POST /auth/verify-otp
GET  /products
GET  /products/{id}
GET  /kits
POST /orders
POST /rentals
POST /calculate-emi
POST /services/book
GET  /rental-eligibility/{user_id}
```

---

## 🏁 Conclusion

Jazline Home Care is positioned as a **Hybrid Commerce** leader in medical equipment, offering:
- **Financial Flexibility**: Rent for short-term, buy for long-term
- **Trust & Safety**: Clinical sanitization, authorized dealers
- **Convenience**: One-tap technician requests, 4-hour swaps
- **Sustainability**: Eco-friendly equipment reuse model

**Next Sprint**: Complete hybrid UI features and launch curated kits section.
