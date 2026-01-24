"""
Test Sync Pull Endpoint
========================
Test script to verify /sync/pull endpoint fetches data correctly.
"""

import asyncio
import httpx
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

BASE_URL = "http://localhost:8000"

# Test user credentials (use existing test user or create new)
TEST_USER = {
    "email": "synctest@example.com",
    "phone_number": "+919876543288",
    "full_name": "Sync Test User",
    "password": "SecurePassword123"
}

TEST_PROFILE = {
    "name": "Test Student",
    "age": 12,
    "grade_level": "6th",
    "preferred_language": "Hindi",
    "avatar": "default_avatar.png"
}


async def get_or_create_user():
    """Get existing user token or register new user."""
    print("\n=== Getting user access token ===")
    
    async with httpx.AsyncClient() as client:
        # Try to login first
        login_response = await client.post(
            f"{BASE_URL}/auth/token",
            json={
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            print(f"✓ Logged in as existing user: {data['email']}")
            return data["access_token"], data["user_id"]
        
        # Register new user
        register_response = await client.post(
            f"{BASE_URL}/auth/register",
            json=TEST_USER
        )
        
        if register_response.status_code == 201:
            data = register_response.json()
            print(f"✓ Registered new user")
            return data["access_token"], data["user_id"]
        
        print(f"✗ Failed to authenticate: {register_response.text}")
        return None, None


async def create_test_profile(access_token):
    """Create a test profile if none exist."""
    print("\n=== Creating test profile ===")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Check existing profiles
        profiles_response = await client.get(
            f"{BASE_URL}/profiles/",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if profiles_response.status_code == 200:
            profiles = profiles_response.json()
            if len(profiles) > 0:
                print(f"✓ Found {len(profiles)} existing profile(s)")
                return profiles[0]["_id"]
        
        # Create new profile
        create_response = await client.post(
            f"{BASE_URL}/profiles/",
            headers={"Authorization": f"Bearer {access_token}"},
            json=TEST_PROFILE
        )
        
        if create_response.status_code == 201:
            profile = create_response.json()
            print(f"✓ Created new profile: {profile['name']}")
            return profile["_id"]
        
        print(f"✗ Failed to create profile: {create_response.text}")
        return None


async def test_sync_pull(access_token):
    """Test the /sync/pull endpoint."""
    print("\n=== Testing /sync/pull ===")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Test with default parameters (180 days, configurable via SYNC_DEFAULT_DAYS env var)
        response = await client.get(
            f"{BASE_URL}/sync/pull",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Sync pull successful!")
            print(f"\n  Response Summary:")
            print(f"  -----------------")
            print(f"  Success: {data['success']}")
            print(f"  User: {data['user_full_name']} ({data['user_email']})")
            print(f"  Sync Timestamp: {data['sync_timestamp']}")
            print(f"  Sync Period: {data['sync_period_days']} days")
            print(f"\n  Data Counts:")
            print(f"  - Total Profiles: {data['total_profiles']}")
            print(f"  - Total Conversations: {data['total_conversations']}")
            print(f"  - Total Messages: {data['total_messages']}")
            
            # Show profile details
            if data['profiles']:
                print(f"\n  Profiles:")
                for profile in data['profiles']:
                    print(f"    - {profile['name']} (Age: {profile['age']}, Grade: {profile['grade_level']})")
                    print(f"      Language: {profile['preferred_language']}")
                    print(f"      XP: {profile['gamification']['xp']}, Streak: {profile['gamification']['current_streak_days']}")
                    print(f"      Conversations: {len(profile['conversations'])}")
                    
                    # Show conversation details
                    for conv in profile['conversations'][:3]:  # Show first 3
                        print(f"        - {conv['title']} ({len(conv['messages'])} messages)")
            
            return data
        else:
            print(f"✗ Sync pull failed with status {response.status_code}")
            print(f"  Response: {response.text}")
            return None


async def test_sync_pull_with_custom_days(access_token, days):
    """Test /sync/pull with custom days parameter."""
    print(f"\n=== Testing /sync/pull?days={days} ===")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(
            f"{BASE_URL}/sync/pull?days={days}",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Sync pull with {days} days successful!")
            print(f"  Total Messages: {data['total_messages']}")
            return data
        else:
            print(f"✗ Failed: {response.text}")
            return None


async def test_sync_pull_unauthorized():
    """Test /sync/pull without authentication."""
    print("\n=== Testing /sync/pull (unauthorized) ===")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(f"{BASE_URL}/sync/pull")
        
        if response.status_code == 403:
            print("✓ Correctly rejected unauthorized request (403)")
            return True
        else:
            print(f"✗ Expected 403, got {response.status_code}")
            return False


async def verify_no_audio_in_response(data):
    """Verify that audio fields are not present in messages."""
    print("\n=== Verifying no audio data in response ===")
    
    audio_fields = ["audio_url", "audio_base64", "audio_format", "audio_language", "audio_language_name"]
    found_audio = False
    
    for profile in data.get("profiles", []):
        for conv in profile.get("conversations", []):
            for msg in conv.get("messages", []):
                for field in audio_fields:
                    if field in msg and msg[field] is not None:
                        print(f"✗ Found audio field '{field}' in message!")
                        found_audio = True
    
    if not found_audio:
        print("✓ No audio data found in response (as expected)")
    
    return not found_audio


async def main():
    """Run all sync tests."""
    print("\n" + "=" * 60)
    print("  SYNC PULL ENDPOINT TEST SUITE")
    print("=" * 60)
    
    # Step 1: Get user token
    access_token, user_id = await get_or_create_user()
    if not access_token:
        print("\n✗ Failed to get access token. Exiting.")
        return
    
    # Step 2: Ensure at least one profile exists
    profile_id = await create_test_profile(access_token)
    
    # Step 3: Test unauthorized access
    await test_sync_pull_unauthorized()
    
    # Step 4: Test sync pull with default parameters
    sync_data = await test_sync_pull(access_token)
    
    if sync_data:
        # Step 5: Verify no audio data
        await verify_no_audio_in_response(sync_data)
        
        # Step 6: Test with custom days
        await test_sync_pull_with_custom_days(access_token, 7)
        await test_sync_pull_with_custom_days(access_token, 30)
    
    print("\n" + "=" * 60)
    print("  SYNC PULL TEST COMPLETE")
    print("=" * 60)
    print("\n✓ All tests completed\n")


if __name__ == "__main__":
    asyncio.run(main())
