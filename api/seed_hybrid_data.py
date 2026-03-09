import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Product image URLs (served from backend static files)
BASE_IMG_URL = "http://127.0.0.1:8001/static/products"

SAMPLE_IMAGES = {
    "aed": f"{BASE_IMG_URL}/aed.png",
    "hospital_bed": f"{BASE_IMG_URL}/hospital_bed.png",
    "wheelchair": f"{BASE_IMG_URL}/wheelchair.png",
    "oxygen": f"{BASE_IMG_URL}/oxygen_concentrator.png",
    "bipap": f"{BASE_IMG_URL}/oxygen_concentrator.png",
    "walker": f"{BASE_IMG_URL}/wheelchair.png",
    "commode": f"{BASE_IMG_URL}/hospital_bed.png",
    "monitor": f"{BASE_IMG_URL}/bp_monitor.png",
    "consumables": f"{BASE_IMG_URL}/oximeter.png",
    "consumables_bp": f"{BASE_IMG_URL}/bp_monitor.png",
    "consumables_diapers": f"{BASE_IMG_URL}/adult_diapers.png",
    "consumables_wound": f"{BASE_IMG_URL}/wound_kit.png",
    "kit": f"{BASE_IMG_URL}/oximeter.png",
}

# Hybrid Products (Can be both bought and rented)
HYBRID_PRODUCTS = [
    {
        "name": "AED (Automated External Defibrillator)",
        "description": "Professional-grade AED for cardiac emergencies. Bank-partnered EMI available. Rent for events or buy for long-term safety.",
        "whats_included": ["AED Device", "Adult Pads", "Pediatric Pads", "Carry Case", "Training Manual", "5-Year Warranty"],
        "category": "hybrid",
        "product_type": "equipment",
        "image": SAMPLE_IMAGES["aed"],
        "images": [SAMPLE_IMAGES["aed"]],
        "mrp": 85000.0,
        "selling_price": 65000.0,
        "rental_price_per_day": 300.0,
        "rental_price_per_week": 1800.0,
        "rental_price_per_month": 6500.0,
        "security_deposit": 15000.0,
        "stock": 12,
        "reviews": [],
        "average_rating": 4.9,
        "damage_policy": "Clinically sanitized before delivery. Damage charges apply if device is returned non-functional.",
        "late_fee_per_day": 500.0,
        "maintenance_included": True,
        "sanitization_certified": True,
        "emi_available": True,
        "emi_plans": [
            {"tenure": 6, "monthly_emi": 10833, "interest_rate": 0},
            {"tenure": 12, "monthly_emi": 5417, "interest_rate": 0},
            {"tenure": 24, "monthly_emi": 2708, "interest_rate": 0}
        ],
        "is_active": True,
        "tags": ["cardiac", "emergency", "life-saving"],
        "best_for": "Cardiac patients, elderly homes, corporate offices"
    },
    {
        "name": "Electric Hospital Bed (Premium)",
        "description": "Fully adjustable 5-function electric hospital bed. Perfect for post-surgery or bedridden care. Rent short-term or buy with 0% EMI.",
        "whats_included": ["Electric Bed Frame", "Medical Mattress", "Side Rails", "IV Pole", "Remote Control", "Overbed Table"],
        "category": "hybrid",
        "product_type": "equipment",
        "image": SAMPLE_IMAGES["hospital_bed"],
        "images": [SAMPLE_IMAGES["hospital_bed"]],
        "mrp": 95000.0,
        "selling_price": 72000.0,
        "rental_price_per_day": 250.0,
        "rental_price_per_week": 1500.0,
        "rental_price_per_month": 5000.0,
        "security_deposit": 12000.0,
        "stock": 8,
        "reviews": [],
        "average_rating": 4.8,
        "damage_policy": "Professional installation included. Damage/stains will be charged as per assessment.",
        "late_fee_per_day": 300.0,
        "maintenance_included": True,
        "sanitization_certified": True,
        "emi_available": True,
        "emi_plans": [
            {"tenure": 6, "monthly_emi": 12000, "interest_rate": 0},
            {"tenure": 12, "monthly_emi": 6000, "interest_rate": 0},
            {"tenure": 18, "monthly_emi": 4000, "interest_rate": 0}
        ],
        "is_active": True,
        "tags": ["post-surgery", "elderly-care", "bedridden"],
        "best_for": "Post-surgery recovery, long-term bedridden patients"
    },
    {
        "name": "Premium Oxygen Concentrator (10L)",
        "description": "Medical-grade oxygen concentrator with nebulizer function. Essential for respiratory support. Rent or buy with easy EMI.",
        "whats_included": ["10L Concentrator", "Nasal Cannula (2 sets)", "Oxygen Tubing", "Humidifier Bottle", "Nebulizer Kit", "User Manual"],
        "category": "hybrid",
        "product_type": "equipment",
        "image": SAMPLE_IMAGES["oxygen"],
        "images": [SAMPLE_IMAGES["oxygen"]],
        "mrp": 62000.0,
        "selling_price": 48000.0,
        "rental_price_per_day": 200.0,
        "rental_price_per_week": 1200.0,
        "rental_price_per_month": 4000.0,
        "security_deposit": 10000.0,
        "stock": 15,
        "reviews": [],
        "average_rating": 4.9,
        "damage_policy": "Must be returned in working condition. Filter replacement included in rental.",
        "late_fee_per_day": 250.0,
        "maintenance_included": True,
        "sanitization_certified": True,
        "emi_available": True,
        "emi_plans": [
            {"tenure": 6, "monthly_emi": 8000, "interest_rate": 0},
            {"tenure": 12, "monthly_emi": 4000, "interest_rate": 0}
        ],
        "is_active": True,
        "tags": ["oxygen", "respiratory", "COPD", "COVID"],
        "best_for": "COPD, asthma, post-COVID recovery"
    },
    {
        "name": "Electric Wheelchair (Foldable)",
        "description": "Lightweight electric wheelchair with 20km range. Perfect for mobility independence. Rent or own with EMI.",
        "whats_included": ["Electric Wheelchair", "Lithium Battery", "Charger", "Anti-tip wheels", "Storage Bag", "User Manual"],
        "category": "hybrid",
        "product_type": "equipment",
        "image": SAMPLE_IMAGES["wheelchair"],
        "images": [SAMPLE_IMAGES["wheelchair"]],
        "mrp": 55000.0,
        "selling_price": 42000.0,
        "rental_price_per_day": 150.0,
        "rental_price_per_week": 900.0,
        "rental_price_per_month": 3000.0,
        "security_deposit": 8000.0,
        "stock": 20,
        "reviews": [],
        "average_rating": 4.7,
        "damage_policy": "Minor wear covered. Battery replacement not covered under rental.",
        "late_fee_per_day": 150.0,
        "maintenance_included": True,
        "sanitization_certified": True,
        "emi_available": True,
        "emi_plans": [
            {"tenure": 6, "monthly_emi": 7000, "interest_rate": 0},
            {"tenure": 12, "monthly_emi": 3500, "interest_rate": 0}
        ],
        "is_active": True,
        "tags": ["mobility", "wheelchair", "elderly", "disability"],
        "best_for": "Elderly mobility, fracture recovery, long-term disability"
    }
]

# Buy-Only Products (Consumables)
BUY_ONLY_PRODUCTS = [
    {
        "name": "Oximeter + Thermometer Combo",
        "description": "Digital pulse oximeter and infrared thermometer. Essential home health monitoring kit.",
        "whats_included": ["Pulse Oximeter", "Infrared Thermometer", "Batteries", "Carry Pouch"],
        "category": "buy_only",
        "product_type": "consumable",
        "image": SAMPLE_IMAGES["consumables"],
        "images": [SAMPLE_IMAGES["consumables"]],
        "mrp": 2999.0,
        "selling_price": 1999.0,
        "stock": 100,
        "reviews": [],
        "average_rating": 4.5,
        "emi_available": False,
        "is_active": True,
        "tags": ["health-monitor", "oximeter", "thermometer"],
        "best_for": "Daily health monitoring"
    },
    {
        "name": "BP Monitor (Automatic)",
        "description": "Clinically validated automatic blood pressure monitor with irregular heartbeat detection.",
        "whats_included": ["BP Monitor", "Arm Cuff", "Adapter", "Storage Case", "User Manual"],
        "category": "buy_only",
        "product_type": "consumable",
        "image": SAMPLE_IMAGES["consumables_bp"],
        "images": [SAMPLE_IMAGES["consumables_bp"]],
        "mrp": 3499.0,
        "selling_price": 2499.0,
        "stock": 75,
        "reviews": [],
        "average_rating": 4.6,
        "emi_available": False,
        "is_active": True,
        "tags": ["BP", "hypertension", "heart-health"],
        "best_for": "Hypertension patients, elderly"
    },
    {
        "name": "Adult Diapers (Pack of 30)",
        "description": "Premium quality adult diapers with super absorption. Ideal for bedridden or incontinence care.",
        "whats_included": ["30 Diapers", "Disposal Bags"],
        "category": "buy_only",
        "product_type": "consumable",
        "image": SAMPLE_IMAGES["consumables_diapers"],
        "images": [SAMPLE_IMAGES["consumables_diapers"]],
        "mrp": 1999.0,
        "selling_price": 1599.0,
        "stock": 200,
        "reviews": [],
        "average_rating": 4.4,
        "emi_available": False,
        "is_active": True,
        "tags": ["adult-diaper", "incontinence", "elderly-care"],
        "best_for": "Bedridden patients, elderly with incontinence"
    },
    {
        "name": "Wound Dressing Kit (Complete)",
        "description": "Professional wound care kit with sterile supplies for post-surgery or injury care.",
        "whats_included": ["Gauze Pads", "Medical Tape", "Antiseptic", "Scissors", "Gloves", "Bandages"],
        "category": "buy_only",
        "product_type": "consumable",
        "image": SAMPLE_IMAGES["consumables_wound"],
        "images": [SAMPLE_IMAGES["consumables_wound"]],
        "mrp": 1499.0,
        "selling_price": 999.0,
        "stock": 150,
        "reviews": [],
        "average_rating": 4.7,
        "emi_available": False,
        "is_active": True,
        "tags": ["wound-care", "post-surgery", "first-aid"],
        "best_for": "Post-surgery care, wound management"
    }
]

# Curated Kits
CURATED_KITS = [
    {
        "name": "The Recovery Box",
        "description": "Complete post-surgery recovery kit. Rent the bed and walker, buy the monitoring essentials.",
        "image": SAMPLE_IMAGES["hospital_bed"],
        "best_for": "Post-Surgery Recovery (3-6 weeks)",
        "rent_items": [
            {"product_name": "Electric Hospital Bed", "duration_days": 30},
            {"product_name": "Walker", "duration_days": 30}
        ],
        "buy_items": [
            {"product_name": "Oximeter + Thermometer Combo", "quantity": 1},
            {"product_name": "Wound Dressing Kit", "quantity": 1},
            {"product_name": "BP Monitor", "quantity": 1}
        ],
        "total_rent_price": 6500.0,  # 1 month rental
        "total_buy_price": 5497.0,
        "security_deposit": 12000.0,
        "savings": 2000.0,
        "is_active": True
    },
    {
        "name": "The Golden Age Kit",
        "description": "Complete elderly care solution. Electric wheelchair and commode on rent, essential consumables to buy.",
        "image": SAMPLE_IMAGES["wheelchair"],
        "best_for": "Long-term Senior Care",
        "rent_items": [
            {"product_name": "Electric Wheelchair", "duration_days": 30},
            {"product_name": "Commode Chair", "duration_days": 30}
        ],
        "buy_items": [
            {"product_name": "BP Monitor", "quantity": 1},
            {"product_name": "Adult Diapers", "quantity": 2},
            {"product_name": "Oximeter + Thermometer Combo", "quantity": 1}
        ],
        "total_rent_price": 4500.0,
        "total_buy_price": 7696.0,
        "security_deposit": 10000.0,
        "savings": 1500.0,
        "is_active": True
    },
    {
        "name": "Heart-Watch Kit",
        "description": "Cardiac care essentials. AED on rent for emergencies, monitoring devices to own.",
        "image": SAMPLE_IMAGES["aed"],
        "best_for": "Post-Cardiac Discharge",
        "rent_items": [
            {"product_name": "AED", "duration_days": 30},
            {"product_name": "Patient Monitor", "duration_days": 30}
        ],
        "buy_items": [
            {"product_name": "BP Monitor", "quantity": 1},
            {"product_name": "Oximeter + Thermometer Combo", "quantity": 1}
        ],
        "total_rent_price": 8500.0,
        "total_buy_price": 4498.0,
        "security_deposit": 20000.0,
        "savings": 3000.0,
        "is_active": True
    },
    {
        "name": "Breath-Easy Kit",
        "description": "Respiratory support bundle. Oxygen concentrator and BiPAP on rent, consumables to buy.",
        "image": SAMPLE_IMAGES["oxygen"],
        "best_for": "COPD / Asthma / Post-COVID Recovery",
        "rent_items": [
            {"product_name": "Oxygen Concentrator", "duration_days": 30},
            {"product_name": "BiPAP Machine", "duration_days": 30}
        ],
        "buy_items": [
            {"product_name": "Oximeter + Thermometer Combo", "quantity": 1},
            {"product_name": "BP Monitor", "quantity": 1}
        ],
        "total_rent_price": 7000.0,
        "total_buy_price": 4498.0,
        "security_deposit": 15000.0,
        "savings": 2500.0,
        "is_active": True
    }
]

async def seed_hybrid_database():
    try:
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url, tlsAllowInvalidCertificates=True)
        db = client[os.environ['DB_NAME']]
        
        # Clear existing data
        print("Clearing existing data...")
        await db.products.delete_many({})
        await db.kits.delete_many({})
        
        # Insert hybrid products
        if HYBRID_PRODUCTS:
            result = await db.products.insert_many(HYBRID_PRODUCTS)
            print(f"Inserted {len(result.inserted_ids)} hybrid products")
        
        # Insert buy-only products
        if BUY_ONLY_PRODUCTS:
            result = await db.products.insert_many(BUY_ONLY_PRODUCTS)
            print(f"Inserted {len(result.inserted_ids)} buy-only products")
        
        # Insert curated kits
        if CURATED_KITS:
            result = await db.kits.insert_many(CURATED_KITS)
            print(f"Inserted {len(result.inserted_ids)} curated kits")
        
        print("\nEnhanced database seeded successfully!")
        print("=" * 50)
        print("Jazline Home Care - Hybrid Commerce Model")
        print("=" * 50)
        
        client.close()
    except Exception as e:
        print(f"Error seeding database: {e}")

if __name__ == "__main__":
    asyncio.run(seed_hybrid_database())
