from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import enum
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/docgen")

# Fix for Railway PostgreSQL URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SubscriptionType(str, enum.Enum):
    NONE = "none"
    MONTHLY = "monthly"  # 30 dni
    LIFETIME = "lifetime"

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Null for Google users
    name = Column(String, nullable=True)
    
    # Auth
    is_google_user = Column(Boolean, default=False)
    google_id = Column(String, nullable=True, unique=True)
    
    # Role & Access
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    subscription_type = Column(SQLEnum(SubscriptionType), default=SubscriptionType.NONE)
    subscription_expires = Column(DateTime, nullable=True)  # Null for lifetime
    
    # Stats
    documents_generated = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    documents = relationship("Document", back_populates="user")
    
    def has_access(self):
        """Check if user has valid subscription"""
        if not self.is_active:
            return False
        if self.role == UserRole.ADMIN:
            return True
        if self.subscription_type == SubscriptionType.NONE:
            return False
        if self.subscription_type == SubscriptionType.LIFETIME:
            return True
        if self.subscription_type == SubscriptionType.MONTHLY:
            if self.subscription_expires and self.subscription_expires > datetime.utcnow():
                return True
        return False
    
    def days_remaining(self):
        """Get days remaining in subscription"""
        if self.subscription_type == SubscriptionType.LIFETIME:
            return -1  # Unlimited
        if self.subscription_type == SubscriptionType.NONE:
            return 0
        if self.subscription_expires:
            delta = self.subscription_expires - datetime.utcnow()
            return max(0, delta.days)
        return 0

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Document data
    template = Column(String, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    order_number = Column(String, nullable=False)
    date = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    additional_info = Column(Text, nullable=True)
    
    # Meta
    created_at = Column(DateTime, default=datetime.utcnow)
    email_sent = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="documents")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
