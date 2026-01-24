"""
Authentication Router
====================
Endpoints for user registration and login.
"""

from fastapi import APIRouter, HTTPException, status
from datetime import timedelta, datetime

from app.models.auth import (
    LoginRequest, 
    LoginResponse, 
    RegisterRequest, 
    RegisterResponse,
    RefreshRequest,
    RefreshResponse,
    ErrorResponse
)
from app.models.user import UserCreate
from app.database.users import UsersDatabase
from app.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    create_refresh_token,
    decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request - Email or phone already exists"},
        422: {"model": ErrorResponse, "description": "Validation Error"}
    },
    summary="Register a new master account",
    description="Create a new master account (Parent/Teacher) for the DigiMasterji platform"
)
async def register(request: RegisterRequest):
    """
    Register a new master account (Family/Classroom owner).
    
    - **email**: Valid email address (must be unique)
    - **phone_number**: Indian mobile number in format +91XXXXXXXXXX (must be unique)
    - **full_name**: Full name of the account holder
    - **password**: Strong password (minimum 8 characters)
    
    Returns JWT access token and user ID for immediate login.
    """
    
    # Check if email already exists
    if await UsersDatabase.email_exists(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if phone number already exists
    if await UsersDatabase.phone_exists(request.phone_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Hash the password
    password_hash = get_password_hash(request.password)
    
    # Create user data
    user_data = UserCreate(
        email=request.email,
        phone_number=request.phone_number,
        full_name=request.full_name,
        password=request.password  # Will be hashed in database layer
    )
    
    # Create user in database
    try:
        user = await UsersDatabase.create_user(user_data, password_hash)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token_expires_at = datetime.utcnow() + access_token_expires
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "type": "master_user"
        },
        expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "email": user.email
        },
        expires_delta=refresh_token_expires
    )
    
    # Store refresh token in database
    refresh_token_expires_at = datetime.utcnow() + refresh_token_expires
    await UsersDatabase.update_refresh_token(
        str(user.id),
        refresh_token,
        refresh_token_expires_at
    )
    
    return RegisterResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_at=access_token_expires_at,
        user_id=str(user.id),
        message="User registered successfully"
    )


@router.post(
    "/token",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        422: {"model": ErrorResponse, "description": "Validation Error"}
    },
    summary="Login to master account",
    description="Authenticate and obtain JWT access token for API access"
)
async def login(request: LoginRequest):
    """
    Login to the master account using email/phone and password.
    
    - **username**: Email address or phone number (+91XXXXXXXXXX)
    - **password**: Account password
    
    Returns JWT access token for authenticated API requests.
    """
    
    # Try to find user by email or phone
    user = None
    
    # Check if username is an email
    if "@" in request.username:
        user = await UsersDatabase.get_user_by_email(request.username)
    else:
        # Assume it's a phone number
        user = await UsersDatabase.get_user_by_phone(request.username)
    
    # Verify user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Update last login timestamp
    await UsersDatabase.update_last_login(str(user.id))
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token_expires_at = datetime.utcnow() + access_token_expires
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "type": "master_user"
        },
        expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "email": user.email
        },
        expires_delta=refresh_token_expires
    )
    
    # Store refresh token in database
    refresh_token_expires_at = datetime.utcnow() + refresh_token_expires
    await UsersDatabase.update_refresh_token(
        str(user.id),
        refresh_token,
        refresh_token_expires_at
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_at=access_token_expires_at,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        422: {"model": ErrorResponse, "description": "Validation Error"}
    },
    summary="Login to master account (alias)",
    description="Alternative endpoint for login - same as /auth/token"
)
async def login_alias(request: LoginRequest):
    """
    Alternative login endpoint (same functionality as /auth/token).
    Provided for API consistency with common auth patterns.
    """
    return await login(request)


@router.post(
    "/refresh",
    response_model=RefreshResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or expired refresh token"},
        422: {"model": ErrorResponse, "description": "Validation Error"}
    },
    summary="Refresh access token",
    description="Generate new access and refresh tokens using a valid refresh token"
)
async def refresh_token(request: RefreshRequest):
    """
    Refresh the access token using a valid refresh token.
    
    This endpoint implements silent refresh for maintaining user sessions:
    - Validates the provided refresh token
    - Checks if it matches the stored token in the database
    - Verifies the token is not expired
    - Issues new access and refresh tokens
    - Updates the stored refresh token
    
    Frontend should call this endpoint when:
    - Access token expires (401 response)
    - Proactively before token expiration
    
    - **refresh_token**: Valid refresh token from previous login/register
    
    Returns new access token and refresh token.
    """
    
    # Decode the refresh token
    payload = decode_access_token(request.refresh_token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify token type
    token_type = payload.get("type")
    if token_type != "refresh_token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extract user ID
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify refresh token matches the one stored in database
    is_valid = await UsersDatabase.verify_refresh_token(user_id, request.refresh_token)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked or expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Get user details
    user = await UsersDatabase.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Generate new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token_expires_at = datetime.utcnow() + access_token_expires
    new_access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "type": "master_user"
        },
        expires_delta=access_token_expires
    )
    
    # Generate new refresh token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "email": user.email
        },
        expires_delta=refresh_token_expires
    )
    
    # Update refresh token in database
    refresh_token_expires_at = datetime.utcnow() + refresh_token_expires
    await UsersDatabase.update_refresh_token(
        str(user.id),
        new_refresh_token,
        refresh_token_expires_at
    )
    
    return RefreshResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_at=access_token_expires_at
    )
