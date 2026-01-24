"""
Quizzes Database Operations
============================
CRUD operations for the quizzes collection.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional, List
from datetime import datetime, date, time, timedelta

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
        limit: Optional[int] = None,
        days: Optional[int] = None
    ) -> List[QuizInDB]:
        """
        Get completed quizzes for a profile.
        
        Args:
            profile_id: Profile's ObjectId as string
            limit: Optional limit on number of quizzes
            days: Optional number of days to look back
            
        Returns:
            List of completed QuizInDB
        """
        if not ObjectId.is_valid(profile_id):
            return []
            
        collection = await QuizzesDatabase.get_collection()
        
        query = {
            "profile_id": ObjectId(profile_id),
            "status": "completed"
        }
        
        # Add date filter if days specified
        if days is not None:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query["completed_at"] = {"$gte": cutoff_date}
        
        cursor = collection.find(query).sort("completed_at", -1)
        
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

    @staticmethod
    async def get_quizzes_for_revision(
        profile_id: str,
        days: int = 30
    ) -> List[QuizInDB]:
        """
        Get completed quizzes with all questions for revision.
        Only returns quizzes from the last N days.
        
        Args:
            profile_id: Profile's ObjectId as string
            days: Number of days to look back (default: 30)
            
        Returns:
            List of completed QuizInDB with questions
        """
        if not ObjectId.is_valid(profile_id):
            return []
            
        collection = await QuizzesDatabase.get_collection()
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        cursor = collection.find(
            {
                "profile_id": ObjectId(profile_id),
                "status": "completed",
                "completed_at": {"$gte": cutoff_date}
            }
        ).sort("completed_at", -1)
        
        quizzes = []
        async for doc in cursor:
            quizzes.append(QuizInDB(**doc))
        
        return quizzes

    @staticmethod
    async def get_all_quizzes_for_profile(
        profile_id: str,
        days: int = 30
    ) -> List[QuizInDB]:
        """
        Get all quizzes (pending and completed) for a profile within N days.
        Used for sync operations.
        
        Args:
            profile_id: Profile's ObjectId as string
            days: Number of days to look back (default: 30)
            
        Returns:
            List of QuizInDB
        """
        if not ObjectId.is_valid(profile_id):
            return []
            
        collection = await QuizzesDatabase.get_collection()
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        cursor = collection.find(
            {
                "profile_id": ObjectId(profile_id),
                "created_at": {"$gte": cutoff_date}
            }
        ).sort("created_at", -1)
        
        quizzes = []
        async for doc in cursor:
            quizzes.append(QuizInDB(**doc))
        
        return quizzes

    @staticmethod
    async def delete_old_quizzes(days: int = 30) -> int:
        """
        Delete quizzes older than N days.
        
        Args:
            days: Number of days to retain quizzes (default: 30)
            
        Returns:
            Number of deleted quizzes
        """
        collection = await QuizzesDatabase.get_collection()
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await collection.delete_many({
            "created_at": {"$lt": cutoff_date}
        })
        
        return result.deleted_count

    @staticmethod
    async def get_missed_quiz_dates(
        profile_id: str,
        days: int = 30,
        profile_created_at: datetime = None
    ) -> List[date]:
        """
        Get list of dates within N days where no quiz was completed.
        Used for creating backlog quizzes.
        Only returns dates AFTER the profile was created.
        
        Args:
            profile_id: Profile's ObjectId as string
            days: Number of days to check (default: 30)
            profile_created_at: Profile creation date (to avoid backlog before account existed)
            
        Returns:
            List of dates without completed quizzes
        """
        if not ObjectId.is_valid(profile_id):
            return []
            
        collection = await QuizzesDatabase.get_collection()
        
        # Get all quiz dates for this profile
        cursor = collection.find(
            {"profile_id": ObjectId(profile_id)},
            {"quiz_date": 1, "status": 1}
        )
        
        existing_quizzes = {}
        async for doc in cursor:
            quiz_dt = doc.get("quiz_date")
            if quiz_dt:
                quiz_d = quiz_dt.date() if isinstance(quiz_dt, datetime) else quiz_dt
                existing_quizzes[quiz_d] = doc.get("status")
        
        # Find missed dates (within last N days, excluding today)
        today = date.today()
        missed_dates = []
        
        # Determine the earliest date to check based on profile creation
        if profile_created_at:
            profile_start_date = profile_created_at.date() if isinstance(profile_created_at, datetime) else profile_created_at
            # Only check dates after profile was created (next day after creation)
            earliest_check_date = profile_start_date + timedelta(days=1)
        else:
            earliest_check_date = today - timedelta(days=days)
        
        for i in range(1, days):  # Start from 1 to exclude today
            check_date = today - timedelta(days=i)
            
            # Skip dates before profile was created
            if check_date < earliest_check_date:
                continue
                
            if check_date not in existing_quizzes:
                missed_dates.append(check_date)
            elif existing_quizzes[check_date] == "pending":
                # Quiz exists but wasn't completed - treat as missed for backlog
                missed_dates.append(check_date)
        
        return missed_dates

    @staticmethod
    async def create_backlog_quiz(quiz_data: QuizCreate, is_backlog: bool = True) -> QuizInDB:
        """
        Create a backlog quiz (quiz for a past date that was missed).
        
        Args:
            quiz_data: Quiz creation data
            is_backlog: Whether this is a backlog quiz (default: True)
            
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
            "xp_earned": None,
            "is_backlog": is_backlog
        }
        
        result = await collection.insert_one(quiz_dict)
        quiz_dict["_id"] = result.inserted_id
        
        return QuizInDB(**quiz_dict)

    @staticmethod
    async def is_backlog_quiz(quiz_id: str) -> bool:
        """
        Check if a quiz is a backlog quiz.
        
        Args:
            quiz_id: Quiz's ObjectId as string
            
        Returns:
            True if backlog quiz, False otherwise
        """
        if not ObjectId.is_valid(quiz_id):
            return False
            
        collection = await QuizzesDatabase.get_collection()
        
        quiz_doc = await collection.find_one(
            {"_id": ObjectId(quiz_id)},
            {"is_backlog": 1, "quiz_date": 1}
        )
        
        if not quiz_doc:
            return False
        
        # If explicitly marked as backlog
        if quiz_doc.get("is_backlog"):
            return True
        
        # Or if quiz_date is before today
        quiz_date = quiz_doc.get("quiz_date")
        if quiz_date:
            quiz_d = quiz_date.date() if isinstance(quiz_date, datetime) else quiz_date
            if quiz_d < date.today():
                return True
        
        return False

    @staticmethod
    async def check_streak_broken(profile_id: str) -> bool:
        """
        Check if streak should be reset (no quiz completed yesterday).
        
        Args:
            profile_id: Profile's ObjectId as string
            
        Returns:
            True if streak is broken, False otherwise
        """
        if not ObjectId.is_valid(profile_id):
            return True
            
        collection = await QuizzesDatabase.get_collection()
        
        yesterday = date.today() - timedelta(days=1)
        yesterday_dt = date_to_datetime(yesterday)
        
        # Check if there's a completed quiz for yesterday
        quiz_doc = await collection.find_one({
            "profile_id": ObjectId(profile_id),
            "quiz_date": yesterday_dt,
            "status": "completed"
        })
        
        return quiz_doc is None
