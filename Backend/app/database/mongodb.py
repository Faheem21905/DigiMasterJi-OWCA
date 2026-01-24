from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
db = Database()

async def get_database() -> AsyncIOMotorClient:
    return db.client

async def connect_to_mongo():
    """Create database connection."""
    db.client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    print("Connected to MongoDB")

async def close_mongo_connection():
    """Close database connection."""
    db.client.close()
    print("Closed MongoDB connection")
