from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import uuid
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="DocGen - Generator Dokumentów")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Email configuration from .env
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# Data models
class DocumentRequest(BaseModel):
    name: str
    email: EmailStr
    order_number: str
    date: str
    amount: float
    additional_info: Optional[str] = ""
    template: Optional[str] = "receipt"

class DocumentResponse(BaseModel):
    success: bool
    message: str
    document_id: str
    html_content: str
    email_sent: bool

# Email templates
RECEIPT_TEMPLATE = """
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Potwierdzenie Zamówienia</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .header p {
            opacity: 0.9;
            font-size: 14px;
        }
        .checkmark {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
        }
        .content {
            padding: 40px 30px;
        }
        .order-details {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6c757d;
            font-size: 14px;
        }
        .detail-value {
            font-weight: 600;
            color: #212529;
        }
        .amount-row {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            text-align: center;
        }
        .amount-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .amount-value {
            font-size: 32px;
            font-weight: 700;
            margin-top: 5px;
        }
        .additional-info {
            background: #e8f4fd;
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            border-radius: 0 8px 8px 0;
            margin-top: 20px;
        }
        .additional-info h4 {
            color: #667eea;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .additional-info p {
            color: #495057;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer {
            background: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            color: #6c757d;
            font-size: 12px;
            line-height: 1.6;
        }
        .doc-id {
            font-family: monospace;
            background: #e9ecef;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            color: #495057;
            margin-top: 10px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="checkmark">✓</div>
            <h1>Potwierdzenie Zamówienia</h1>
            <p>Dziękujemy za Twoje zamówienie!</p>
        </div>
        <div class="content">
            <div class="order-details">
                <div class="detail-row">
                    <span class="detail-label">Imię / Nazwa</span>
                    <span class="detail-value">{{name}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Numer zamówienia</span>
                    <span class="detail-value">#{{order_number}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Data</span>
                    <span class="detail-value">{{date}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">{{email}}</span>
                </div>
            </div>
            
            <div class="amount-row">
                <div class="amount-label">Kwota do zapłaty</div>
                <div class="amount-value">{{amount}} PLN</div>
            </div>
            
            {{additional_info_section}}
        </div>
        <div class="footer">
            <p>Ten dokument został wygenerowany automatycznie.<br>Prosimy o zachowanie go do celów rozliczeniowych.</p>
            <span class="doc-id">ID: {{document_id}}</span>
        </div>
    </div>
</body>
</html>
"""

INVOICE_TEMPLATE = """
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faktura</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 35px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -1px;
        }
        .invoice-badge {
            background: rgba(255,255,255,0.15);
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .content {
            padding: 40px 30px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 35px;
        }
        .info-box h3 {
            color: #6c757d;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .info-box p {
            color: #212529;
            font-size: 15px;
            line-height: 1.6;
        }
        .table-container {
            background: #f8f9fa;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 30px;
        }
        .table-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            background: #1a1a2e;
            color: white;
            padding: 15px 20px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .table-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            padding: 18px 20px;
            border-bottom: 1px solid #e9ecef;
            align-items: center;
        }
        .table-row:last-child {
            border-bottom: none;
        }
        .item-name {
            font-weight: 500;
            color: #212529;
        }
        .item-desc {
            font-size: 12px;
            color: #6c757d;
            margin-top: 4px;
        }
        .total-section {
            display: flex;
            justify-content: flex-end;
        }
        .total-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px 35px;
            border-radius: 12px;
            text-align: right;
        }
        .total-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .total-amount {
            font-size: 36px;
            font-weight: 700;
            margin-top: 5px;
        }
        .footer {
            background: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            color: #6c757d;
            font-size: 12px;
        }
        .doc-id {
            font-family: monospace;
            background: #e9ecef;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            color: #495057;
            margin-top: 10px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">DocGen</div>
            <div class="invoice-badge">Faktura</div>
        </div>
        <div class="content">
            <div class="info-grid">
                <div class="info-box">
                    <h3>Wystawiona dla</h3>
                    <p><strong>{{name}}</strong><br>{{email}}</p>
                </div>
                <div class="info-box">
                    <h3>Szczegóły dokumentu</h3>
                    <p>Nr: #{{order_number}}<br>Data: {{date}}</p>
                </div>
            </div>
            
            <div class="table-container">
                <div class="table-header">
                    <span>Opis</span>
                    <span>Ilość</span>
                    <span style="text-align: right;">Kwota</span>
                </div>
                <div class="table-row">
                    <div>
                        <div class="item-name">Usługa / Produkt</div>
                        <div class="item-desc">{{additional_info_text}}</div>
                    </div>
                    <div>1</div>
                    <div style="text-align: right; font-weight: 600;">{{amount}} PLN</div>
                </div>
            </div>
            
            <div class="total-section">
                <div class="total-box">
                    <div class="total-label">Suma do zapłaty</div>
                    <div class="total-amount">{{amount}} PLN</div>
                </div>
            </div>
        </div>
        <div class="footer">
            <p>Dziękujemy za zaufanie! Ten dokument został wygenerowany automatycznie.</p>
            <span class="doc-id">ID: {{document_id}}</span>
        </div>
    </div>
</body>
</html>
"""

CONFIRMATION_TEMPLATE = """
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Potwierdzenie</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            box-shadow: 0 25px 80px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 50px 30px;
            text-align: center;
        }
        .success-icon {
            width: 100px;
            height: 100px;
            background: rgba(255,255,255,0.25);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
            font-size: 50px;
        }
        .header h1 {
            font-size: 26px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 15px;
        }
        .content {
            padding: 40px 30px;
        }
        .info-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 16px;
            padding: 30px;
        }
        .info-item {
            display: flex;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .info-icon {
            width: 44px;
            height: 44px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            margin-right: 18px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .info-text {
            flex: 1;
        }
        .info-label {
            color: #6c757d;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            color: #212529;
            font-size: 16px;
            font-weight: 600;
            margin-top: 3px;
        }
        .amount-highlight {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            margin-top: 25px;
        }
        .amount-highlight .label {
            font-size: 13px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .amount-highlight .value {
            font-size: 42px;
            font-weight: 700;
            margin-top: 8px;
        }
        .notes {
            background: #fff3cd;
            border-radius: 12px;
            padding: 20px;
            margin-top: 25px;
            display: flex;
            align-items: flex-start;
        }
        .notes-icon {
            font-size: 24px;
            margin-right: 15px;
        }
        .notes-text {
            flex: 1;
        }
        .notes-text h4 {
            color: #856404;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .notes-text p {
            color: #856404;
            font-size: 13px;
            line-height: 1.5;
        }
        .footer {
            background: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
        }
        .footer p {
            color: #6c757d;
            font-size: 12px;
        }
        .doc-id {
            font-family: monospace;
            background: #e9ecef;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 11px;
            color: #495057;
            margin-top: 12px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✓</div>
            <h1>Potwierdzenie operacji</h1>
            <p>Twoja transakcja została zarejestrowana</p>
        </div>
        <div class="content">
            <div class="info-card">
                <div class="info-item">
                    <div class="info-icon">👤</div>
                    <div class="info-text">
                        <div class="info-label">Imię / Nazwa</div>
                        <div class="info-value">{{name}}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">📧</div>
                    <div class="info-text">
                        <div class="info-label">Adres e-mail</div>
                        <div class="info-value">{{email}}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">🔢</div>
                    <div class="info-text">
                        <div class="info-label">Numer referencyjny</div>
                        <div class="info-value">#{{order_number}}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">📅</div>
                    <div class="info-text">
                        <div class="info-label">Data</div>
                        <div class="info-value">{{date}}</div>
                    </div>
                </div>
            </div>
            
            <div class="amount-highlight">
                <div class="label">Kwota</div>
                <div class="value">{{amount}} PLN</div>
            </div>
            
            {{additional_info_section}}
        </div>
        <div class="footer">
            <p>Ten dokument służy jako oficjalne potwierdzenie.<br>Prosimy o zachowanie go do własnych celów.</p>
            <span class="doc-id">ID dokumentu: {{document_id}}</span>
        </div>
    </div>
</body>
</html>
"""

TEMPLATES = {
    "receipt": RECEIPT_TEMPLATE,
    "invoice": INVOICE_TEMPLATE,
    "confirmation": CONFIRMATION_TEMPLATE
}

ADDITIONAL_INFO_SECTION_RECEIPT = """
<div class="additional-info">
    <h4>📝 Dodatkowe informacje</h4>
    <p>{{additional_info}}</p>
</div>
"""

ADDITIONAL_INFO_SECTION_CONFIRMATION = """
<div class="notes">
    <div class="notes-icon">📝</div>
    <div class="notes-text">
        <h4>Dodatkowe informacje</h4>
        <p>{{additional_info}}</p>
    </div>
</div>
"""

def render_template(template_str: str, data: dict, template_type: str) -> str:
    """Simple template rendering"""
    html = template_str
    
    # Handle additional info section
    if data.get("additional_info"):
        if template_type == "confirmation":
            section = ADDITIONAL_INFO_SECTION_CONFIRMATION.replace("{{additional_info}}", data["additional_info"])
        else:
            section = ADDITIONAL_INFO_SECTION_RECEIPT.replace("{{additional_info}}", data["additional_info"])
        html = html.replace("{{additional_info_section}}", section)
        html = html.replace("{{additional_info_text}}", data["additional_info"])
    else:
        html = html.replace("{{additional_info_section}}", "")
        html = html.replace("{{additional_info_text}}", "Brak opisu")
    
    # Replace simple variables
    for key, value in data.items():
        html = html.replace("{{" + key + "}}", str(value) if value else "")
    
    return html

def send_email(to_email: str, subject: str, html_content: str):
    """Send email via Gmail SMTP"""
    if not EMAIL_USER or not EMAIL_PASS:
        raise HTTPException(status_code=500, detail="Email credentials not configured")
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"DocGen <{EMAIL_USER}>"
        msg["To"] = to_email
        
        # Attach HTML content
        html_part = MIMEText(html_content, "html", "utf-8")
        msg.attach(html_part)
        
        # Connect to Gmail SMTP server
        context = ssl.create_default_context()
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls(context=context)
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        
        return True
    except Exception as e:
        print(f"Email error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "DocGen API",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/templates")
async def get_templates():
    """Get available document templates"""
    return {
        "templates": [
            {"id": "receipt", "name": "Potwierdzenie zamówienia", "description": "Eleganckie potwierdzenie z gradientem"},
            {"id": "invoice", "name": "Faktura", "description": "Profesjonalny szablon faktury"},
            {"id": "confirmation", "name": "Potwierdzenie operacji", "description": "Zielone potwierdzenie sukcesu"}
        ]
    }

@app.post("/api/generate", response_model=DocumentResponse)
async def generate_document(request: DocumentRequest):
    """Generate document and send via email"""
    
    # Generate unique document ID
    document_id = str(uuid.uuid4())[:12].upper()
    
    # Get template
    template = TEMPLATES.get(request.template, RECEIPT_TEMPLATE)
    
    # Prepare data for template
    template_data = {
        "name": request.name,
        "email": request.email,
        "order_number": request.order_number,
        "date": request.date,
        "amount": f"{request.amount:,.2f}".replace(",", " "),
        "additional_info": request.additional_info,
        "document_id": document_id
    }
    
    # Render HTML
    html_content = render_template(template, template_data, request.template)
    
    # Send email
    email_sent = False
    try:
        subject = f"DocGen - Dokument #{request.order_number}"
        send_email(request.email, subject, html_content)
        email_sent = True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
    
    return DocumentResponse(
        success=True,
        message="Dokument został wygenerowany" + (" i wysłany na email!" if email_sent else ". Wysyłka email nie powiodła się."),
        document_id=document_id,
        html_content=html_content,
        email_sent=email_sent
    )

@app.post("/api/preview")
async def preview_document(request: DocumentRequest):
    """Generate document preview without sending email"""
    
    document_id = "PREVIEW-" + str(uuid.uuid4())[:8].upper()
    template = TEMPLATES.get(request.template, RECEIPT_TEMPLATE)
    
    template_data = {
        "name": request.name,
        "email": request.email,
        "order_number": request.order_number,
        "date": request.date,
        "amount": f"{request.amount:,.2f}".replace(",", " "),
        "additional_info": request.additional_info,
        "document_id": document_id
    }
    
    html_content = render_template(template, template_data, request.template)
    
    return {
        "success": True,
        "html_content": html_content,
        "document_id": document_id
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
