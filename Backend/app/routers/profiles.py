"""
Profiles Router
===============
API endpoints for student profile management.
Implements the "Netflix-style" profile switching system.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from datetime import timedelta

from app.models.profile import ProfileCreate, ProfileResponse, ProfileUpdate, ProfileWithStats
from app.database.profiles import ProfilesDatabase
from app.database.users import UsersDatabase
from app.utils.security import decode_access_token, create_access_token


router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"]
)

security = HTTPBearer()


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency to extract and validate user ID from JWT token.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        User ID from token
        
    Raises:
        HTTPException: If token is invalid or user doesn't exist
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Verify user exists
    user = await UsersDatabase.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user_id


@router.get("/", response_model=List[ProfileResponse], status_code=status.HTTP_200_OK)
async def list_profiles(current_user_id: str = Depends(get_current_user_id)):
    """
    Get all profiles for the logged-in master account.
    
    This is the "Who is watching?" screen equivalent.
    
    Args:
        current_user_id: Authenticated user's ID from JWT token
        
    Returns:
        List of ProfileResponse objects
    """
    profiles = await ProfilesDatabase.get_profiles_by_user(current_user_id)
    
    # Convert ProfileInDB to ProfileResponse
    return [
        ProfileResponse(
            _id=str(profile.id),
            master_user_id=str(profile.master_user_id),
            name=profile.name,
            age=profile.age,
            grade_level=profile.grade_level,
            preferred_language=profile.preferred_language,
            avatar=profile.avatar,
            gamification=profile.gamification,
            learning_preferences=profile.learning_preferences,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
        for profile in profiles
    ]


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: ProfileCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Create a new student profile under the current master account.
    
    Args:
        profile_data: Profile creation data (name, age, grade, language, avatar)
        current_user_id: Authenticated user's ID from JWT token
        
    Returns:
        Created ProfileResponse object
        
    Raises:
        HTTPException: If profile limit is reached (max 5 profiles per account)
    """
    # Check profile count limit (optional: 5 profiles max per family)
    profile_count = await ProfilesDatabase.count_profiles_by_user(current_user_id)
    MAX_PROFILES = 5
    
    if profile_count >= MAX_PROFILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_PROFILES} profiles allowed per account"
        )
    
    # Create the profile
    profile = await ProfilesDatabase.create_profile(current_user_id, profile_data)
    
    return ProfileResponse(
        _id=str(profile.id),
        master_user_id=str(profile.master_user_id),
        name=profile.name,
        age=profile.age,
        grade_level=profile.grade_level,
        preferred_language=profile.preferred_language,
        avatar=profile.avatar,
        gamification=profile.gamification,
        learning_preferences=profile.learning_preferences,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.get("/{profile_id}", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
async def get_profile(
    profile_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get specific profile details including gamification stats.
    
    Args:
        profile_id: Profile's unique ID
        current_user_id: Authenticated user's ID from JWT token
        
    Returns:
        ProfileResponse object with XP, streaks, badges
        
    Raises:
        HTTPException: If profile not found or doesn't belong to current user
    """
    profile = await ProfilesDatabase.get_profile_by_id(profile_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Verify profile belongs to current user
    if str(profile.master_user_id) != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profile"
        )
    
    return ProfileResponse(
        _id=str(profile.id),
        master_user_id=str(profile.master_user_id),
        name=profile.name,
        age=profile.age,
        grade_level=profile.grade_level,
        preferred_language=profile.preferred_language,
        avatar=profile.avatar,
        gamification=profile.gamification,
        learning_preferences=profile.learning_preferences,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.put("/{profile_id}", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
async def update_profile(
    profile_id: str,
    profile_update: ProfileUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Update profile information (e.g., change avatar, language preference).
    
    Args:
        profile_id: Profile's unique ID
        profile_update: Fields to update
        current_user_id: Authenticated user's ID from JWT token
        
    Returns:
        Updated ProfileResponse object
        
    Raises:
        HTTPException: If profile not found or access denied
    """
    # Verify profile exists and belongs to current user
    existing_profile = await ProfilesDatabase.get_profile_by_id(profile_id)
    
    if not existing_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    if str(existing_profile.master_user_id) != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profile"
        )
    
    # Update the profile
    updated_profile = await ProfilesDatabase.update_profile(profile_id, profile_update)
    
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )
    
    return ProfileResponse(
        _id=str(updated_profile.id),
        master_user_id=str(updated_profile.master_user_id),
        name=updated_profile.name,
        age=updated_profile.age,
        grade_level=updated_profile.grade_level,
        preferred_language=updated_profile.preferred_language,
        avatar=updated_profile.avatar,
        gamification=updated_profile.gamification,
        learning_preferences=updated_profile.learning_preferences,
        created_at=updated_profile.created_at,
        updated_at=updated_profile.updated_at
    )


@router.delete("/{profile_id}", status_code=status.HTTP_200_OK)
async def delete_profile(
    profile_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Delete a student profile.
    
    Args:
        profile_id: Profile's unique ID
        current_user_id: Authenticated user's ID from JWT token
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If profile not found or access denied
    """
    # Verify profile exists and belongs to current user
    existing_profile = await ProfilesDatabase.get_profile_by_id(profile_id)
    
    if not existing_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    if str(existing_profile.master_user_id) != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profile"
        )
    
    # Delete the profile
    success = await ProfilesDatabase.delete_profile(profile_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile"
        )
    
    return {"status": "ok", "message": "Profile deleted successfully"}


@router.post("/{profile_id}/access", status_code=status.HTTP_200_OK)
async def generate_profile_token(
    profile_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Generate a temporary access token for a specific profile.
    
    This token is used for chat sessions and other profile-specific operations.
    Critical for "Netflix-style" profile switching - each profile gets its own token.
    
    Args:
        profile_id: Profile's unique ID
        current_user_id: Authenticated user's ID from JWT token
        
    Returns:
        Profile access token with 24-hour expiration
        
    Raises:
        HTTPException: If profile not found or access denied
    """
    # Verify profile exists and belongs to current user
    profile = await ProfilesDatabase.get_profile_by_id(profile_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    if str(profile.master_user_id) != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profile"
        )
    
    # Create profile-specific token with extended expiration (24 hours)
    token_data = {
        "sub": str(profile.id),
        "type": "profile_token",
        "master_user_id": current_user_id,
        "profile_name": profile.name,
        "grade_level": profile.grade_level,
        "preferred_language": profile.preferred_language
    }
    
    profile_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(hours=24)
    )
    
    return {
        "profile_token": profile_token,
        "token_type": "bearer",
        "expires_in": 86400,  # 24 hours in seconds
        "profile_id": str(profile.id),
        "profile_name": profile.name
    }
