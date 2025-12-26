# 🚂 Railway Deployment - Instrukcja konfiguracji

## ✅ Pliki konfiguracyjne (już utworzone)

1. **nixpacks.toml** - główna konfiguracja buildu
2. **Procfile** - alternatywny start command
3. **railway.json** - Railway-specific config
4. **.nixpacks** - alternatywny format konfiguracji

## 🔧 Co zostało naprawione:

### Problem:
- ❌ Nixpacks instalował tylko Node.js
- ❌ Brak Pythona i pip
- ❌ Backend nie używał zmiennej $PORT

### Rozwiązanie:
- ✅ nixpacks.toml instaluje: Node.js 20 + Python 3.11 + pip
- ✅ Poprawna kolejność buildu (frontend → backend)
- ✅ Backend uruchamia się na porcie $PORT z Railway
- ✅ Uvicorn binduje się na 0.0.0.0:$PORT

## 📋 Konfiguracja w Railway Dashboard

### 1. Zmienne środowiskowe (Variables)

W Railway Dashboard → Project → Variables, dodaj:

```bash
# MongoDB (WYMAGANE)
MONGO_URL=mongodb+srv://your-user:password@cluster.mongodb.net/
DB_NAME=your_database_name

# CORS (opcjonalne)
CORS_ORIGINS=https://your-frontend-domain.railway.app,https://your-custom-domain.com

# Port (automatycznie ustawiony przez Railway)
PORT=<automatically-set-by-railway>
```

**UWAGA**: Railway automatycznie ustawia zmienną `PORT`, nie musisz jej dodawać ręcznie!

### 2. Build & Deploy Settings

Railway powinien automatycznie wykryć konfigurację z `nixpacks.toml`:

- **Builder**: Nixpacks (domyślnie)
- **Build Command**: Automatycznie z nixpacks.toml
- **Start Command**: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
- **Watch Paths**: Pozostaw domyślne

### 3. Root Directory

- **Root Directory**: Pozostaw puste (root projektu = `/app`)

## 🔍 Weryfikacja konfiguracji

### Sprawdź czy nixpacks.toml działa:

```bash
# Lokalnie (jeśli masz nixpacks):
nixpacks build . --name myapp
```

### Struktura projektu powinna wyglądać tak:

```
/app/
├── nixpacks.toml       ← Konfiguracja Nixpacks
├── railway.json        ← Railway-specific config  
├── Procfile           ← Alternatywny start
├── .nixpacks          ← JSON format (backup)
├── backend/
│   ├── server.py
│   └── requirements.txt
└── frontend/
    ├── package.json
    └── src/
```

## 🚀 Deploy Process (co się dzieje):

1. **Setup Phase**: Instaluje Node.js 20, Python 3.11, pip
2. **Install Phase**: 
   - `npm install` w `/frontend`
   - `pip install -r requirements.txt` w `/backend`
3. **Build Phase**: 
   - `npm run build` w `/frontend` (tworzy production build)
4. **Start Phase**: 
   - Uruchamia `uvicorn` na porcie $PORT (z Railway)

## ⚠️ Możliwe problemy i rozwiązania

### Problem 1: "pip: command not found"
**Rozwiązanie**: Upewnij się, że `nixpacks.toml` jest w root projektu i zawiera `python311Packages.pip`

### Problem 2: Build timeout
**Rozwiązanie**: W Railway Settings → Deploy, zwiększ "Build Timeout"

### Problem 3: Port binding error
**Rozwiązanie**: Backend MUSI używać zmiennej `$PORT` z Railway (już naprawione w nixpacks.toml)

### Problem 4: MONGO_URL not found
**Rozwiązanie**: Dodaj zmienną `MONGO_URL` w Railway Variables

### Problem 5: Frontend nie łączy się z backendem
**Rozwiązanie**: 
- Sprawdź czy frontend używa poprawnego URL backendu
- Railway generuje unikalny URL dla każdego deployu

## 📝 Checklist przed deployem

- [ ] Pliki `nixpacks.toml`, `railway.json` są w root projektu
- [ ] Zmienna `MONGO_URL` ustawiona w Railway Variables
- [ ] Zmienna `DB_NAME` ustawiona w Railway Variables
- [ ] (Opcjonalnie) `CORS_ORIGINS` skonfigurowany
- [ ] Kod jest w repozytorium GitHub
- [ ] Railway połączony z repozytorium

## 🎯 Expected Result

Po poprawnym deploymencie:
- ✅ Build przechodzi bez błędów
- ✅ Backend odpowiada na `https://your-app.railway.app/api/`
- ✅ Endpoint `/api/status` działa
- ✅ Brak błędów "pip: command not found"

## 📞 Jeśli nadal nie działa:

1. Sprawdź logi Railway: Dashboard → Deployments → View Logs
2. Sprawdź czy wszystkie zmienne są ustawione
3. Upewnij się, że `nixpacks.toml` jest committowany do repo
4. Spróbuj "Redeploy" w Railway

---

**Podsumowanie zmian**:
- ✅ Utworzono `nixpacks.toml` z multi-language support (Node.js + Python)
- ✅ Backend używa zmiennej $PORT z Railway
- ✅ Poprawna kolejność buildu (frontend build → backend install → start)
- ✅ Wszystkie dependencies instalowane poprawnie
