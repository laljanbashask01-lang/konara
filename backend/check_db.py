import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient(
    "mongodb+srv://emailapp:Shahedabegum9849626003@cluster0.hyqoboj.mongodb.net/konara?appName=Cluster0",
    tlsCAFile=certifi.where(),
)
db = client["konara"]

async def check():
    print("=== VENDORS ===")
    async for v in db["vendors"].find():
        print(f"  {v['shop_name']} ({v['category']})")

    print("\n=== PRODUCTS ===")
    async for p in db["products"].find():
        print(f"  {p['name']} - Rs{p['price']} (stock: {p['stock_qty']}) - by {p['vendor_name']}")

    print("\n=== USERS ===")
    async for u in db["users"].find():
        print(f"  {u['name']} ({u['role']}) - {u['phone']}")

asyncio.run(check())
