"""
Background Task Scheduler - Daily Quiz Generation
==================================================
Automatically generates daily quizzes for all profiles using APScheduler.
Also handles streak reset and old quiz cleanup.
"""

import logging
from datetime import date, datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database.profiles import ProfilesDatabase
from app.database.quizzes import QuizzesDatabase
from app.services.quiz_service import quiz_service

logger = logging.getLogger(__name__)

# Configuration
QUIZ_RETENTION_DAYS = 30  # Keep quizzes for 30 days


class QuizScheduler:
    """Scheduler for background quiz generation tasks."""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
    
    async def check_and_reset_streaks(self):
        """
        Check all profiles and reset streaks where quiz was not completed yesterday.
        Should run at the start of each day (after midnight).
        """
        try:
            logger.info("[QUIZ SCHEDULER] Checking streaks for all profiles")
            
            profile_ids = await ProfilesDatabase.get_all_profile_ids()
            reset_count = 0
            
            for profile_id in profile_ids:
                try:
                    # Check if streak should be broken
                    streak_broken = await QuizzesDatabase.check_streak_broken(profile_id)
                    
                    if streak_broken:
                        # Get current profile
                        profile = await ProfilesDatabase.get_profile_by_id(profile_id)
                        if profile and profile.gamification.current_streak_days > 0:
                            # Reset streak to 0
                            await ProfilesDatabase.reset_streak(profile_id)
                            logger.info(f"[QUIZ SCHEDULER] Reset streak for profile {profile_id}")
                            reset_count += 1
                            
                except Exception as e:
                    logger.error(f"[QUIZ SCHEDULER] Error checking streak for profile {profile_id}: {e}")
            
            logger.info(f"[QUIZ SCHEDULER] Streak check completed. Reset {reset_count} profiles.")
            
        except Exception as e:
            logger.error(f"[QUIZ SCHEDULER] Error in streak check task: {e}")
            import traceback
            traceback.print_exc()
    
    async def cleanup_old_quizzes(self):
        """
        Delete quizzes older than QUIZ_RETENTION_DAYS (30 days).
        Should run daily to keep database clean.
        """
        try:
            logger.info(f"[QUIZ SCHEDULER] Cleaning up quizzes older than {QUIZ_RETENTION_DAYS} days")
            
            deleted_count = await QuizzesDatabase.delete_old_quizzes(QUIZ_RETENTION_DAYS)
            
            logger.info(f"[QUIZ SCHEDULER] Deleted {deleted_count} old quizzes")
            
        except Exception as e:
            logger.error(f"[QUIZ SCHEDULER] Error in cleanup task: {e}")
            import traceback
            traceback.print_exc()
    
    async def generate_daily_quizzes(self):
        """
        Background task to generate daily quizzes for all profiles.
        Runs once daily at midnight (configurable).
        """
        try:
            logger.info("[QUIZ SCHEDULER] Starting daily quiz generation task")
            
            # First, check and reset streaks
            await self.check_and_reset_streaks()
            
            # Then, cleanup old quizzes
            await self.cleanup_old_quizzes()
            
            # Get all profile IDs
            profile_ids = await ProfilesDatabase.get_all_profile_ids()
            logger.info(f"[QUIZ SCHEDULER] Found {len(profile_ids)} profiles")
            
            success_count = 0
            skip_count = 0
            error_count = 0
            
            for profile_id in profile_ids:
                try:
                    # Check if quiz already exists for today
                    today = date.today()
                    existing_quiz = await QuizzesDatabase.get_quiz_for_date(profile_id, today)
                    
                    if existing_quiz:
                        logger.info(f"[QUIZ SCHEDULER] Quiz already exists for profile {profile_id}, skipping")
                        skip_count += 1
                        continue
                    
                    # Get profile data
                    profile = await ProfilesDatabase.get_profile_by_id(profile_id)
                    if not profile:
                        logger.warning(f"[QUIZ SCHEDULER] Profile {profile_id} not found")
                        error_count += 1
                        continue
                    
                    profile_data = {
                        "name": profile.name,
                        "age": profile.age,
                        "grade_level": profile.grade_level,
                        "preferred_language": profile.preferred_language
                    }
                    
                    # Generate quiz (5-10 questions)
                    logger.info(f"[QUIZ SCHEDULER] Generating quiz for profile: {profile.name} ({profile_id})")
                    
                    quiz_create = await quiz_service.generate_quiz_from_history(
                        profile_id=profile_id,
                        profile_data=profile_data,
                        num_questions=5
                    )
                    
                    if quiz_create:
                        # Save to database
                        quiz = await QuizzesDatabase.create_quiz(quiz_create)
                        logger.info(f"[QUIZ SCHEDULER] Successfully created quiz {quiz.id} for profile {profile_id}")
                        success_count += 1
                    else:
                        logger.error(f"[QUIZ SCHEDULER] Failed to generate quiz for profile {profile_id}")
                        error_count += 1
                        
                except Exception as e:
                    logger.error(f"[QUIZ SCHEDULER] Error generating quiz for profile {profile_id}: {e}")
                    error_count += 1
            
            logger.info(
                f"[QUIZ SCHEDULER] Daily quiz generation completed: "
                f"Success={success_count}, Skipped={skip_count}, Errors={error_count}"
            )
            
        except Exception as e:
            logger.error(f"[QUIZ SCHEDULER] Error in daily quiz generation task: {e}")
            import traceback
            traceback.print_exc()
    
    def start(self):
        """
        Start the scheduler.
        Configures daily quiz generation to run at midnight.
        """
        import os
        try:
            # Schedule daily quiz generation at midnight (00:00)
            self.scheduler.add_job(
                self.generate_daily_quizzes,
                trigger=CronTrigger(hour=0, minute=0),
                id='daily_quiz_generation',
                name='Generate Daily Quizzes',
                replace_existing=True
            )
            
            # For testing: Also schedule to run shortly after server start
            # This helps verify the system works on first deployment
            # Can be disabled with SKIP_STARTUP_QUIZ=true environment variable
            skip_startup = os.getenv("SKIP_STARTUP_QUIZ", "false").lower() == "true"
            
            if not skip_startup:
                # Increased delay to 60 seconds to allow server to stabilize
                startup_run_time = datetime.now() + timedelta(seconds=60)
                self.scheduler.add_job(
                    self.generate_daily_quizzes,
                    'date',
                    run_date=startup_run_time,
                    id='initial_quiz_generation',
                    name='Initial Quiz Generation (Startup)',
                    replace_existing=True
                )
                logger.info("[QUIZ SCHEDULER] Startup quiz generation scheduled for 60 seconds after start")
            else:
                logger.info("[QUIZ SCHEDULER] Startup quiz generation disabled by SKIP_STARTUP_QUIZ env var")
            
            self.scheduler.start()
            logger.info("[QUIZ SCHEDULER] Scheduler started successfully")
            logger.info("[QUIZ SCHEDULER] Daily quiz generation scheduled for midnight (00:00)")
            
        except Exception as e:
            logger.error(f"[QUIZ SCHEDULER] Error starting scheduler: {e}")
            import traceback
            traceback.print_exc()
    
    def shutdown(self):
        """Shutdown the scheduler gracefully."""
        try:
            self.scheduler.shutdown(wait=False)
            logger.info("[QUIZ SCHEDULER] Scheduler shutdown successfully")
        except Exception as e:
            logger.error(f"[QUIZ SCHEDULER] Error shutting down scheduler: {e}")


# Global scheduler instance
quiz_scheduler = QuizScheduler()
