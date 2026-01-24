"""
Profiles Database Operations
============================
CRUD operations for the student profiles collection.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional, List
from datetime import datetime

from app.models.profile import ProfileCreate, ProfileInDB, ProfileUpdate, Gamification, LearningPreferences
from app.database.mongodb import get_database


class ProfilesDatabase:
    """Database operations for profiles collection."""
    
    COLLECTION_NAME = "profiles"
    
    @staticmethod
    async def get_collection():
        """Get profiles collection from database."""
        client = await get_database()
        return client["digimasterji"][ProfilesDatabase.COLLECTION_NAME]
    
    @staticmethod
    async def create_profile(master_user_id: str, profile_data: ProfileCreate) -> ProfileInDB:
        """
        Create a new student profile.
        
        Args:
            master_user_id: Parent/Teacher's user ID
            profile_data: Profile creation data
            
        Returns:
            ProfileInDB: Created profile document
        """
        if not ObjectId.is_valid(master_user_id):
            raise ValueError("Invalid master_user_id")
            
        collection = await ProfilesDatabase.get_collection()
        
        profile_dict = {
            "master_user_id": ObjectId(master_user_id),
            "name": profile_data.name,
            "age": profile_data.age,
            "grade_level": profile_data.grade_level,
            "preferred_language": profile_data.preferred_language,
            "avatar": profile_data.avatar or "default_avatar.png",
            "gamification": {
                "xp": 0,
                "current_streak_days": 0,
                "last_activity_date": None,
                "badges": []
            },
            "learning_preferences": {
                "voice_enabled": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(profile_dict)
        profile_dict["_id"] = result.inserted_id
        
        return ProfileInDB(**profile_dict)
    
    @staticmethod
    async def get_profile_by_id(profile_id: str) -> Optional[ProfileInDB]:
        """
        Get profile by ID.
        
        Args:
            profile_id: Profile's ObjectId as string
            
        Returns:
            ProfileInDB or None
        """
        if not ObjectId.is_valid(profile_id):
            return None
            
        collection = await ProfilesDatabase.get_collection()
        profile_doc = await collection.find_one({"_id": ObjectId(profile_id)})
        
        if profile_doc:
            return ProfileInDB(**profile_doc)
        return None
    
    @staticmethod
    async def get_profiles_by_user(master_user_id: str) -> List[ProfileInDB]:
        """
        Get all profiles for a master user.
        
        Args:
            master_user_id: Parent/Teacher's user ID
            
        Returns:
            List of ProfileInDB
        """
        if not ObjectId.is_valid(master_user_id):
            return []
            
        collection = await ProfilesDatabase.get_collection()
        cursor = collection.find({"master_user_id": ObjectId(master_user_id)})
        
        profiles = []
        async for doc in cursor:
            profiles.append(ProfileInDB(**doc))
        
        return profiles
    
    @staticmethod
    async def update_profile(profile_id: str, profile_update: ProfileUpdate) -> Optional[ProfileInDB]:
        """
        Update profile information.
        
        Args:
            profile_id: Profile's ObjectId as string
            profile_update: Fields to update
            
        Returns:
            Updated ProfileInDB or None
        """
        if not ObjectId.is_valid(profile_id):
            return None
            
        collection = await ProfilesDatabase.get_collection()
        
        # Build update dictionary with only provided fields
        update_data = {"updated_at": datetime.utcnow()}
        
        if profile_update.name is not None:
            update_data["name"] = profile_update.name
        if profile_update.age is not None:
            update_data["age"] = profile_update.age
        if profile_update.grade_level is not None:
            update_data["grade_level"] = profile_update.grade_level
        if profile_update.preferred_language is not None:
            update_data["preferred_language"] = profile_update.preferred_language
        if profile_update.avatar is not None:
            update_data["avatar"] = profile_update.avatar
        if profile_update.learning_preferences is not None:
            update_data["learning_preferences"] = profile_update.learning_preferences.model_dump()
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(profile_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            return ProfileInDB(**result)
        return None
    
    @staticmethod
    async def delete_profile(profile_id: str) -> bool:
        """
        Delete a profile from the database.
        
        Args:
            profile_id: Profile's ObjectId as string
            
        Returns:
            True if deleted, False otherwise
        """
        if not ObjectId.is_valid(profile_id):
            return False
            
        collection = await ProfilesDatabase.get_collection()
        result = await collection.delete_one({"_id": ObjectId(profile_id)})
        
        return result.deleted_count > 0
    
    @staticmethod
    async def update_gamification(
        profile_id: str, 
        xp_delta: int = 0,
        streak_delta: int = 0,
        new_badges: Optional[List[str]] = None
    ) -> Optional[ProfileInDB]:
        """
        Update gamification stats for a profile.
        
        Args:
            profile_id: Profile's ObjectId as string
            xp_delta: XP points to add (can be negative)
            streak_delta: Streak days to add/subtract
            new_badges: New badges to add
            
        Returns:
            Updated ProfileInDB or None
        """
        if not ObjectId.is_valid(profile_id):
            return None
            
        collection = await ProfilesDatabase.get_collection()
        
        update_ops = {
            "$set": {
                "gamification.last_activity_date": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
        
        if xp_delta != 0:
            update_ops["$inc"] = {"gamification.xp": xp_delta}
        
        if streak_delta != 0:
            if "$inc" not in update_ops:
                update_ops["$inc"] = {}
            update_ops["$inc"]["gamification.current_streak_days"] = streak_delta
        
        if new_badges:
            update_ops["$addToSet"] = {
                "gamification.badges": {"$each": new_badges}
            }
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(profile_id)},
            update_ops,
            return_document=True
        )
        
        if result:
            return ProfileInDB(**result)
        return None
    
    @staticmethod
    async def update_last_activity(profile_id: str) -> bool:
        """
        Update profile's last activity date (for streak calculation).
        
        Args:
            profile_id: Profile's ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        if not ObjectId.is_valid(profile_id):
            return False
            
        collection = await ProfilesDatabase.get_collection()
        
        result = await collection.update_one(
            {"_id": ObjectId(profile_id)},
            {
                "$set": {
                    "gamification.last_activity_date": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def count_profiles_by_user(master_user_id: str) -> int:
        """
        Count number of profiles for a master user.
        
        Args:
            master_user_id: Parent/Teacher's user ID
            
        Returns:
            Count of profiles
        """
        if not ObjectId.is_valid(master_user_id):
            return 0
            
        collection = await ProfilesDatabase.get_collection()
        count = await collection.count_documents({"master_user_id": ObjectId(master_user_id)})
        
        return count
    
    @staticmethod
    async def update_quiz_stats(
        profile_id: str,
        xp_earned: int,
        maintain_streak: bool
    ) -> Optional[ProfileInDB]:
        """
        Update profile after quiz completion (XP and streak).
        
        Args:
            profile_id: Profile's ObjectId as string
            xp_earned: XP points earned from quiz
            maintain_streak: Whether the quiz was completed on time to maintain streak
            
        Returns:
            Updated ProfileInDB or None
        """
        if not ObjectId.is_valid(profile_id):
            return None
            
        collection = await ProfilesDatabase.get_collection()
        
        # Get current profile to check streak
        profile = await ProfilesDatabase.get_profile_by_id(profile_id)
        if not profile:
            return None
        
        update_ops = {
            "$inc": {"gamification.xp": xp_earned},
            "$set": {
                "gamification.last_activity_date": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
        
        # Handle streak logic
        from datetime import date, timedelta
        
        last_activity = profile.gamification.last_activity_date
        today = date.today()
        
        if maintain_streak:
            if last_activity:
                last_date = last_activity.date() if isinstance(last_activity, datetime) else last_activity
                days_diff = (today - last_date).days
                
                if days_diff == 1:
                    # Consecutive day - increment streak
                    update_ops["$inc"]["gamification.current_streak_days"] = 1
                elif days_diff == 0:
                    # Same day - keep streak
                    pass
                else:
                    # Streak broken - reset to 1
                    update_ops["$set"]["gamification.current_streak_days"] = 1
            else:
                # First activity - start streak
                update_ops["$set"]["gamification.current_streak_days"] = 1
        else:
            # Quiz not attempted on time - reset streak
            update_ops["$set"]["gamification.current_streak_days"] = 0
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(profile_id)},
            update_ops,
            return_document=True
        )
        
        if result:
            return ProfileInDB(**result)
        return None
    
    @staticmethod
    async def get_all_profile_ids() -> List[str]:
        """
        Get all profile IDs for background tasks (e.g., daily quiz generation).
        
        Returns:
            List of profile ID strings
        """
        collection = await ProfilesDatabase.get_collection()
        
        cursor = collection.find({}, {"_id": 1})
        profile_ids = []
        
        async for doc in cursor:
            profile_ids.append(str(doc["_id"]))
        
        return profile_ids
