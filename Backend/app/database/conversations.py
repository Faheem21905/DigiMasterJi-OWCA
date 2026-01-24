"""
Conversations Database Operations
==================================
CRUD operations for the conversations collection.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional, List
from datetime import datetime

from app.models.conversation import ConversationCreate, ConversationInDB, ConversationUpdate
from app.database.mongodb import get_database


class ConversationsDatabase:
    """Database operations for conversations collection."""
    
    COLLECTION_NAME = "conversations"
    
    @staticmethod
    async def get_collection():
        """Get conversations collection from database."""
        client = await get_database()
        return client["digimasterji"][ConversationsDatabase.COLLECTION_NAME]
    
    @staticmethod
    async def create_conversation(
        profile_id: str,
        conversation_data: ConversationCreate
    ) -> ConversationInDB:
        """
        Create a new conversation.
        
        Args:
            profile_id: Student profile ID (from token)
            conversation_data: Conversation creation data
            
        Returns:
            ConversationInDB: Created conversation document
        """
        if not ObjectId.is_valid(profile_id):
            raise ValueError("Invalid profile_id")
            
        collection = await ConversationsDatabase.get_collection()
        
        # Determine initial title
        title = conversation_data.topic if conversation_data.topic else "New Conversation"
        
        conversation_dict = {
            "profile_id": ObjectId(profile_id),
            "title": title,
            "subject_tag": None,  # Will be derived later by AI
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(conversation_dict)
        conversation_dict["_id"] = result.inserted_id
        
        return ConversationInDB(**conversation_dict)
    
    @staticmethod
    async def get_conversation_by_id(conversation_id: str) -> Optional[ConversationInDB]:
        """
        Get conversation by ID.
        
        Args:
            conversation_id: Conversation's ObjectId as string
            
        Returns:
            ConversationInDB or None
        """
        if not ObjectId.is_valid(conversation_id):
            return None
            
        collection = await ConversationsDatabase.get_collection()
        conversation_doc = await collection.find_one({"_id": ObjectId(conversation_id)})
        
        if conversation_doc:
            return ConversationInDB(**conversation_doc)
        return None
    
    @staticmethod
    async def get_conversations_by_profile(
        profile_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[ConversationInDB]:
        """
        Get all conversations for a profile with pagination.
        
        Args:
            profile_id: Student profile ID
            limit: Maximum number of conversations to return
            offset: Number of conversations to skip
            
        Returns:
            List of ConversationInDB
        """
        if not ObjectId.is_valid(profile_id):
            return []
            
        collection = await ConversationsDatabase.get_collection()
        
        # Sort by updated_at descending (most recent first)
        cursor = collection.find(
            {"profile_id": ObjectId(profile_id)}
        ).sort("updated_at", -1).skip(offset).limit(limit)
        
        conversations = []
        async for doc in cursor:
            conversations.append(ConversationInDB(**doc))
        
        return conversations
    
    @staticmethod
    async def update_conversation(
        conversation_id: str,
        conversation_update: ConversationUpdate
    ) -> Optional[ConversationInDB]:
        """
        Update conversation metadata.
        
        Args:
            conversation_id: Conversation's ObjectId as string
            conversation_update: Fields to update
            
        Returns:
            Updated ConversationInDB or None
        """
        if not ObjectId.is_valid(conversation_id):
            return None
            
        collection = await ConversationsDatabase.get_collection()
        
        update_data = {"updated_at": datetime.utcnow()}
        
        if conversation_update.title is not None:
            update_data["title"] = conversation_update.title
        if conversation_update.subject_tag is not None:
            update_data["subject_tag"] = conversation_update.subject_tag
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(conversation_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            return ConversationInDB(**result)
        return None
    
    @staticmethod
    async def update_conversation_timestamp(conversation_id: str) -> bool:
        """
        Update conversation's updated_at timestamp (called when new message added).
        
        Args:
            conversation_id: Conversation's ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        if not ObjectId.is_valid(conversation_id):
            return False
            
        collection = await ConversationsDatabase.get_collection()
        
        result = await collection.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def delete_conversation(conversation_id: str) -> bool:
        """
        Delete a conversation.
        
        Args:
            conversation_id: Conversation's ObjectId as string
            
        Returns:
            True if deleted, False otherwise
        """
        if not ObjectId.is_valid(conversation_id):
            return False
            
        collection = await ConversationsDatabase.get_collection()
        result = await collection.delete_one({"_id": ObjectId(conversation_id)})
        
        return result.deleted_count > 0
    
    @staticmethod
    async def count_conversations_by_profile(profile_id: str) -> int:
        """
        Count conversations for a profile.
        
        Args:
            profile_id: Student profile ID
            
        Returns:
            Count of conversations
        """
        if not ObjectId.is_valid(profile_id):
            return 0
            
        collection = await ConversationsDatabase.get_collection()
        count = await collection.count_documents({"profile_id": ObjectId(profile_id)})
        
        return count
