# 🚂 RAILWAY - KONFIGURACJA 2 SERWISÓW

## 📋 ARCHITEKTURA:

```
Railway Project
├── Service 1: Backend API (Python/FastAPI)
│   └── Root Directory: backend
│   └── Port: 8001
│   └── URL: https://backend-xxx.railway.app
│
└── Service 2: Frontend (React)
    └── Root Directory: frontend
    └── Port: 3000
    └── URL: https://frontend-xxx.railway.app
```

---

## 🔧 KROK PO KROKU - SETUP NA RAILWAY:

### **KROK 1: Stwórz Service dla Backendu**

1. **W Railway Dashboard** → Twój Projekt
2. Kliknij **"+ New Service"**
3. Wybierz **"GitHub Repo"**
4. Wybierz swoje repo `nikos-html/321`
5. Nazwij service: **"backend"** lub **"API"**

**Konfiguracja Backend Service:**
- **Root Directory**: `backend` ← WAŻNE!
- **Build Command**: (zostaw puste - nixpacks obsłuży)
- **Start Command**: `. venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port $PORT`

**Zmienne środowiskowe Backend:**
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

---

### **KROK 2: Stwórz Service dla Frontendu**

1. **W Railway Dashboard** → Twój Projekt
2. Kliknij **"+ New Service"**
3. Wybierz **"GitHub Repo"**
4. Wybierz to samo repo `nikos-html/321`
5. Nazwij service: **"frontend"**

**Konfiguracja Frontend Service:**
- **Root Directory**: `frontend` ← WAŻNE!
- **Build Command**: `npm run build`
- **Start Command**: `npx serve -s build -l $PORT`

**Zmienne środowiskowe Frontend:**
```env
REACT_APP_BACKEND_URL="https://TWOJ-BACKEND-URL.railway.app"
```

⚠️ **WAŻNE:** Zamień `TWOJ-BACKEND-URL` na prawdziwy URL backendu!

---

### **KROK 3: Połącz Frontend z Backendem**

Po stworzeniu obu serwisów:

1. Wejdź w **Backend Service**
2. Skopiuj jego **Public URL** (np. `https://backend-xxx.railway.app`)
3. Wejdź w **Frontend Service**
4. Idź do **Variables**
5. Dodaj/Edytuj zmienną:
   ```
   REACT_APP_BACKEND_URL=https://backend-xxx.railway.app
   ```
6. Save i redeploy

---

## 📁 STRUKTURA PLIKÓW (JUŻ GOTOWA):

### **Backend (root: backend/):**
```
backend/
├── nixpacks.toml       ← Konfiguracja Railway
├── Procfile            ← Alternatywna konfiguracja
├── server.py           ← FastAPI app
├── requirements.txt    ← Python dependencies
├── .env                ← Local env (nie w git)
└── templates/          ← 15 szablonów HTML
```

### **Frontend (root: frontend/):**
```
frontend/
├── nixpacks.toml       ← Konfiguracja Railway
├── Procfile            ← Alternatywna konfiguracja
├── package.json        ← Node dependencies (+ serve)
├── src/
│   ├── App.js          ← Main component
│   └── AdminPanel.js   ← Admin panel
└── .env                ← Local env (nie w git)
```

---

## ✅ CHECKLIST DEPLOYMENT:

### **Backend Service:**
- [ ] Root Directory = `backend`
- [ ] Wszystkie zmienne env ustawione (MONGO_URL, EMAIL, JWT)
- [ ] MongoDB service połączony
- [ ] Build przechodzi bez błędów
- [ ] Test: `curl https://backend-url.railway.app/` → zwraca JSON

### **Frontend Service:**
- [ ] Root Directory = `frontend`
- [ ] REACT_APP_BACKEND_URL ustawiony na URL backendu
- [ ] Build przechodzi (npm run build)
- [ ] Test: Otwórz `https://frontend-url.railway.app/` → widać stronę logowania

---

## 🧪 TESTOWANIE:

### **1. Test Backendu:**
```bash
# Health check
curl https://twoj-backend.railway.app/

# Powinno zwrócić:
{
  "status": "ok",
  "mongodb": "connected",
  "email_configured": true
}

# Lista szablonów
curl https://twoj-backend.railway.app/api/templates

# Powinno zwrócić 15 szablonów
```

### **2. Test Frontendu:**
```
1. Otwórz https://twoj-frontend.railway.app/
2. Powinieneś zobaczyć stronę logowania
3. Zaloguj się: mambadoxyi@gmail.com / Pterodaktyl2012
4. Powinieneś zobaczyć panel użytkownika
```

---

## 🔗 CORS & POŁĄCZENIE:

Backend ma już CORS skonfigurowany (`CORS_ORIGINS="*"`), więc frontend może łączyć się z dowolnego URL.

**Przepływ:**
```
User → Frontend (railway.app/frontend)
         ↓
    (API calls)
         ↓
      Backend (railway.app/backend) → MongoDB
         ↓
    (sends email)
         ↓
      SMTP Gmail
```

---

## 🚨 TROUBLESHOOTING:

### **Problem: Backend nie startuje**
```bash
# Sprawdź logi w Railway Dashboard
# Typowe problemy:
- Brak MONGO_URL
- Błędne hasło MongoDB
- Port zajęty (Railway powinien ustawić automatycznie)
```

### **Problem: Frontend nie łączy się z Backendem**
```bash
# Sprawdź:
1. Czy REACT_APP_BACKEND_URL jest poprawny
2. Czy backend działa (test curl)
3. Czy CORS jest włączony na backendzie (już jest)
```

### **Problem: "cd frontend: No such file"**
```
✅ To jest OK teraz!
- Backend service ma root: backend (nie potrzebuje frontend/)
- Frontend service ma root: frontend (nie potrzebuje backend/)
```

---

## 🎯 PRZYKŁADOWE URLS:

Po deployment będziesz miał:

```
Backend:  https://docgen-backend-production.railway.app
Frontend: https://docgen-frontend-production.railway.app

(nazwy mogą się różnić)
```

**Użytkownicy wchodzą na Frontend URL**, a frontend łączy się z Backend URL przez API calls.

---

## 💡 PORADY:

1. **Custom Domains:** Możesz dodać własne domeny w Railway
   - Frontend: `app.twoja-domena.pl`
   - Backend: `api.twoja-domena.pl`

2. **Environment Variables:** Zawsze używaj Railway Variables, nie commituj `.env` do git

3. **Monitoring:** Railway pokazuje logi, CPU, RAM dla każdego service osobno

4. **Scaling:** Możesz skalować backend i frontend niezależnie

---

## 📝 KOMENDY GIT:

```bash
# Push wszystkich zmian
git add .
git commit -m "feat: osobne konfiguracje dla backend i frontend services"
git push origin main

# Railway automatycznie wykryje zmiany i zrobi redeploy obu serwisów
```

---

## ✅ GOTOWE!

Masz teraz:
- ✅ Backend service z API (FastAPI + MongoDB + Email)
- ✅ Frontend service z UI (React + Logowanie + Admin Panel)
- ✅ Osobne konfiguracje dla każdego
- ✅ Wszystkie pliki przygotowane
- ✅ 15 szablonów email
- ✅ Pełny system zarządzania użytkownikami

**Stwórz 2 serwisy na Railway zgodnie z powyższymi krokami!**
