"""Seed the database with 10 vendors and their products."""
import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

client = AsyncIOMotorClient(
    "mongodb+srv://emailapp:Shahedabegum9849626003@cluster0.hyqoboj.mongodb.net/konara?appName=Cluster0",
    tlsCAFile=certifi.where(),
)
db = client["konara"]

VENDORS = [
    {
        "phone": "9000000001", "name": "Ahmed", "shop_name": "Fresh Basket",
        "category": "grocery", "lat": 17.385, "lng": 78.486,
        "delivery_radius_km": 5, "products": [
            {"name": "Toor Dal 1kg", "category": "grains", "price": 120, "stock_qty": 30},
            {"name": "Basmati Rice 5kg", "category": "grains", "price": 380, "stock_qty": 20},
            {"name": "Sugar 1kg", "category": "grocery", "price": 45, "stock_qty": 50},
            {"name": "Atta 5kg", "category": "grains", "price": 220, "stock_qty": 25},
            {"name": "Salt 1kg", "category": "grocery", "price": 20, "stock_qty": 100},
            {"name": "Cooking Oil 1L", "category": "oil", "price": 140, "stock_qty": 40},
        ]
    },
    {
        "phone": "9000000002", "name": "Rajesh", "shop_name": "Green Valley Vegetables",
        "category": "vegetables", "lat": 17.388, "lng": 78.490,
        "delivery_radius_km": 3, "products": [
            {"name": "Tomatoes 1kg", "category": "vegetables", "price": 30, "stock_qty": 60},
            {"name": "Onion 1kg", "category": "vegetables", "price": 25, "stock_qty": 80},
            {"name": "Potato 1kg", "category": "vegetables", "price": 28, "stock_qty": 70},
            {"name": "Green Chilli 250g", "category": "vegetables", "price": 15, "stock_qty": 50},
            {"name": "Coriander Bunch", "category": "vegetables", "price": 10, "stock_qty": 40},
            {"name": "Garlic 250g", "category": "vegetables", "price": 35, "stock_qty": 45},
            {"name": "Ginger 250g", "category": "vegetables", "price": 30, "stock_qty": 40},
            {"name": "Carrot 1kg", "category": "vegetables", "price": 40, "stock_qty": 35},
        ]
    },
    {
        "phone": "9000000003", "name": "Suresh", "shop_name": "Milk Point",
        "category": "dairy", "lat": 17.383, "lng": 78.484,
        "delivery_radius_km": 4, "products": [
            {"name": "Milk 1L", "category": "dairy", "price": 52, "stock_qty": 50},
            {"name": "Curd 500g", "category": "dairy", "price": 30, "stock_qty": 40},
            {"name": "Paneer 200g", "category": "dairy", "price": 80, "stock_qty": 25},
            {"name": "Butter 100g", "category": "dairy", "price": 55, "stock_qty": 30},
            {"name": "Cheese Slice Pack", "category": "dairy", "price": 95, "stock_qty": 20},
        ]
    },
    {
        "phone": "9000000004", "name": "Fatima", "shop_name": "Spice World",
        "category": "grocery", "lat": 17.390, "lng": 78.488,
        "delivery_radius_km": 6, "products": [
            {"name": "Turmeric Powder 200g", "category": "spices", "price": 40, "stock_qty": 60},
            {"name": "Red Chilli Powder 200g", "category": "spices", "price": 50, "stock_qty": 55},
            {"name": "Cumin Seeds 100g", "category": "spices", "price": 35, "stock_qty": 70},
            {"name": "Garam Masala 100g", "category": "spices", "price": 45, "stock_qty": 50},
            {"name": "Biryani Masala 100g", "category": "spices", "price": 60, "stock_qty": 40},
            {"name": "Coriander Powder 200g", "category": "spices", "price": 30, "stock_qty": 65},
            {"name": "Black Pepper 50g", "category": "spices", "price": 55, "stock_qty": 35},
        ]
    },
    {
        "phone": "9000000005", "name": "Ravi Kumar", "shop_name": "Meat & More",
        "category": "meat", "lat": 17.382, "lng": 78.492,
        "delivery_radius_km": 5, "products": [
            {"name": "Chicken 1kg", "category": "meat", "price": 200, "stock_qty": 30},
            {"name": "Mutton 1kg", "category": "meat", "price": 650, "stock_qty": 15},
            {"name": "Fish (Rohu) 1kg", "category": "meat", "price": 280, "stock_qty": 20},
            {"name": "Eggs 12pcs", "category": "meat", "price": 72, "stock_qty": 50},
            {"name": "Prawns 500g", "category": "meat", "price": 350, "stock_qty": 10},
        ]
    },
    {
        "phone": "9000000006", "name": "Priya", "shop_name": "Daily Fresh Mart",
        "category": "grocery", "lat": 17.387, "lng": 78.483,
        "delivery_radius_km": 4, "products": [
            {"name": "Milk 1L", "category": "dairy", "price": 50, "stock_qty": 60},
            {"name": "Bread Loaf", "category": "bakery", "price": 40, "stock_qty": 30},
            {"name": "Eggs 6pcs", "category": "dairy", "price": 38, "stock_qty": 45},
            {"name": "Butter 500g", "category": "dairy", "price": 250, "stock_qty": 20},
            {"name": "Jam 200g", "category": "grocery", "price": 85, "stock_qty": 25},
            {"name": "Tea Powder 250g", "category": "grocery", "price": 95, "stock_qty": 40},
            {"name": "Coffee Powder 100g", "category": "grocery", "price": 120, "stock_qty": 30},
        ]
    },
    {
        "phone": "9000000007", "name": "Venkat", "shop_name": "Sri Lakshmi Store",
        "category": "grocery", "lat": 17.384, "lng": 78.491,
        "delivery_radius_km": 3, "products": [
            {"name": "Rice 10kg", "category": "grains", "price": 550, "stock_qty": 15},
            {"name": "Urad Dal 1kg", "category": "grains", "price": 130, "stock_qty": 25},
            {"name": "Chana Dal 1kg", "category": "grains", "price": 90, "stock_qty": 30},
            {"name": "Moong Dal 1kg", "category": "grains", "price": 110, "stock_qty": 28},
            {"name": "Poha 500g", "category": "grains", "price": 35, "stock_qty": 40},
            {"name": "Semolina (Rava) 500g", "category": "grains", "price": 40, "stock_qty": 35},
        ]
    },
    {
        "phone": "9000000008", "name": "Sana", "shop_name": "Bake & Bite",
        "category": "bakery", "lat": 17.389, "lng": 78.485,
        "delivery_radius_km": 5, "products": [
            {"name": "White Bread", "category": "bakery", "price": 35, "stock_qty": 40},
            {"name": "Multigrain Bread", "category": "bakery", "price": 55, "stock_qty": 25},
            {"name": "Cake (Vanilla) 500g", "category": "bakery", "price": 250, "stock_qty": 10},
            {"name": "Biscuits Pack", "category": "bakery", "price": 30, "stock_qty": 60},
            {"name": "Puff Pastry 4pcs", "category": "bakery", "price": 60, "stock_qty": 30},
            {"name": "Bun Pack (6)", "category": "bakery", "price": 40, "stock_qty": 35},
        ]
    },
    {
        "phone": "9000000009", "name": "Kiran", "shop_name": "Fruit Paradise",
        "category": "vegetables", "lat": 17.386, "lng": 78.489,
        "delivery_radius_km": 4, "products": [
            {"name": "Banana 1 dozen", "category": "fruits", "price": 50, "stock_qty": 40},
            {"name": "Apple 1kg", "category": "fruits", "price": 150, "stock_qty": 25},
            {"name": "Orange 1kg", "category": "fruits", "price": 80, "stock_qty": 30},
            {"name": "Mango 1kg", "category": "fruits", "price": 120, "stock_qty": 20},
            {"name": "Grapes 500g", "category": "fruits", "price": 60, "stock_qty": 35},
            {"name": "Watermelon 1pc", "category": "fruits", "price": 40, "stock_qty": 15},
            {"name": "Papaya 1kg", "category": "fruits", "price": 35, "stock_qty": 20},
        ]
    },
    {
        "phone": "9000000010", "name": "Naveed", "shop_name": "Hyderabad Kirana",
        "category": "grocery", "lat": 17.381, "lng": 78.487,
        "delivery_radius_km": 7, "products": [
            {"name": "Basmati Rice 5kg", "category": "grains", "price": 410, "stock_qty": 20},
            {"name": "Cooking Oil 5L", "category": "oil", "price": 650, "stock_qty": 15},
            {"name": "Ghee 1L", "category": "dairy", "price": 550, "stock_qty": 12},
            {"name": "Atta 10kg", "category": "grains", "price": 420, "stock_qty": 18},
            {"name": "Sugar 5kg", "category": "grocery", "price": 210, "stock_qty": 22},
            {"name": "Tea Powder 500g", "category": "grocery", "price": 180, "stock_qty": 25},
            {"name": "Detergent 1kg", "category": "household", "price": 95, "stock_qty": 30},
            {"name": "Soap 3 Pack", "category": "household", "price": 75, "stock_qty": 40},
        ]
    },
]


async def seed():
    # Clear existing data
    await db["users"].delete_many({})
    await db["vendors"].delete_many({})
    await db["products"].delete_many({})
    await db["orders"].delete_many({})
    print("Cleared old data.")

    # Create a customer
    await db["users"].insert_one({
        "phone": "9999999999",
        "name": "Customer Ravi",
        "password_hash": pwd_context.hash("test123"),
        "role": "customer",
    })
    print("Created customer: 9999999999 / test123")

    for v in VENDORS:
        # Create user
        user_result = await db["users"].insert_one({
            "phone": v["phone"],
            "name": v["name"],
            "password_hash": pwd_context.hash("test123"),
            "role": "vendor",
        })

        # Create vendor
        vendor_result = await db["vendors"].insert_one({
            "owner_id": str(user_result.inserted_id),
            "shop_name": v["shop_name"],
            "category": v["category"],
            "location": {"type": "Point", "coordinates": [v["lng"], v["lat"]]},
            "delivery_radius_km": v["delivery_radius_km"],
            "is_open": True,
        })

        # Create products
        for p in v["products"]:
            await db["products"].insert_one({
                "vendor_id": str(vendor_result.inserted_id),
                "vendor_name": v["shop_name"],
                "name": p["name"],
                "category": p["category"],
                "price": p["price"],
                "stock_qty": p["stock_qty"],
                "image_url": None,
            })

        print(f"  ✓ {v['shop_name']} ({len(v['products'])} products)")

    print("\nDone! All vendors seeded.")
    print("\nLogin credentials (all password: test123):")
    print("  Customer: 9999999999")
    for v in VENDORS:
        print(f"  Vendor ({v['shop_name']}): {v['phone']}")


asyncio.run(seed())
