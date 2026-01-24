"""
Quizzes Database Operations
============================
CRUD operations for the quizzes collection.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional, List
from datetime import datetime, date, time

from app.models.quiz import QuizCreate, QuizInDB
from app.database.mongodb import get_database


def date_to_datetime(d: date) -> datetime:
    """Convert date to datetime for MongoDB storage (date is stored as datetime at midnight)."""
    if isinstance(d, datetime):
        return d
    return datetime.combine(d, time.min)


class QuizzesDatabase:
    """Database operations for quizzes collection."""
    
    COLLECTION_NAME = "quizzes"
    
    @staticmethod
    async def get_collection():
        """Get quizzes collection from database."""
        client = await get_database()
        return client["digimasterji"][QuizzesDatabase.COLLECTION_NAME]
    
    @staticmethod
    async def create_quiz(quiz_data: QuizCreate) -> QuizInDB:
        """
        Create a new quiz.
        
        Args:
            quiz_data: Quiz creation data
            
        Returns:
            QuizInDB: Created quiz document
        """
        if not ObjectId.is_valid(quiz_data.profile_id):
            raise ValueError("Invalid profile_id")
            
        collection = await QuizzesDatabase.get_collection()
        
        # Convert source_conversation_ids to ObjectIds
        source_conv_ids = []
        for conv_id in quiz_data.source_conversation_ids:
            if ObjectId.is_valid(conv_id):
                source_conv_ids.append(ObjectId(conv_id))
        
        quiz_dict = {
            "profile_id": ObjectId(quiz_data.profile_id),
            "topic": quiz_data.topic,
            "source_conversation_ids": source_conv_ids,
            "questions": [q.model_dump() for q in quiz_data.questions],
            "difficulty": quiz_data.difficulty,
            "quiz_date": date_to_datetime(quiz_data.quiz_date),
            "created_at": datetime.utcnow(),
            "status": "pending",
            "score": None,
            "completed_at": None,
            "xp_earned": None
        }
        
        result = await collection.insert_one(quiz_dict)
        quiz_dict["_id"] = result.inserted_id
        
        return QuizInDB(**quiz_dict)
    
    @staticmethod
    async def get_quiz_by_id(quiz_id: str) -> Optional[QuizInDB]:
        """
        Get quiz by ID.
        
        Args:
            quiz_id: Quiz's ObjectId as string
            
        Returns:
            QuizInDB or None
        """
        if not ObjectId.is_valid(quiz_id):
            return None
            
        collection = await QuizzesDatabase.get_collection()
        quiz_doc = await collection.find_one({"_id": ObjectId(quiz_id)})
        
        if quiz_doc:
            return QuizInDB(**quiz_doc)
        return None
    
    @staticmethod
    async def get_pending_quizzes_by_profile(profile_id: str) -> List[QuizInDB]:
        """
        Get all pending quizzes for a profile.
        
        Args:
            profile_id: Profile's ObjectId as string
            
        Returns:
            List of pending QuizInDB
        """
        if not ObjectId.is_valid(profile_id):
            return []
            
        collection = await QuizzesDatabase.get_collection()
        
        cursor = collection.find(
            {
                "profile_id": ObjectId(profile_id),
                "status": "pending"
            }
        ).sort("created_at", -1)
        
        quizzes = []
        async for doc in cursor:
            quizzes.append(QuizInDB(**doc))
        
        return quizzes
    
    @staticmethod
    async def get_quiz_for_date(profile_id: str, quiz_date: date) -> Optional[QuizInDB]:
        """
        Get quiz for a specific date and profile.
        
        Args:
            profile_id: Profile's ObjectId as string
            quiz_date: Date of the quiz
            
        Returns:
            QuizInDB or None
        """
        if not ObjectId.is_valid(profile_id):
            return None
            
        collection = await QuizzesDatabase.get_collection()
        
        # Convert date to datetime for MongoDB query
        quiz_datetime = date_to_datetime(quiz_date)
        
        quiz_doc = await collection.find_one({
            "profile_id": ObjectId(profile_id),
            "quiz_date": quiz_datetime
        })
        
        if quiz_doc:
            return QuizInDB(**quiz_doc)
        return None
    
    @staticmethod
    async def update_quiz_completion(
        quiz_id: str,
        score: int,
        xp_earned: int,
        user_answers: dict
    ) -> Optional[QuizInDB]:
        """
        Mark quiz as completed with score and answers.
        
        Args:
            quiz_id: Quiz's ObjectId as string
            score: Score percentage (0-100)
            xp_earned: XP points earned
            user_answers: Dictionary mapping question_id to user's answer
            
        Returns:
            Updated QuizInDB or None
        """
        if not ObjectId.is_valid(quiz_id):
            return None
            
        collection = await QuizzesDatabase.get_collection()
        
        # Get the quiz to update questions with user answers
        quiz = await QuizzesDatabase.get_quiz_by_id(quiz_id)
        if not quiz:
            return None
        
        # Update questions with user answers
        updated_questions = []
        for question in quiz.questions:
            question_dict = question.model_dump() if hasattr(question, 'model_dump') else question
            question_id = question_dict["question_id"]
            if question_id in user_answers:
                question_dict["user_answer"] = user_answers[question_id]
            updated_questions.append(question_dict)
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(quiz_id)},
            {"$set": {
                "status": "completed",
                "score": score,
                "xp_earned": xp_earned,
                "completed_at": datetime.utcnow(),
                "questions": updated_questions
            }},
            return_document=True
        )
        
        if result:
            return QuizInDB(**result)
        return None
    
    @staticmethod
    async def get_completed_quizzes_by_profile(
        profile_id: str,
        limit: Optional[int] = None
    ) -> List[QuizInDB]:
        """
        Get completed quizzes for a profile.
        
        Args:
            profile_id: Profile's ObjectId as string
            limit: Optional limit on number of quizzes
            
        Returns:
            List of completed QuizInDB
        """
        if not ObjectId.is_valid(profile_id):
            return []
            
        collection = await QuizzesDatabase.get_collection()
        
        cursor = collection.find(
            {
                "profile_id": ObjectId(profile_id),
                "status": "completed"
            }
        ).sort("completed_at", -1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        quizzes = []
        async for doc in cursor:
            quizzes.append(QuizInDB(**doc))
        
        return quizzes
    
    @staticmethod
    async def count_completed_quizzes(profile_id: str) -> int:
        """
        Count completed quizzes for a profile.
        
        Args:
            profile_id: Profile's ObjectId as string
            
        Returns:
            Count of completed quizzes
        """
        if not ObjectId.is_valid(profile_id):
            return 0
            
        collection = await QuizzesDatabase.get_collection()
        count = await collection.count_documents({
            "profile_id": ObjectId(profile_id),
            "status": "completed"
        })
        
        return count
    
    @staticmethod
    async def get_average_score(profile_id: str) -> float:
        """
        Calculate average quiz score for a profile.
        
        Args:
            profile_id: Profile's ObjectId as string
            
        Returns:
            Average score (0-100)
        """
        if not ObjectId.is_valid(profile_id):
            return 0.0
            
        collection = await QuizzesDatabase.get_collection()
        
        pipeline = [
            {
                "$match": {
                    "profile_id": ObjectId(profile_id),
                    "status": "completed"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "average_score": {"$avg": "$score"}
                }
            }
        ]
        
        cursor = collection.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        
        if result and result[0].get("average_score") is not None:
            return round(result[0]["average_score"], 2)
        return 0.0
