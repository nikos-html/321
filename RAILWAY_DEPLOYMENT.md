# 🚂 RAILWAY DEPLOYMENT GUIDE

## ✅ WSZYSTKIE BŁĘDY NAPRAWIONE!

---

## 🔴 GŁÓWNE PROBLEMY (ROZWIĄZANE)

### Problem #1: Build Failure ❌ → ✅ FIXED
**Błąd:**
```
[dbg] root directory set as 'frontend/public'
[inf] /bin/bash: line 1: cd: frontend: No such file or directory
```

**Przyczyna:** Railway ustawiał błędny root directory

**Rozwiązanie:**
- Poprawiony `nixpacks.toml`
- Root directory na Railway musi być ustawiony na `/` (root projektu)

---

## 📋 KROKI DEPLOYMENT NA RAILWAY

### 1. **Upewnij się, że masz poprawny `nixpacks.toml`**

Plik `/app/nixpacks.toml` powinien zawierać:

```toml
# Nixpacks configuration for Railway deployment

[phases.setup]
nixPkgs = ['python311', 'nodejs-18_x', 'python311Packages.pip', 'python311Packages.virtualenv']

[phases.install]
cmds = [
    'cd frontend && npm install',
    'cd backend && python -m venv venv',
    'cd backend && . venv/bin/activate && pip install --upgrade pip',
    'cd backend && . venv/bin/activate && pip install -r requirements.txt'
]

[phases.build]
cmds = ['cd frontend && npm run build']

[start]
cmd = 'cd backend && . venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port $PORT'

[variables]
PYTHONUNBUFFERED = '1'
```

### 2. **Usuń konfliktujące pliki konfiguracyjne**

Usuń lub zmień nazwę tych plików (jeśli istnieją):
- `railway.json` → usuń lub zmień nazwę
- `railway.toml` → usuń lub zmień nazwę
- `Procfile` → usuń lub zmień nazwę

**Railway powinien używać TYLKO `nixpacks.toml`**

### 3. **Ustaw zmienne środowiskowe w Railway Dashboard**

W Railway → Twój Service → Variables → dodaj:

```env
MONGO_URL="${{MongoDB.MONGO_URL}}"
DB_NAME="MongoDB"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="doxyii00@gmail.com"
EMAIL_PASS="xwxg kpee dgnq ihes"
JWT_SECRET_KEY="dx6vfx58qh0zssxoh2t4fvy00qrblmz6"
JWT_SECRET="iv4qha6aut33816q8mxo946mzsjdj7ni"
GOOGLE_CLIENT_SECRET="w2eq00d9vtwoum1bq5xkre1y3uvx5v89"
CORS_ORIGINS="*"
```

### 4. **Konfiguracja Service w Railway Dashboard**

Idź do: **Service Settings** → **Deploy**

- **Root Directory**: `/` ← WAŻNE! (root projektu, NIE `frontend/public`)
- **Build Command**: (zostaw puste)
- **Start Command**: `cd backend && . venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port $PORT`
- **Watch Paths**: (zostaw domyślne)

### 5. **Deploy**

Po zapisaniu zmian Railway automatycznie zrobi redeploy.

Możesz też manualnie:
```bash
git add .
git commit -m "fix: Railway deployment configuration"
git push origin main
```

---

## 🧪 TESTOWANIE PO DEPLOYMENT

### 1. Sprawdź czy backend działa:
```bash
curl https://twoja-domena.railway.app/
```

Powinno zwrócić:
```json
{
  "status": "ok",
  "message": "Document Generator Backend is running",
  "mongodb": "connected",
  "email_configured": true
}
```

### 2. Sprawdź dostępne szablony:
```bash
curl https://twoja-domena.railway.app/api/templates
```

### 3. Test generowania dokumentu:
```bash
curl -X POST https://twoja-domena.railway.app/api/generate-document \
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

---

## 🔍 DEBUGGING NA RAILWAY

### Sprawdź logi deployment:
1. Railway Dashboard → Twój Service
2. Kliknij na ostatni deployment
3. Sprawdź Build Logs i Deploy Logs

### Typowe problemy i rozwiązania:

#### ❌ `cd: frontend: No such file or directory`
**Rozwiązanie:** Root Directory musi być ustawiony na `/`

#### ❌ `ModuleNotFoundError: No module named 'aiosmtplib'`
**Rozwiązanie:** Sprawdź czy `requirements.txt` zawiera `aiosmtplib>=3.0.0`

#### ❌ `pymongo.errors.ServerSelectionTimeoutError`
**Rozwiązanie:** 
- Sprawdź czy MongoDB service jest uruchomiony
- Sprawdź czy `MONGO_URL` jest poprawnie skonfigurowany

#### ❌ Email nie wysyła się
**Rozwiązanie:**
- Sprawdź czy `EMAIL_USER` i `EMAIL_PASS` są poprawne
- Upewnij się, że `EMAIL_PASS` to App Password Gmail (nie zwykłe hasło)
- Wygeneruj nowy App Password: https://myaccount.google.com/apppasswords

---

## 📊 MONITORING

### Health Check endpoint:
```bash
curl https://twoja-domena.railway.app/
```

### API Status:
```bash
curl https://twoja-domena.railway.app/api/
```

### Liczba wygenerowanych dokumentów:
```bash
curl https://twoja-domena.railway.app/api/documents
```

---

## ✅ CHECKLIST PRZED DEPLOYMENT

- [ ] `nixpacks.toml` jest poprawny
- [ ] `railway.json` i `railway.toml` są usunięte lub zmienione nazwy
- [ ] Root Directory = `/`
- [ ] Wszystkie zmienne środowiskowe są ustawione
- [ ] MongoDB service jest uruchomiony
- [ ] Email credentials są poprawne (App Password)
- [ ] `requirements.txt` zawiera wszystkie zależności
- [ ] Szablony HTML są w `/backend/templates/`

---

## 🎉 SUCCESS!

Po wykonaniu tych kroków:
- ✅ Backend buduje się poprawnie
- ✅ MongoDB jest połączony
- ✅ Email działa
- ✅ Dokumenty generują się i wysyłają

---

## 📞 POMOC

Jeśli nadal masz problemy:
1. Sprawdź logi w Railway Dashboard
2. Porównaj swoją konfigurację z tym przewodnikiem
3. Upewnij się, że WSZYSTKIE zmienne środowiskowe są ustawione
4. Sprawdź czy MongoDB service jest aktywny
