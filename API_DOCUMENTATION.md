# 📧 Document Generator & Email Sender API

## ✅ STATUS: WSZYSTKO DZIAŁA!

Backend FastAPI z funkcjonalnością generowania dokumentów HTML z szablonów i wysyłki przez e-mail.

---

## 🎯 FIXED ISSUES (Naprawione błędy)

### 1. ✅ Railway Deployment - NAPRAWIONE
**Problem:** Build failure z powodu błędnego root directory
**Rozwiązanie:** Poprawiony `nixpacks.toml` z właściwą konfiguracją

### 2. ✅ Wysyłka E-mail - ZAIMPLEMENTOWANE  
**Problem:** Brak kodu wysyłki e-mail
**Rozwiązanie:** Pełna implementacja SMTP Gmail z `aiosmtplib`

### 3. ✅ Generowanie HTML - ZAIMPLEMENTOWANE
**Problem:** Brak wypełniania placeholders w szablonach
**Rozwiązanie:** Funkcja `generate_html_from_template()` z automatyczną zamianą placeholders

### 4. ✅ MongoDB Timeouts - NAPRAWIONE
**Problem:** Brak timeouts powodujący zawieszenia
**Rozwiązanie:** Dodane timeouts: serverSelection=5s, connect=10s, socket=10s

### 5. ✅ Error Handling - NAPRAWIONE
**Problem:** Brak obsługi błędów async/await
**Rozwiązanie:** Try/catch we wszystkich async funkcjach + proper logging

---

## 🚀 API ENDPOINTS

### Health Check
```bash
GET /
```
Response:
```json
{
  "status": "ok",
  "message": "Document Generator Backend is running",
  "mongodb": "connected",
  "email_configured": true
}
```

### List Templates
```bash
GET /api/templates
```
Response:
```json
{
  "templates": ["nike", "apple", "balenciaga", "supreme", "zalando"],
  "count": 5
}
```

### Generate & Send Document (GŁÓWNY ENDPOINT)
```bash
POST /api/generate-document
```

**Request Body:**
```json
{
  "template": "nike",
  "recipient_email": "client@example.com",
  "full_name": "Jan Kowalski",
  "first_name": "Jan",
  "address1": "ul. Testowa 123",
  "address2": "Mieszkanie 45",
  "address3": "00-001 Warszawa, Polska",
  "delivery_date": "January 15, 2026",
  "order_number": "NK-2026-12345",
  "item_name": "Nike Air Max 2026",
  "price": "$180.00",
  "total": "$190.46",
  "card_last4": "1234",
  "currency": "$",
  "subject": "Your Nike Order NK-2026-12345"
}
```

**Response:**
```json
{
  "success": true,
  "document_id": "728628dc-fd51-47fd-a300-17c4e4a510ff",
  "message": "Document generated and sent to client@example.com",
  "email_sent": true
}
```

### List Documents
```bash
GET /api/documents?limit=100&skip=0
```

### Get Specific Document
```bash
GET /api/documents/{document_id}
```

---

## 📝 PLACEHOLDERS W SZABLONACH

Wszystkie szablony HTML wspierają następujące placeholders:

| Placeholder | Opis | Przykład |
|------------|------|----------|
| `WHOLE_NAME` | Pełne imię i nazwisko | "Jan Kowalski" |
| `FIRSTNAME` | Imię | "Jan" |
| `ADDRESS1` | Adres linia 1 | "ul. Testowa 123" |
| `ADDRESS2` | Adres linia 2 | "Mieszkanie 45" |
| `ADDRESS3` | Miasto, kod | "00-001 Warszawa" |
| `DATE` | Data dostawy | "January 15, 2026" |
| `ORDER_NUM` | Numer zamówienia | "NK-2026-12345" |
| `ITEM_NAME` | Nazwa produktu | "Nike Air Max 2026" |
| `PRICE` | Cena | "$180.00" |
| `TOTAL` | Suma | "$190.46" |
| `CARD_END` | Końcówka karty | "1234" |
| `CURRENCY` | Waluta | "$" |

---

## 🔧 KONFIGURACJA RAILWAY

### Zmienne środowiskowe (już ustawione):
```env
# MongoDB
MONGO_URL="${{MongoDB.MONGO_URL}}"
DB_NAME="MongoDB"

# Email (SMTP Gmail)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="doxyii00@gmail.com"
EMAIL_PASS="xwxg kpee dgnq ihes"

# Security
JWT_SECRET_KEY="dx6vfx58qh0zssxoh2t4fvy00qrblmz6"
CORS_ORIGINS="*"
```

### Railway Service Settings:
- **Root Directory**: `/` (root projektu)
- **Build Command**: (puste - `nixpacks.toml` obsługuje)
- **Start Command**: `cd backend && . venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port $PORT`

---

## 📦 ZALEŻNOŚCI

### Backend (Python)
```
fastapi==0.110.1
uvicorn==0.25.0
motor==3.3.1              # MongoDB async driver
aiosmtplib>=3.0.0         # SMTP async
pymongo==4.5.0
pydantic>=2.6.4
python-dotenv>=1.0.1
bcrypt==4.1.3
pyjwt>=2.10.1
python-jose>=3.3.0
```

---

## 🧪 TESTOWANIE

### Test lokalny (curl):
```bash
curl -X POST http://localhost:8001/api/generate-document \
  -H "Content-Type: application/json" \
  -d '{
    "template": "nike",
    "recipient_email": "twoj-email@example.com",
    "full_name": "Jan Kowalski",
    "order_number": "TEST-123",
    "price": "$100",
    "total": "$110"
  }'
```

### Test na Railway:
```bash
curl -X POST https://twoja-domena.railway.app/api/generate-document \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## 📊 MONGODB COLLECTIONS

### `documents` Collection:
```json
{
  "id": "uuid",
  "template": "nike",
  "recipient_email": "client@example.com",
  "order_number": "NK-123",
  "full_name": "Jan Kowalski",
  "created_at": "2026-01-02T20:03:14",
  "email_sent": true,
  "email_sent_at": "2026-01-02T20:03:15"
}
```

---

## 🐛 DEBUGGING

### Sprawdź logi backendu:
```bash
tail -f /var/log/supervisor/backend.out.log
```

### Sprawdź status serwisu:
```bash
sudo supervisorctl status backend
```

### Restart backendu:
```bash
sudo supervisorctl restart backend
```

### Test połączenia MongoDB:
```bash
curl http://localhost:8001/ | jq .mongodb
```

### Test konfiguracji email:
```bash
curl http://localhost:8001/ | jq .email_configured
```

---

## 🎉 WSZYSTKO DZIAŁA!

✅ Backend uruchomiony  
✅ MongoDB połączony  
✅ Email SMTP skonfigurowany (Gmail)  
✅ Szablony HTML załadowane (5 templates)  
✅ API endpoints działają  
✅ Generowanie dokumentów - OK  
✅ Wysyłka e-mail - OK  
✅ Zapis do MongoDB - OK  

---

## 📞 SUPPORT

W razie problemów sprawdź:
1. Logi Railway Dashboard
2. Zmienne środowiskowe (czy wszystkie są ustawione)
3. MongoDB connection string (czy MongoDB jest uruchomiony)
4. Email credentials (czy hasło aplikacji Gmail jest poprawne)

---

## 🔐 SECURITY NOTES

⚠️ **UWAGA**: 
- Hasło email w `.env` to hasło aplikacji Gmail (App Password)
- NIE używaj normalnego hasła do Gmail
- Na produkcji rozważ użycie SendGrid, Resend lub AWS SES
