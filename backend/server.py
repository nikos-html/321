from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import html as html_escape

load_dotenv()

from database import get_db, init_db, User, Document, SubscriptionType, UserRole
from auth import (
    get_current_user, get_admin_user, get_user_with_access, get_current_user_optional,
    create_access_token, verify_password, get_password_hash, create_user,
    verify_google_token
)

app = FastAPI(title="DocGen - Generator Dokumentów")

@app.on_event("startup")
async def startup():
    init_db()
    db = next(get_db())
    admin = db.query(User).filter(User.email == "admin@docgen.pl").first()
    if not admin:
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@docgen.pl",
            hashed_password=get_password_hash("admin123"),
            name="Administrator",
            role=UserRole.ADMIN,
            subscription_type=SubscriptionType.LIFETIME,
            created_at=datetime.utcnow()
        )
        db.add(admin)
        db.commit()
        print("✅ Default admin created: admin@docgen.pl / admin123")
    db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# ==================== TEMPLATE CONFIG ====================

TEMPLATE_CONFIG = {
    "stockx": {
        "file": "stockx_new.html",
        "name": "StockX",
        "icon": "📦",
        "fields": ["brand", "product", "size", "price", "style_id", "image_url", "date"]
    },
    "apple": {
        "file": "apple.html",
        "name": "Apple",
        "icon": "🍎",
        "fields": ["brand", "product", "price", "quantity", "image_url", "date", "shipping_address"]
    },
    "balenciaga": {
        "file": "balenciaga.html",
        "name": "Balenciaga",
        "icon": "👗",
        "fields": ["brand", "product", "size", "price", "colour", "first_name", "image_url", "date"]
    },
    "bape": {
        "file": "bape.html",
        "name": "Bape",
        "icon": "🦍",
        "fields": ["brand", "product", "size", "price", "style_id", "taxes", "currency", "image_url", "date"]
    },
    "dior": {
        "file": "dior.html",
        "name": "Dior",
        "icon": "💎",
        "fields": ["brand", "product", "size", "price", "taxes", "image_url", "date"]
    },
    "lv": {
        "file": "lv.html",
        "name": "Louis Vuitton",
        "icon": "👜",
        "fields": ["brand", "product", "size", "price", "reference", "image_url", "date"]
    },
    "moncler": {
        "file": "moncler.html",
        "name": "Moncler",
        "icon": "🧥",
        "fields": ["brand", "product", "size", "price", "colour", "estimated_delivery", "card_end", "image_url", "date"]
    },
    "nike": {
        "file": "nike.html",
        "name": "Nike",
        "icon": "👟",
        "fields": ["brand", "product", "size", "price", "currency", "card_end", "image_url", "date"]
    },
    "stussy": {
        "file": "stussy.html",
        "name": "Stussy",
        "icon": "🎨",
        "fields": ["brand", "product", "size", "price", "style_id", "taxes", "image_url", "date"]
    },
    "trapstar": {
        "file": "trapstar.html",
        "name": "Trapstar",
        "icon": "⭐",
        "fields": ["brand", "product", "size", "price", "style_id", "image_url", "date"]
    },
    "supreme": {
        "file": "supreme.html",
        "name": "Supreme",
        "icon": "🔴",
        "fields": ["brand", "product", "size", "price", "style_id", "taxes", "image_url", "date"]
    },
    "grailpoint": {
        "file": "grail_point.html",
        "name": "Grail Point",
        "icon": "🏆",
        "fields": ["brand", "product", "size", "price", "phone_number", "image_url", "date"]
    },
    "notino": {
        "file": "notino.html",
        "name": "Notino",
        "icon": "💄",
        "fields": ["brand", "product", "price", "image_url", "date"]
    },
    "mediaexpert": {
        "file": "media_expert.html",
        "name": "Media Expert",
        "icon": "📱",
        "fields": ["brand", "product", "price", "image_url", "date"]
    },
    "zalando": {
        "file": "zalando.html",
        "name": "Zalando",
        "icon": "👕",
        "fields": ["brand", "product", "size", "price", "colour", "taxes", "whole_name", "estimated_delivery", "image_url", "date"]
    }
}

# ==================== PYDANTIC MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    access_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: str
    subscription_type: str
    subscription_expires: Optional[datetime]
    has_access: bool
    days_remaining: int
    documents_generated: int
    created_at: datetime

class DocumentRequest(BaseModel):
    template: str
    email: EmailStr
    brand: str
    product: str
    price: float
    size: Optional[str] = ""
    style_id: Optional[str] = ""
    colour: Optional[str] = ""
    taxes: Optional[float] = 0
    reference: Optional[str] = ""
    first_name: Optional[str] = ""
    whole_name: Optional[str] = ""
    quantity: Optional[int] = 1
    currency: Optional[str] = "USD"
    phone_number: Optional[str] = ""
    card_end: Optional[str] = ""
    estimated_delivery: Optional[str] = ""
    image_url: str
    date: str
    # Address fields
    full_name: Optional[str] = ""
    street: Optional[str] = ""
    city: Optional[str] = ""
    postal_code: Optional[str] = ""
    country: Optional[str] = ""

class DocumentResponse(BaseModel):
    success: bool
    message: str
    document_id: str
    html_content: str
    email_sent: bool

class AdminGrantAccess(BaseModel):
    user_id: str
    subscription_type: str
    days: Optional[int] = 30

class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def esc(s):
    """Escape HTML entities"""
    return html_escape.escape(str(s) if s else "")

def read_template(filename: str) -> str:
    """Read template file"""
    template_path = os.path.join(os.path.dirname(__file__), "templates", filename)
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Template {filename} not found")

def render_template(template_html: str, data: dict) -> str:
    """Replace all placeholders in template"""
    html = template_html
    
    # Calculate totals
    price = float(data.get('price', 0))
    quantity = int(data.get('quantity', 1))
    taxes = float(data.get('taxes', 0))
    processing_fee = 5.95
    shipping = 12.95
    subtotal = price * quantity
    total = subtotal + processing_fee + shipping + taxes
    
    order_number = str(int(datetime.now().timestamp() * 1000))[-12:]
    
    brand = data.get('brand', '')
    product = data.get('product', '')
    
    # All replacements
    replacements = {
        'PRODUCT_IMAGE': data.get('image_url', ''),
        'PRODUCT_LINK': data.get('image_url', ''),
        'PRODUCT_NAME': f"{brand} {product}",
        'PRODUCTNAME': f"{brand} {product}",
        'PRODUCT_SUBTOTAL': f"${subtotal:.2f}",
        'PRODUCT_QTY': f"Qty {quantity}",
        'PRODUCT_PRICE': f"${price:.2f}",
        'PRODUCTPRICE': f"${price:.2f}",
        'PRODUCT_COLOUR': data.get('colour', ''),
        'PRODUCTSTYLE': data.get('style_id', ''),
        'PRODUCTSIZE': data.get('size', ''),
        'PRODUCT': product,
        'STYLE_ID': data.get('style_id', ''),
        'STYLE': data.get('style_id', ''),
        'SIZE': data.get('size', ''),
        'PRICE': f"${price:.2f}",
        'FEE': f"${processing_fee:.2f}",
        'SHIPPING': f"${shipping:.2f}",
        'TAXES': f"${taxes:.2f}",
        'TOTAL*': f"${total:.2f}*",
        'TOTAL': f"${total:.2f}",
        'ORDER_TOTAL': f"${total:.2f}",
        'CARTTOTAL': f"${total:.2f}",
        'DATE': data.get('date', ''),
        'ORDERDATE': data.get('date', ''),
        'TIMEDATE': data.get('date', ''),
        'ORDER_NUMBER': order_number,
        'ORDERNUMBER': order_number,
        'COLOUR': data.get('colour', ''),
        'REFERENCE': data.get('reference', ''),
        'FIRSTNAME': data.get('first_name', data.get('full_name', 'Customer')),
        'FIRST_NAME': data.get('first_name', data.get('full_name', 'Customer')),
        'WHOLE_NAME': data.get('whole_name', data.get('full_name', 'Customer')),
        'WHOLENAME': data.get('whole_name', data.get('full_name', 'Customer')),
        'EMAIL': data.get('email', ''),
        'QUANTITY': str(quantity),
        'CURRENCY_STR': data.get('currency', 'USD'),
        'CURRENCY': data.get('currency', 'USD'),
        'PHONE_NUMBER': data.get('phone_number', ''),
        'CARD_END': data.get('card_end', '****'),
        'ESTIMATED_DELIVERY': data.get('estimated_delivery', ''),
        'ADDRESS1': data.get('full_name', 'Customer'),
        'ADDRESS2': data.get('street', ''),
        'ADDRESS3': f"{data.get('city', '')}, {data.get('postal_code', '')}",
        'ADDRESS4': data.get('country', ''),
        'ADDRESS5': '',
        'BILLING1': data.get('full_name', 'Customer'),
        'BILLING2': data.get('street', ''),
        'BILLING3': f"{data.get('city', '')}, {data.get('postal_code', '')}",
        'BILLING4': data.get('country', ''),
        'BILLING5': '',
        'SHIPPING1': data.get('full_name', 'Customer'),
        'SHIPPING2': data.get('street', ''),
        'SHIPPING3': f"{data.get('city', '')}, {data.get('postal_code', '')}",
        'SHIPPING4': data.get('country', ''),
        'SHIPPING5': '',
        'SHIPPING_JAN': data.get('full_name', data.get('whole_name', 'Customer')),
        'BILLING_JAN': data.get('full_name', data.get('whole_name', 'Customer')),
        'ORDER_PRICE': f"{price:.2f} zł",
        'ORDER_LINK': data.get('image_url', ''),
        'PRODUCT_URL': data.get('image_url', ''),
        'FULL_NAME': data.get('full_name', data.get('whole_name', 'Customer')),
        'POSTAL_CODE': data.get('postal_code', ''),
        'COUNTRY': data.get('country', ''),
    }
    
    # Apply replacements (order matters - longer strings first)
    for key in sorted(replacements.keys(), key=len, reverse=True):
        html = html.replace(key, esc(replacements[key]))
    
    return html

def send_email(to_email: str, subject: str, html_content: str, from_name: str = "DocGen"):
    if not EMAIL_USER or not EMAIL_PASS:
        raise HTTPException(status_code=500, detail="Email credentials not configured")
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{EMAIL_USER}>"
        msg["To"] = to_email
        
        html_part = MIMEText(html_content, "html", "utf-8")
        msg.attach(html_part)
        
        context = ssl.create_default_context()
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls(context=context)
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        
        return True
    except Exception as e:
        print(f"Email error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value,
        subscription_type=user.subscription_type.value,
        subscription_expires=user.subscription_expires,
        has_access=user.has_access(),
        days_remaining=user.days_remaining(),
        documents_generated=user.documents_generated,
        created_at=user.created_at
    )

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = create_user(db, email=data.email, password=data.password, name=data.name)
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=user_to_response(user).dict())

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=user_to_response(user).dict())

@app.post("/api/auth/google", response_model=TokenResponse)
async def google_login(data: GoogleLogin, db: Session = Depends(get_db)):
    google_user = await verify_google_token(data.access_token)
    
    if not google_user:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    email = google_user.get("email")
    google_id = google_user.get("sub")
    name = google_user.get("name")
    
    user = db.query(User).filter((User.email == email) | (User.google_id == google_id)).first()
    
    if not user:
        user = create_user(db, email=email, name=name, google_id=google_id, is_google_user=True)
    else:
        if not user.google_id:
            user.google_id = google_id
            user.is_google_user = True
        user.last_login = datetime.utcnow()
        db.commit()
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=user_to_response(user).dict())

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return user_to_response(current_user)

# ==================== TEMPLATE ENDPOINTS ====================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "DocGen API", "timestamp": datetime.now().isoformat()}

@app.get("/api/templates")
async def get_templates():
    return {
        "templates": [
            {
                "id": key,
                "name": config["name"],
                "icon": config["icon"],
                "fields": config["fields"]
            }
            for key, config in TEMPLATE_CONFIG.items()
        ]
    }

@app.post("/api/generate", response_model=DocumentResponse)
async def generate_document(
    request: DocumentRequest,
    current_user: User = Depends(get_user_with_access),
    db: Session = Depends(get_db)
):
    if request.template not in TEMPLATE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown template: {request.template}")
    
    config = TEMPLATE_CONFIG[request.template]
    document_id = str(uuid.uuid4())[:12].upper()
    
    # Read and render template
    template_html = read_template(config["file"])
    
    data = {
        "email": request.email,
        "brand": request.brand,
        "product": request.product,
        "price": request.price,
        "size": request.size,
        "style_id": request.style_id,
        "colour": request.colour,
        "taxes": request.taxes,
        "reference": request.reference,
        "first_name": request.first_name,
        "whole_name": request.whole_name,
        "quantity": request.quantity,
        "currency": request.currency,
        "phone_number": request.phone_number,
        "card_end": request.card_end,
        "estimated_delivery": request.estimated_delivery,
        "image_url": request.image_url,
        "date": request.date,
        "full_name": request.full_name or request.whole_name or request.first_name,
        "street": request.street,
        "city": request.city,
        "postal_code": request.postal_code,
        "country": request.country,
    }
    
    html_content = render_template(template_html, data)
    
    # Send email
    email_sent = False
    try:
        subject = f"{config['name']} — {request.brand} {request.product}"
        if request.size:
            subject += f" ({request.size})"
        send_email(request.email, subject, html_content, config["name"])
        email_sent = True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
    
    # Save to DB
    doc = Document(
        id=document_id,
        user_id=current_user.id,
        template=request.template,
        name=f"{request.brand} {request.product}",
        email=request.email,
        order_number=document_id,
        date=request.date,
        amount=request.price,
        additional_info=f"Size: {request.size}" if request.size else "",
        email_sent=email_sent
    )
    db.add(doc)
    current_user.documents_generated += 1
    db.commit()
    
    return DocumentResponse(
        success=True,
        message="Document generated" + (" and sent!" if email_sent else ". Email failed."),
        document_id=document_id,
        html_content=html_content,
        email_sent=email_sent
    )

@app.post("/api/preview")
async def preview_document(
    request: DocumentRequest,
    current_user: User = Depends(get_user_with_access)
):
    if request.template not in TEMPLATE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown template: {request.template}")
    
    config = TEMPLATE_CONFIG[request.template]
    document_id = "PREVIEW-" + str(uuid.uuid4())[:8].upper()
    
    template_html = read_template(config["file"])
    
    data = {
        "email": request.email,
        "brand": request.brand,
        "product": request.product,
        "price": request.price,
        "size": request.size,
        "style_id": request.style_id,
        "colour": request.colour,
        "taxes": request.taxes,
        "reference": request.reference,
        "first_name": request.first_name,
        "whole_name": request.whole_name,
        "quantity": request.quantity,
        "currency": request.currency,
        "phone_number": request.phone_number,
        "card_end": request.card_end,
        "estimated_delivery": request.estimated_delivery,
        "image_url": request.image_url,
        "date": request.date,
        "full_name": request.full_name or request.whole_name or request.first_name,
        "street": request.street,
        "city": request.city,
        "postal_code": request.postal_code,
        "country": request.country,
    }
    
    html_content = render_template(template_html, data)
    
    return {"success": True, "html_content": html_content, "document_id": document_id}

@app.get("/api/documents")
async def get_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).limit(50).all()
    return {
        "documents": [
            {
                "id": doc.id,
                "template": doc.template,
                "name": doc.name,
                "email": doc.email,
                "amount": doc.amount,
                "created_at": doc.created_at.isoformat(),
                "email_sent": doc.email_sent
            }
            for doc in documents
        ]
    }

# ==================== ADMIN ENDPOINTS ====================

@app.get("/api/admin/users")
async def admin_get_users(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {"users": [user_to_response(u).dict() for u in users]}

@app.get("/api/admin/stats")
async def admin_get_stats(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    active_subscriptions = db.query(User).filter(
        (User.subscription_type == SubscriptionType.LIFETIME) |
        ((User.subscription_type == SubscriptionType.MONTHLY) & (User.subscription_expires > datetime.utcnow()))
    ).count()
    total_documents = db.query(Document).count()
    
    return {
        "total_users": total_users,
        "active_subscriptions": active_subscriptions,
        "total_documents": total_documents
    }

@app.post("/api/admin/grant-access")
async def admin_grant_access(data: AdminGrantAccess, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.subscription_type == "lifetime":
        user.subscription_type = SubscriptionType.LIFETIME
        user.subscription_expires = None
    elif data.subscription_type == "monthly":
        user.subscription_type = SubscriptionType.MONTHLY
        user.subscription_expires = datetime.utcnow() + timedelta(days=data.days or 30)
    else:
        raise HTTPException(status_code=400, detail="Invalid subscription type")
    
    db.commit()
    return {"success": True, "message": f"Granted {data.subscription_type} access to {user.email}"}

@app.post("/api/admin/revoke-access/{user_id}")
async def admin_revoke_access(user_id: str, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.subscription_type = SubscriptionType.NONE
    user.subscription_expires = None
    db.commit()
    return {"success": True, "message": f"Revoked access for {user.email}"}

@app.patch("/api/admin/users/{user_id}")
async def admin_update_user(user_id: str, data: AdminUserUpdate, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = UserRole.ADMIN if data.role == "admin" else UserRole.USER
    
    db.commit()
    return {"success": True, "user": user_to_response(user).dict()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
