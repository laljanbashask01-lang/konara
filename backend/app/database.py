import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "konara")

client = AsyncIOMotorClient(MONGODB_URI, tlsCAFile=certifi.where())
db = client[DATABASE_NAME]

# Collections
users_col = db["users"]
vendors_col = db["vendors"]
products_col = db["products"]
orders_col = db["orders"]


async def init_db():
    """Create indexes."""
    try:
        # Users
        await users_col.create_index("phone", unique=True)

        # Vendors
        await vendors_col.create_index("owner_id", unique=True)
        await vendors_col.create_index([("location", "2dsphere")])

        # Products
        await products_col.create_index("vendor_id")
        await products_col.create_index("category")
        await products_col.create_index("name")
        await products_col.create_index([("name", "text"), ("category", "text")])

        # Orders
        await orders_col.create_index("customer_id")
        await orders_col.create_index("created_at")

        print("Database connected, indexes created.")
    except Exception as e:
        print(f"Database init warning: {e}")
