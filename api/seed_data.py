import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Sample medical kit images (base64 placeholders - using simple colored rectangles)
SAMPLE_IMAGES = {
    "operational": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzIxOTZGMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9wZXJhdGlvbmFsIENhcmU8L3RleHQ+PC9zdmc+",
    "dental": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwQkNENCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbnRhbCBDYXJlPC90ZXh0Pjwvc3ZnPg==",
    "diabetes": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzRDQUY1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRpYWJldGVzIENhcmU8L3RleHQ+PC9zdmc+",
    "fracture": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZGOTgwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZyYWN0dXJlIENhcmU8L3RleHQ+PC9zdmc+",
    "surgery": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0U5MUU2MyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlN1cmdlcnkgQ2FyZTwvdGV4dD48L3N2Zz4=",
    "elderly": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzlDMjdCMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVsZGVybHkgQ2FyZTwvdGV4dD48L3N2Zz4=",
    "wheelchair": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzYwN0Q4QiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldobGVlbGNoYWlyPC90ZXh0Pjwvc3ZnPg==",
    "oxygen": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwOTY4OCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk94eWdlbiBDb25jPC90ZXh0Pjwvc3ZnPg==",
}

# Sample products for Buy category
BUY_PRODUCTS = [
    {
        "name": "Operational Care Kit",
        "description": "Complete surgical care kit with essential instruments and supplies for post-operative recovery.",
        "whats_included": [
            "Sterile gauze pads (10 pcs)",
            "Medical tape",
            "Antiseptic solution",
            "Surgical gloves (5 pairs)",
            "Cotton swabs",
            "Bandages and dressings"
        ],
        "category": "buy",
        "image": SAMPLE_IMAGES["operational"],
        "mrp": 2499.0,
        "selling_price": 1999.0,
        "stock": 50,
        "reviews": [],
        "average_rating": 4.5,
        "is_active": True
    },
    {
        "name": "Dental Care Kit",
        "description": "Professional dental hygiene kit with premium quality oral care products.",
        "whats_included": [
            "Electric toothbrush",
            "Dental floss",
            "Mouthwash (500ml)",
            "Tongue cleaner",
            "Interdental brushes (5 pcs)",
            "Travel case"
        ],
        "category": "buy",
        "image": SAMPLE_IMAGES["dental"],
        "mrp": 1899.0,
        "selling_price": 1499.0,
        "stock": 75,
        "reviews": [],
        "average_rating": 4.7,
        "is_active": True
    },
    {
        "name": "Diabetes Management Kit",
        "description": "Essential kit for daily diabetes monitoring and management.",
        "whats_included": [
            "Glucometer with strips (50 pcs)",
            "Lancets (100 pcs)",
            "Insulin pen",
            "Blood pressure monitor",
            "Medicine organizer",
            "Health tracking journal"
        ],
        "category": "buy",
        "image": SAMPLE_IMAGES["diabetes"],
        "mrp": 3999.0,
        "selling_price": 3299.0,
        "stock": 30,
        "reviews": [],
        "average_rating": 4.8,
        "is_active": True
    },
    {
        "name": "Fracture Recovery Kit",
        "description": "Complete support kit for bone fracture recovery and rehabilitation.",
        "whats_included": [
            "Adjustable arm sling",
            "Cold therapy pack",
            "Compression bandage",
            "Pain relief gel",
            "Anti-inflammatory tablets",
            "Exercise resistance band"
        ],
        "category": "buy",
        "image": SAMPLE_IMAGES["fracture"],
        "mrp": 1799.0,
        "selling_price": 1399.0,
        "stock": 40,
        "reviews": [],
        "average_rating": 4.3,
        "is_active": True
    },
    {
        "name": "Post-Surgery Care Kit",
        "description": "Comprehensive recovery kit for post-surgical home care.",
        "whats_included": [
            "Wound care supplies",
            "Antibacterial soap",
            "Heating pad",
            "Compression stockings",
            "Surgical pillow",
            "Recovery guide booklet"
        ],
        "category": "buy",
        "image": SAMPLE_IMAGES["surgery"],
        "mrp": 2999.0,
        "selling_price": 2499.0,
        "stock": 25,
        "reviews": [],
        "average_rating": 4.6,
        "is_active": True
    },
    {
        "name": "Elderly Care Kit",
        "description": "Daily essentials kit designed for elderly care and comfort.",
        "whats_included": [
            "Blood pressure monitor",
            "Pill organizer (7-day)",
            "Non-slip mat",
            "Grab bars",
            "Mobility aids",
            "Emergency call button"
        ],
        "category": "buy",
        "image": SAMPLE_IMAGES["elderly"],
        "mrp": 4499.0,
        "selling_price": 3799.0,
        "stock": 20,
        "reviews": [],
        "average_rating": 4.9,
        "is_active": True
    }
]

# Sample products for Rent category
RENT_PRODUCTS = [
    {
        "name": "Premium Wheelchair",
        "description": "Lightweight, foldable wheelchair with comfortable padding and smooth maneuverability.",
        "whats_included": [
            "Adjustable footrests",
            "Padded armrests",
            "Anti-tip wheels",
            "Safety belt",
            "Storage bag"
        ],
        "category": "rent",
        "image": SAMPLE_IMAGES["wheelchair"],
        "mrp": 15000.0,
        "rental_price_per_week": 500.0,
        "rental_price_per_month": 1500.0,
        "security_deposit": 3000.0,
        "stock": 15,
        "reviews": [],
        "average_rating": 4.7,
        "damage_policy": "Minor wear covered. Major damage or loss will be deducted from deposit.",
        "late_fee_per_day": 100.0,
        "is_active": True
    },
    {
        "name": "Oxygen Concentrator",
        "description": "Medical-grade oxygen concentrator for home oxygen therapy.",
        "whats_included": [
            "Nasal cannula",
            "Oxygen tubing (2 sets)",
            "Humidifier bottle",
            "Power adapter",
            "User manual"
        ],
        "category": "rent",
        "image": SAMPLE_IMAGES["oxygen"],
        "mrp": 45000.0,
        "rental_price_per_week": 1200.0,
        "rental_price_per_month": 3500.0,
        "security_deposit": 10000.0,
        "stock": 10,
        "reviews": [],
        "average_rating": 4.8,
        "damage_policy": "Equipment must be returned in working condition. Damage charges apply.",
        "late_fee_per_day": 200.0,
        "is_active": True
    },
    {
        "name": "Hospital Bed (Electric)",
        "description": "Fully adjustable electric hospital bed for home care.",
        "whats_included": [
            "Remote control",
            "Side rails",
            "Mattress",
            "IV pole",
            "Overbed table"
        ],
        "category": "rent",
        "image": SAMPLE_IMAGES["operational"],
        "mrp": 80000.0,
        "rental_price_per_week": 2000.0,
        "rental_price_per_month": 6000.0,
        "security_deposit": 15000.0,
        "stock": 8,
        "reviews": [],
        "average_rating": 4.6,
        "damage_policy": "Professional installation and removal included. Damage costs apply.",
        "late_fee_per_day": 300.0,
        "is_active": True
    },
    {
        "name": "Patient Lift (Hoyer Lift)",
        "description": "Hydraulic patient lift for safe patient transfer and mobility.",
        "whats_included": [
            "Sling (multiple sizes)",
            "Hydraulic pump",
            "Swivel wheels",
            "Safety straps",
            "Usage instructions"
        ],
        "category": "rent",
        "image": SAMPLE_IMAGES["elderly"],
        "mrp": 35000.0,
        "rental_price_per_week": 800.0,
        "rental_price_per_month": 2500.0,
        "security_deposit": 7000.0,
        "stock": 12,
        "reviews": [],
        "average_rating": 4.5,
        "damage_policy": "Training provided. Equipment must be returned clean and functional.",
        "late_fee_per_day": 150.0,
        "is_active": True
    }
]

async def seed_database():
    try:
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Clear existing products
        await db.products.delete_many({})
        print("Cleared existing products...")
        
        # Insert buy products
        if BUY_PRODUCTS:
            result = await db.products.insert_many(BUY_PRODUCTS)
            print(f"Inserted {len(result.inserted_ids)} buy products")
        
        # Insert rent products
        if RENT_PRODUCTS:
            result = await db.products.insert_many(RENT_PRODUCTS)
            print(f"Inserted {len(result.inserted_ids)} rent products")
        
        print("Database seeded successfully!")
        
        client.close()
    except Exception as e:
        print(f"Error seeding database: {e}")

if __name__ == "__main__":
    asyncio.run(seed_database())
