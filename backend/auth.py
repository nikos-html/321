from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import httpx
import uuid

from database import get_db, UserRole, user_has_access

# Config
SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-key-change-in-production-123456")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nie jesteś zalogowany"
        )

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy token"
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy token"
        )

    db = get_db()
    user = await db.users.find_one({"id": user_id}, {"_id": 0})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Użytkownik nie istnieje"
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto zostało dezaktywowane"
        )

    return user

async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[dict]:
    """Get current user if logged in, otherwise return None"""
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

async def get_admin_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    if current_user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień administratora"
        )
    return current_user

async def get_user_with_access(
    current_user: dict = Depends(get_current_user)
) -> dict:
    if not user_has_access(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak aktywnej subskrypcji. Skontaktuj się z administratorem."
        )
    return current_user

async def verify_google_token(token: str) -> Optional[dict]:
    """Verify Google OAuth token and return user info"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"Google verification error: {e}")
    return None

async def create_user_in_db(
    email: str,
    password: Optional[str] = None,
    name: Optional[str] = None,
    google_id: Optional[str] = None,
    is_google_user: bool = False
) -> dict:
    from database import get_db, create_user_dict

    db = get_db()
    user_id = str(uuid.uuid4())

    user = create_user_dict(
        user_id=user_id,
        email=email,
        hashed_password=get_password_hash(password) if password else None,
        name=name,
        google_id=google_id,
        is_google_user=is_google_user
    )

    await db.users.insert_one(user)

    # Return without _id
    user.pop("_id", None)
    return user
