from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import enum
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "docgen")

# Enums
class SubscriptionType(str, enum.Enum):
    NONE = "none"
    MONTHLY = "monthly"  # 30 dni
    LIFETIME = "lifetime"

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

# MongoDB Client
client = None
db = None

async def init_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Create indexes
    await db.users.create_index("email", unique=True)
    # Only index google_id where it exists and is not null
    await db.users.create_index(
        "google_id",
        unique=True,
        partialFilterExpression={"google_id": {"$type": "string"}}
    )
    await db.documents.create_index("user_id")
    await db.documents.create_index("created_at")

    print(f"✅ MongoDB connected to {MONGO_URL}/{DB_NAME}")

def get_db():
    return db

# Helper functions for User model
def user_has_access(user: dict) -> bool:
    """Check if user has valid subscription"""
    if not user.get("is_active", True):
        return False
    if user.get("role") == UserRole.ADMIN.value:
        return True
    subscription_type = user.get("subscription_type", SubscriptionType.NONE.value)
    if subscription_type == SubscriptionType.NONE.value:
        return False
    if subscription_type == SubscriptionType.LIFETIME.value:
        return True
    if subscription_type == SubscriptionType.MONTHLY.value:
        expires = user.get("subscription_expires")
        if expires and expires > datetime.utcnow():
            return True
    return False

def user_days_remaining(user: dict) -> int:
    """Get days remaining in subscription"""
    subscription_type = user.get("subscription_type", SubscriptionType.NONE.value)
    if subscription_type == SubscriptionType.LIFETIME.value:
        return -1  # Unlimited
    if subscription_type == SubscriptionType.NONE.value:
        return 0
    expires = user.get("subscription_expires")
    if expires:
        delta = expires - datetime.utcnow()
        return max(0, delta.days)
    return 0

def create_user_dict(
    user_id: str,
    email: str,
    hashed_password: str = None,
    name: str = None,
    google_id: str = None,
    is_google_user: bool = False,
    role: str = UserRole.USER.value,
    subscription_type: str = SubscriptionType.NONE.value
) -> dict:
    """Create user dictionary for MongoDB"""
    return {
        "id": user_id,
        "email": email,
        "hashed_password": hashed_password,
        "name": name,
        "is_google_user": is_google_user,
        "google_id": google_id,
        "role": role,
        "subscription_type": subscription_type,
        "subscription_expires": None,
        "documents_generated": 0,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "is_active": True
    }

def create_document_dict(
    doc_id: str,
    user_id: str,
    template: str,
    name: str,
    email: str,
    order_number: str,
    date: str,
    amount: float,
    additional_info: str = None,
    email_sent: bool = False
) -> dict:
    """Create document dictionary for MongoDB"""
    return {
        "id": doc_id,
        "user_id": user_id,
        "template": template,
        "name": name,
        "email": email,
        "order_number": order_number,
        "date": date,
        "amount": amount,
        "additional_info": additional_info,
        "created_at": datetime.utcnow(),
        "email_sent": email_sent
    }
