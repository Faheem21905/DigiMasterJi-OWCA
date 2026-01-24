"""
Messages Database Operations
=============================
CRUD operations for the messages collection.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional, List
from datetime import datetime

from app.models.message import MessageCreate, MessageInDB
from app.database.mongodb import get_database


class MessagesDatabase:
    """Database operations for messages collection."""
    
    COLLECTION_NAME = "messages"
    
    @staticmethod
    async def get_collection():
        """Get messages collection from database."""
        client = await get_database()
        return client["digimasterji"][MessagesDatabase.COLLECTION_NAME]
    
    @staticmethod
    async def create_message(
        conversation_id: str,
        profile_id: str,
        message_data: MessageCreate
    ) -> MessageInDB:
        """
        Create a new message in a conversation.
        
        Args:
            conversation_id: Conversation's ObjectId as string
            profile_id: Student profile ID
            message_data: Message creation data
            
        Returns:
            MessageInDB: Created message document
        """
        if not ObjectId.is_valid(conversation_id):
            raise ValueError("Invalid conversation_id")
        if not ObjectId.is_valid(profile_id):
            raise ValueError("Invalid profile_id")
            
        collection = await MessagesDatabase.get_collection()
        
        message_dict = {
            "conversation_id": ObjectId(conversation_id),
            "profile_id": ObjectId(profile_id),
            "role": message_data.role,
            "content": message_data.content,
            "content_translated": message_data.content_translated,
            "audio_url": message_data.audio_url,
            "timestamp": datetime.utcnow(),
            "rag_references": []
        }
        
        result = await collection.insert_one(message_dict)
        message_dict["_id"] = result.inserted_id
        
        return MessageInDB(**message_dict)
    
    @staticmethod
    async def get_message_by_id(message_id: str) -> Optional[MessageInDB]:
        """
        Get message by ID.
        
        Args:
            message_id: Message's ObjectId as string
            
        Returns:
            MessageInDB or None
        """
        if not ObjectId.is_valid(message_id):
            return None
            
        collection = await MessagesDatabase.get_collection()
        message_doc = await collection.find_one({"_id": ObjectId(message_id)})
        
        if message_doc:
            return MessageInDB(**message_doc)
        return None
    
    @staticmethod
    async def get_messages_by_conversation(
        conversation_id: str,
        limit: Optional[int] = None
    ) -> List[MessageInDB]:
        """
        Get all messages for a conversation.
        
        Args:
            conversation_id: Conversation's ObjectId as string
            limit: Optional limit on number of messages
            
        Returns:
            List of MessageInDB sorted by timestamp ascending
        """
        if not ObjectId.is_valid(conversation_id):
            return []
            
        collection = await MessagesDatabase.get_collection()
        
        # Sort by timestamp ascending (chronological order)
        cursor = collection.find(
            {"conversation_id": ObjectId(conversation_id)}
        ).sort("timestamp", 1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        messages = []
        async for doc in cursor:
            messages.append(MessageInDB(**doc))
        
        return messages
    
    @staticmethod
    async def get_recent_messages_by_profile(
        profile_id: str,
        limit: int = 50
    ) -> List[MessageInDB]:
        """
        Get recent messages for a profile across all conversations.
        
        Args:
            profile_id: Student profile ID
            limit: Maximum number of messages to return
            
        Returns:
            List of MessageInDB
        """
        if not ObjectId.is_valid(profile_id):
            return []
            
        collection = await MessagesDatabase.get_collection()
        
        cursor = collection.find(
            {"profile_id": ObjectId(profile_id)}
        ).sort("timestamp", -1).limit(limit)
        
        messages = []
        async for doc in cursor:
            messages.append(MessageInDB(**doc))
        
        return messages
    
    @staticmethod
    async def count_messages_by_conversation(conversation_id: str) -> int:
        """
        Count messages in a conversation.
        
        Args:
            conversation_id: Conversation's ObjectId as string
            
        Returns:
            Count of messages
        """
        if not ObjectId.is_valid(conversation_id):
            return 0
            
        collection = await MessagesDatabase.get_collection()
        count = await collection.count_documents({"conversation_id": ObjectId(conversation_id)})
        
        return count
    
    @staticmethod
    async def delete_messages_by_conversation(conversation_id: str) -> int:
        """
        Delete all messages in a conversation.
        
        Args:
            conversation_id: Conversation's ObjectId as string
            
        Returns:
            Number of messages deleted
        """
        if not ObjectId.is_valid(conversation_id):
            return 0
            
        collection = await MessagesDatabase.get_collection()
        result = await collection.delete_many({"conversation_id": ObjectId(conversation_id)})
        
        return result.deleted_count
    
    @staticmethod
    async def update_message_rag_references(
        message_id: str,
        rag_references: List[str]
    ) -> Optional[MessageInDB]:
        """
        Update RAG references for a message (used when AI responds with context).
        
        Args:
            message_id: Message's ObjectId as string
            rag_references: List of knowledge base ObjectIds as strings
            
        Returns:
            Updated MessageInDB or None
        """
        if not ObjectId.is_valid(message_id):
            return None
        
        # Validate all reference IDs
        rag_object_ids = []
        for ref_id in rag_references:
            if ObjectId.is_valid(ref_id):
                rag_object_ids.append(ObjectId(ref_id))
            
        collection = await MessagesDatabase.get_collection()
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(message_id)},
            {"$set": {"rag_references": rag_object_ids}},
            return_document=True
        )
        
        if result:
            return MessageInDB(**result)
        return None

    @staticmethod
    async def update_message_tts_audio(
        message_id: str,
        audio_base64: str,
        audio_format: str,
        audio_language: str,
        audio_language_name: str
    ) -> Optional[MessageInDB]:
        """
        Update TTS audio fields for a message (used to store generated TTS audio).
        
        Args:
            message_id: Message's ObjectId as string
            audio_base64: Base64 encoded audio data
            audio_format: Audio format (e.g., 'mp3')
            audio_language: Language code (e.g., 'hi')
            audio_language_name: Human-readable language name (e.g., 'Hindi')
            
        Returns:
            Updated MessageInDB or None
        """
        if not ObjectId.is_valid(message_id):
            return None
            
        collection = await MessagesDatabase.get_collection()
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(message_id)},
            {"$set": {
                "audio_base64": audio_base64,
                "audio_format": audio_format,
                "audio_language": audio_language,
                "audio_language_name": audio_language_name
            }},
            return_document=True
        )
        
        if result:
            return MessageInDB(**result)
        return None

    @staticmethod
    async def update_message_diagram(
        message_id: str,
        diagram_data: dict
    ) -> Optional[MessageInDB]:
        """
        Update diagram field for a message (used to store generated visual diagram).
        
        Args:
            message_id: Message's ObjectId as string
            diagram_data: Dictionary with diagram data:
                - type: 'svg' or 'ascii'
                - diagram_type: e.g., 'process', 'cycle', 'structure'
                - content: SVG markup or ASCII art
                - title: Diagram title
                - size_bytes: Optional size in bytes
                
        Returns:
            Updated MessageInDB or None
        """
        if not ObjectId.is_valid(message_id):
            return None
            
        collection = await MessagesDatabase.get_collection()
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(message_id)},
            {"$set": {"diagram": diagram_data}},
            return_document=True
        )
        
        if result:
            return MessageInDB(**result)
        return None

    @staticmethod
    async def get_messages_for_sync(
        conversation_id: str,
        days: int = 15
    ) -> List[dict]:
        """
        Get messages for sync (past N days, without audio fields).
        
        This method is specifically designed for the /sync/pull endpoint.
        It excludes audio data to reduce payload size.
        
        Args:
            conversation_id: Conversation's ObjectId as string
            days: Number of days to look back (default 15)
            
        Returns:
            List of message dicts without audio fields
        """
        if not ObjectId.is_valid(conversation_id):
            return []
            
        collection = await MessagesDatabase.get_collection()
        
        # Calculate date range (past N days)
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Projection to exclude audio fields
        projection = {
            "_id": 1,
            "conversation_id": 1,
            "profile_id": 1,
            "role": 1,
            "content": 1,
            "content_translated": 1,
            "timestamp": 1,
            "rag_references": 1
            # Explicitly NOT including: audio_url, audio_base64, audio_format, audio_language, audio_language_name
        }
        
        # Query: messages in conversation created after cutoff date
        cursor = collection.find(
            {
                "conversation_id": ObjectId(conversation_id),
                "timestamp": {"$gte": cutoff_date}
            },
            projection
        ).sort("timestamp", 1)  # Chronological order
        
        messages = []
        async for doc in cursor:
            # Convert ObjectIds to strings for JSON serialization
            msg = {
                "_id": str(doc["_id"]),
                "conversation_id": str(doc["conversation_id"]),
                "profile_id": str(doc["profile_id"]),
                "role": doc["role"],
                "content": doc["content"],
                "content_translated": doc.get("content_translated"),
                "timestamp": doc["timestamp"],
                "rag_references": [str(ref) for ref in doc.get("rag_references", [])]
            }
            messages.append(msg)
        
        return messages
