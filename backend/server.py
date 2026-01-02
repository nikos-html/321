from fastapi import FastAPI, APIRouter, HTTPException, status, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Security
security = HTTPBearer(auto_error=False)

# Email Configuration
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USER = os.environ.get('EMAIL_USER', '')
EMAIL_PASS = os.environ.get('EMAIL_PASS', '')

# MongoDB connection with proper error handling and timeouts
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

try:
    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        socketTimeoutMS=10000
    )
    db = client[db_name]
    logger.info(f"✅ MongoDB client initialized for database: {db_name}")
except Exception as e:
    logger.error(f"❌ MongoDB connection error: {e}")
    raise

# Create the main app
app = FastAPI(title="Document Generator API")

# Create API router
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    created_at: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    role: Optional[str] = "user"

class ToggleUserRequest(BaseModel):
    is_active: bool

class DocumentGenerateRequest(BaseModel):
    """Request model for document generation"""
    template: str = Field(..., description="Template name (e.g., 'nike', 'apple')")
    recipient_email: EmailStr = Field(..., description="Recipient email address")
    full_name: Optional[str] = Field("", description="Full name for WHOLE_NAME")
    first_name: Optional[str] = Field(None, description="First name for FIRSTNAME")
    address1: Optional[str] = Field(None, description="Address line 1")
    address2: Optional[str] = Field(None, description="Address line 2")
    address3: Optional[str] = Field(None, description="Address line 3 (city, zip)")
    delivery_date: Optional[str] = Field(None, description="Estimated delivery date")
    order_number: Optional[str] = Field("", description="Order number")
    item_name: Optional[str] = Field(None, description="Product name")
    size: Optional[str] = Field(None, description="Product size")
    price: Optional[str] = Field(None, description="Item price")
    total: Optional[str] = Field(None, description="Total amount")
    card_last4: Optional[str] = Field(None, description="Last 4 digits of card")
    currency: Optional[str] = Field("$", description="Currency symbol")
    subject: Optional[str] = Field(None, description="Email subject")
    product_image: Optional[str] = Field(None, description="Product image URL")
    quantity: Optional[str] = Field("1", description="Quantity")
    tracking_number: Optional[str] = Field(None, description="Tracking number")
    phone: Optional[str] = Field(None, description="Phone number")
    notes: Optional[str] = Field(None, description="Additional notes")
    shipping: Optional[str] = Field("Free Shipping", description="Shipping info")
    color: Optional[str] = Field(None, description="Product color")
    additional_data: Optional[Dict[str, Any]] = Field(None, description="Additional placeholder replacements")

class DocumentResponse(BaseModel):
    success: bool
    document_id: str
    message: str
    email_sent: bool

# ==================== EMAIL FUNCTIONS ====================

async def send_html_email(recipient_email: str, subject: str, html_content: str) -> bool:
    """
    Send HTML email using SMTP (Gmail)
    
    Args:
        recipient_email: Recipient's email address
        subject: Email subject
        html_content: HTML content to send
    
    Returns:
        bool: True if sent successfully, False otherwise
    """
    try:
        if not EMAIL_USER or not EMAIL_PASS:
            logger.error("❌ Email credentials not configured")
            raise ValueError("Email credentials not configured in environment variables")
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = EMAIL_USER
        message["To"] = recipient_email
        
        # Attach HTML content
        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)
        
        # Send email via SMTP
        logger.info(f"📧 Sending email to {recipient_email}...")
        await aiosmtplib.send(
            message,
            hostname=EMAIL_HOST,
            port=EMAIL_PORT,
            start_tls=True,
            username=EMAIL_USER,
            password=EMAIL_PASS,
            timeout=30
        )
        
        logger.info(f"✅ Email sent successfully to {recipient_email}")
        return True
        
    except aiosmtplib.SMTPException as e:
        logger.error(f"❌ SMTP error sending email: {e}")
        raise HTTPException(status_code=500, detail=f"SMTP error: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Error sending email: {e}")
        raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")

# ==================== DOCUMENT GENERATION ====================

def generate_html_from_template(template_name: str, data: Dict[str, Any]) -> str:
    """
    Load HTML template and replace placeholders with actual data
    
    Args:
        template_name: Name of the template (without .html extension)
        data: Dictionary with placeholder replacements
    
    Returns:
        str: HTML content with replaced placeholders
    """
    try:
        # Load template file
        template_path = ROOT_DIR / "templates" / f"{template_name}.html"
        
        if not template_path.exists():
            logger.error(f"❌ Template not found: {template_path}")
            raise FileNotFoundError(f"Template '{template_name}' not found")
        
        logger.info(f"📄 Loading template: {template_path}")
        with open(template_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Replace all placeholders
        for placeholder, value in data.items():
            if value is not None:
                # Replace all occurrences of the placeholder
                html_content = html_content.replace(placeholder, str(value))
        
        logger.info(f"✅ Template processed: {len(html_content)} characters")
        return html_content
        
    except FileNotFoundError as e:
        logger.error(f"❌ Template file error: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error generating HTML: {e}")
        raise HTTPException(status_code=500, detail=f"Template processing failed: {str(e)}")

# ==================== HELPER FUNCTIONS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"❌ Password verification error: {e}")
        return False

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Verify user is admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# ==================== API ENDPOINTS ====================

@app.get("/")
async def root_health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Document Generator Backend is running",
        "api": "/api/",
        "mongodb": "connected" if client else "disconnected",
        "email_configured": bool(EMAIL_USER and EMAIL_PASS)
    }

@api_router.get("/")
async def api_root():
    """API root endpoint"""
    return {
        "message": "Document Generator API",
        "version": "1.0.0",
        "endpoints": {
            "generate_document": "POST /api/generate-document",
            "list_documents": "GET /api/documents",
            "list_templates": "GET /api/templates"
        }
    }

@api_router.get("/templates")
async def list_templates():
    """List available HTML templates"""
    try:
        templates_dir = ROOT_DIR / "templates"
        if not templates_dir.exists():
            return {"templates": []}
        
        templates = [f.stem for f in templates_dir.glob("*.html")]
        return {
            "templates": templates,
            "count": len(templates)
        }
    except Exception as e:
        logger.error(f"❌ Error listing templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/generate-document", response_model=DocumentResponse)
async def generate_and_send_document(request: DocumentGenerateRequest):
    """
    Generate HTML document from template and send via email
    
    This endpoint:
    1. Loads the specified HTML template
    2. Replaces placeholders with provided data
    3. Saves document info to MongoDB
    4. Sends HTML email to recipient
    5. Updates MongoDB with email status
    """
    try:
        logger.info(f"📝 Starting document generation for template: {request.template}")
        
        # Calculate values
        item_name = request.item_name or 'Your Item'
        price = request.price or '0.00'
        total = request.total or request.price or '0.00'
        size = request.size or ''
        quantity = request.quantity or '1'
        currency = request.currency or '$'
        date_str = request.delivery_date or datetime.now().strftime('%B %d, %Y')
        
        # Prepare comprehensive placeholder replacements (all variants)
        replacements = {
            # Name variants
            'WHOLE_NAME': request.full_name,
            'FIRSTNAME': request.first_name or (request.full_name.split()[0] if request.full_name else ''),
            
            # Address variants (1-5)
            'ADDRESS1': request.address1 or '',
            'ADDRESS2': request.address2 or '',
            'ADDRESS3': request.address3 or '',
            'ADDRESS4': request.address1 or '',  # Fallback
            'ADDRESS5': request.address2 or '',  # Fallback
            
            # Date variants
            'DATE': date_str,
            'DELIVERY': date_str,
            
            # Order number variants
            'ORDER_NUM': request.order_number,
            'ORDER_NUMBER': request.order_number,
            'ORDERNUMBER': request.order_number,
            
            # Product name variants
            'ITEM_NAME': item_name,
            'PRODUCT_NAME': item_name,
            
            # Size
            'SIZE': size,
            
            # Price variants
            'PRICE': f"{currency}{price}",
            'PRODUCT_PRICE': f"{currency}{price}",
            'PRODUCT_SUBTOTAL': f"{currency}{price}",
            
            # Total
            'TOTAL': f"{currency}{total}",
            
            # Quantity variants
            'QUANTITY': quantity,
            'QTY': quantity,
            'PRODUCT_QTY': quantity,
            
            # Card
            'CARD_END': request.card_last4 or '****',
            
            # Currency
            'CURRENCY': currency,
            
            # Image
            'PRODUCT_IMAGE': request.product_image or 'https://via.placeholder.com/280x280?text=Product',
            
            # Shipping
            'SHIPPING': request.shipping or 'Free Shipping',
            
            # Color
            'PRODUCT_COLOUR': request.color or '',
            
            # Tracking
            'TRACKING_NUMBER': request.tracking_number or '',
            
            # Contact
            'PHONE': request.phone or '',
            'EMAIL': request.recipient_email,
            
            # Notes
            'NOTES': request.notes or ''
        }
        
        # Add any additional custom replacements
        if request.additional_data:
            replacements.update(request.additional_data)
        
        # Generate HTML from template
        html_content = generate_html_from_template(request.template, replacements)
        
        # Generate document ID
        doc_id = str(uuid.uuid4())
        
        # Save document metadata to MongoDB
        try:
            document = {
                "id": doc_id,
                "template": request.template,
                "recipient_email": request.recipient_email,
                "order_number": request.order_number,
                "full_name": request.full_name,
                "created_at": datetime.utcnow().isoformat(),
                "email_sent": False,
                "email_sent_at": None
            }
            
            await db.documents.insert_one(document)
            logger.info(f"✅ Document saved to MongoDB with ID: {doc_id}")
            
        except Exception as e:
            logger.error(f"❌ MongoDB save error: {e}")
            # Continue even if DB save fails - we can still send email
        
        # Send email
        email_subject = request.subject or f"Your Order {request.order_number}"
        
        try:
            await send_html_email(
                recipient_email=request.recipient_email,
                subject=email_subject,
                html_content=html_content
            )
            
            # Update MongoDB - mark email as sent
            try:
                await db.documents.update_one(
                    {"id": doc_id},
                    {"$set": {
                        "email_sent": True,
                        "email_sent_at": datetime.utcnow().isoformat()
                    }}
                )
                logger.info(f"✅ Document {doc_id} marked as sent in MongoDB")
            except Exception as e:
                logger.error(f"❌ MongoDB update error: {e}")
            
            return DocumentResponse(
                success=True,
                document_id=doc_id,
                message=f"Document generated and sent to {request.recipient_email}",
                email_sent=True
            )
            
        except Exception as e:
            logger.error(f"❌ Email sending failed: {e}")
            
            # Update MongoDB - mark email as failed
            try:
                await db.documents.update_one(
                    {"id": doc_id},
                    {"$set": {
                        "email_sent": False,
                        "email_error": str(e),
                        "email_attempted_at": datetime.utcnow().isoformat()
                    }}
                )
            except Exception as db_error:
                logger.error(f"❌ MongoDB update error: {db_error}")
            
            raise HTTPException(
                status_code=500,
                detail=f"Document generated but email failed: {str(e)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Document generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document generation failed: {str(e)}")

@api_router.get("/documents")
async def list_documents(limit: int = 100, skip: int = 0):
    """List all generated documents from MongoDB"""
    try:
        documents = await db.documents.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return {
            "documents": documents,
            "count": len(documents),
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"❌ Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get specific document by ID"""
    try:
        document = await db.documents.find_one({"id": document_id}, {"_id": 0})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== LEGACY ENDPOINTS ====================

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    """Legacy status check endpoint"""
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    try:
        await db.status_checks.insert_one(doc)
    except Exception as e:
        logger.error(f"❌ Status check save error: {e}")
    
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    """Legacy get status checks endpoint"""
    try:
        status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
        
        for check in status_checks:
            if isinstance(check['timestamp'], str):
                check['timestamp'] = datetime.fromisoformat(check['timestamp'])
        
        return status_checks
    except Exception as e:
        logger.error(f"❌ Error fetching status checks: {e}")
        return []

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    """Get all users (Admin only)"""
    try:
        users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
        return {"users": users, "count": len(users)}
    except Exception as e:
        logger.error(f"❌ Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/users")
async def create_user_admin(user_data: CreateUserRequest, admin: dict = Depends(get_admin_user)):
    """Create new user (Admin only)"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Hash password
        hashed_password = pwd_context.hash(user_data.password)
        
        # Create user
        user_id = str(uuid.uuid4())
        new_user = {
            "id": user_id,
            "email": user_data.email,
            "username": user_data.username or user_data.email.split('@')[0],
            "hashed_password": hashed_password,
            "role": user_data.role,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
            "documents_generated": 0
        }
        
        await db.users.insert_one(new_user)
        logger.info(f"✅ User created: {user_data.email}")
        
        # Remove password from response
        new_user.pop("password")
        new_user.pop("_id", None)
        
        return {"success": True, "user": new_user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/users/{user_id}")
async def delete_user_admin(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete user (Admin only)"""
    try:
        # Don't allow admin to delete themselves
        if user_id == admin["id"]:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        result = await db.users.delete_one({"id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"✅ User deleted: {user_id}")
        return {"success": True, "message": "User deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/users/{user_id}/toggle")
async def toggle_user_active(user_id: str, data: ToggleUserRequest, admin: dict = Depends(get_admin_user)):
    """Activate/Deactivate user (Admin only)"""
    try:
        # Don't allow admin to deactivate themselves
        if user_id == admin["id"]:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
        
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {"is_active": data.is_active}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        status_text = "activated" if data.is_active else "deactivated"
        logger.info(f"✅ User {status_text}: {user_id}")
        
        return {"success": True, "message": f"User {status_text}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error toggling user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/documents")
async def get_all_documents_admin(admin: dict = Depends(get_admin_user), limit: int = 100):
    """Get all documents (Admin only)"""
    try:
        documents = await db.documents.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {"documents": documents, "count": len(documents)}
    except Exception as e:
        logger.error(f"❌ Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get system statistics (Admin only)"""
    try:
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({"is_active": True})
        total_documents = await db.documents.count_documents({})
        documents_sent = await db.documents.count_documents({"email_sent": True})
        
        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "inactive": total_users - active_users
            },
            "documents": {
                "total": total_documents,
                "sent": documents_sent,
                "failed": total_documents - documents_sent
            }
        }
    except Exception as e:
        logger.error(f"❌ Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== AUTHENTICATION ENDPOINTS ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(credentials: UserLogin):
    """Login endpoint for users"""
    try:
        logger.info(f"🔐 Login attempt for: {credentials.email}")
        user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
        logger.info(f"🔐 User found: {user is not None}")

        if not user:
            logger.warning(f"❌ User not found: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        stored_hash = user.get('hashed_password', user.get('password', ''))
        logger.info(f"🔐 Hash exists: {bool(stored_hash)}, length: {len(stored_hash) if stored_hash else 0}")
        
        is_valid = verify_password(credentials.password, stored_hash)
        logger.info(f"🔐 Password valid: {is_valid}")
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        access_token = create_access_token(
            data={"sub": user['email'], "role": user.get('role', 'user')}
        )

        user_response = UserResponse(
            id=user['id'],
            email=user['email'],
            username=user.get('username', user['email']),
            role=user.get('role', 'user'),
            created_at=user.get('created_at', datetime.utcnow().isoformat())
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

# ==================== APP CONFIGURATION ====================

# Include API router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from frontend build (for production)
FRONTEND_BUILD = Path(__file__).parent.parent / "frontend" / "build"

# Mount static files if build exists
if FRONTEND_BUILD.exists():
    static_dir = FRONTEND_BUILD / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
        logger.info(f"✅ Mounted static files from {static_dir}")

# Serve index.html for all non-API routes (SPA routing)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve React SPA - catch all non-API routes"""
    # Don't intercept API routes
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")
    
    # Try to serve specific file if exists
    if FRONTEND_BUILD.exists():
        file_path = FRONTEND_BUILD / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Serve index.html for all other routes (SPA routing)
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
    
    # Fallback if no frontend build
    return {
        "error": "Frontend not built",
        "message": "Run 'cd frontend && npm run build' to build the frontend",
        "api_docs": "/docs"
    }

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("🚀 Application starting up...")
    logger.info(f"📧 Email configured: {bool(EMAIL_USER and EMAIL_PASS)}")
    logger.info(f"🗄️  MongoDB database: {db_name}")
    
    # Test MongoDB connection
    try:
        await client.admin.command('ping')
        logger.info("✅ MongoDB connection successful")
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("🛑 Application shutting down...")
    if client:
        client.close()
        logger.info("✅ MongoDB connection closed")
