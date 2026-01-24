"""
Users Database Operations
=========================
CRUD operations for the users (master accounts) collection.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional, List
from datetime import datetime

from app.models.user import UserCreate, UserInDB, UserUpdate, UserSettings
from app.database.mongodb import get_database


class UsersDatabase:
    """Database operations for users collection."""
    
    COLLECTION_NAME = "users"
    
    @staticmethod
    async def get_collection():
        """Get users collection from database."""
        client = await get_database()
        return client["digimasterji"][UsersDatabase.COLLECTION_NAME]
    
    @staticmethod
    async def create_user(user_data: UserCreate, password_hash: str) -> UserInDB:
        """
        Create a new user in the database.
        
        Args:
            user_data: User creation data
            password_hash: Hashed password
            
        Returns:
            UserInDB: Created user document
        """
        collection = await UsersDatabase.get_collection()
        
        user_dict = {
            "email": user_data.email,
            "phone_number": user_data.phone_number,
            "full_name": user_data.full_name,
            "password_hash": password_hash,
            "registered_at": datetime.utcnow(),
            "last_login": None,
            "settings": {
                "sync_enabled": True,
                "data_saver_mode": True
            }
        }
        
        result = await collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        
        return UserInDB(**user_dict)
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
        """
        Get user by ID.
        
        Args:
            user_id: User's ObjectId as string
            
        Returns:
            UserInDB or None
        """
        if not ObjectId.is_valid(user_id):
            return None
            
        collection = await UsersDatabase.get_collection()
        user_doc = await collection.find_one({"_id": ObjectId(user_id)})
        
        if user_doc:
            return UserInDB(**user_doc)
        return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[UserInDB]:
        """
        Get user by email address.
        
        Args:
            email: User's email
            
        Returns:
            UserInDB or None
        """
        collection = await UsersDatabase.get_collection()
        user_doc = await collection.find_one({"email": email.lower()})
        
        if user_doc:
            return UserInDB(**user_doc)
        return None
    
    @staticmethod
    async def get_user_by_phone(phone_number: str) -> Optional[UserInDB]:
        """
        Get user by phone number.
        
        Args:
            phone_number: User's phone number
            
        Returns:
            UserInDB or None
        """
        collection = await UsersDatabase.get_collection()
        user_doc = await collection.find_one({"phone_number": phone_number})
        
        if user_doc:
            return UserInDB(**user_doc)
        return None
    
    @staticmethod
    async def update_user(user_id: str, user_update: UserUpdate) -> Optional[UserInDB]:
        """
        Update user information.
        
        Args:
            user_id: User's ObjectId as string
            user_update: Fields to update
            
        Returns:
            Updated UserInDB or None
        """
        if not ObjectId.is_valid(user_id):
            return None
            
        collection = await UsersDatabase.get_collection()
        
        # Build update dictionary with only provided fields
        update_data = {}
        if user_update.email is not None:
            update_data["email"] = user_update.email.lower()
        if user_update.phone_number is not None:
            update_data["phone_number"] = user_update.phone_number
        if user_update.full_name is not None:
            update_data["full_name"] = user_update.full_name
        if user_update.settings is not None:
            update_data["settings"] = user_update.settings.model_dump()
        
        if not update_data:
            return await UsersDatabase.get_user_by_id(user_id)
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            return UserInDB(**result)
        return None
    
    @staticmethod
    async def update_last_login(user_id: str) -> bool:
        """
        Update user's last login timestamp.
        
        Args:
            user_id: User's ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        if not ObjectId.is_valid(user_id):
            return False
            
        collection = await UsersDatabase.get_collection()
        
        result = await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def delete_user(user_id: str) -> bool:
        """
        Delete a user from the database.
        
        Args:
            user_id: User's ObjectId as string
            
        Returns:
            True if deleted, False otherwise
        """
        if not ObjectId.is_valid(user_id):
            return False
            
        collection = await UsersDatabase.get_collection()
        result = await collection.delete_one({"_id": ObjectId(user_id)})
        
        return result.deleted_count > 0
    
    @staticmethod
    async def email_exists(email: str) -> bool:
        """
        Check if email already exists.
        
        Args:
            email: Email to check
            
        Returns:
            True if exists, False otherwise
        """
        collection = await UsersDatabase.get_collection()
        count = await collection.count_documents({"email": email.lower()})
        return count > 0
    
    @staticmethod
    async def phone_exists(phone_number: str) -> bool:
        """
        Check if phone number already exists.
        
        Args:
            phone_number: Phone number to check
            
        Returns:
            True if exists, False otherwise
        """
        collection = await UsersDatabase.get_collection()
        count = await collection.count_documents({"phone_number": phone_number})
        return count > 0
    
    @staticmethod
    async def update_refresh_token(user_id: str, refresh_token: str, expires_at: datetime) -> bool:
        """
        Update user's refresh token in the database.
        
        Args:
            user_id: User's ObjectId as string
            refresh_token: New refresh token
            expires_at: Token expiration datetime
            
        Returns:
            True if updated, False otherwise
        """
        if not ObjectId.is_valid(user_id):
            return False
            
        collection = await UsersDatabase.get_collection()
        result = await collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "refresh_token": refresh_token,
                    "refresh_token_expires": expires_at
                }
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def verify_refresh_token(user_id: str, refresh_token: str) -> bool:
        """
        Verify if the provided refresh token matches the stored one and is not expired.
        
        Args:
            user_id: User's ObjectId as string
            refresh_token: Refresh token to verify
            
        Returns:
            True if valid, False otherwise
        """
        if not ObjectId.is_valid(user_id):
            return False
            
        collection = await UsersDatabase.get_collection()
        user_doc = await collection.find_one({
            "_id": ObjectId(user_id),
            "refresh_token": refresh_token,
            "refresh_token_expires": {"$gt": datetime.utcnow()}
        })
        
        return user_doc is not None
    
    @staticmethod
    async def clear_refresh_token(user_id: str) -> bool:
        """
        Clear user's refresh token (used during logout).
        
        Args:
            user_id: User's ObjectId as string
            
        Returns:
            True if cleared, False otherwise
        """
        if not ObjectId.is_valid(user_id):
            return False
            
        collection = await UsersDatabase.get_collection()
        result = await collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "refresh_token": None,
                    "refresh_token_expires": None
                }
            }
        )
        
        return result.modified_count > 0
