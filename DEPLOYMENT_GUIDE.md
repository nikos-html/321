# 🚂 Railway Deployment - Quick Fix Guide

## ✅ Wszystko naprawione!

### 📦 Co zostało dodane:

1. **nixpacks.toml** - Multi-language configuration (Node.js + Python)
2. **railway.json** - Railway-specific deploy config
3. **Procfile** - Backup start command
4. **RAILWAY_SETUP.md** - Pełna dokumentacja

---

## 🎯 QUICK START - Deployment w 3 krokach:

### Krok 1: Push do GitHub
```bash
git add nixpacks.toml railway.json Procfile RAILWAY_SETUP.md
git commit -m "fix: Railway deployment configuration with Nixpacks"
git push origin main
```

### Krok 2: Ustaw zmienne w Railway
W Railway Dashboard → Variables, dodaj:

```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
DB_NAME=your_database_name
CORS_ORIGINS=* 
```
*(Railway automatycznie doda PORT)*

### Krok 3: Deploy!
Railway automatycznie zrobi redeploy po push lub kliknij "Deploy" ręcznie.

---

## 📋 Wyjaśnienie zmian

### ❌ Przed (NIE DZIAŁAŁO):
```
Error: pip: command not found
Reason: Nixpacks instalował tylko Node.js
```

### ✅ Po (DZIAŁA):

**nixpacks.toml instaluje**:
- ✅ Node.js 20
- ✅ Python 3.11  
- ✅ pip

**Proces buildu**:
1. **Setup**: Instalacja Node.js + Python + pip
2. **Install**: `npm install` + `pip install -r requirements.txt`
3. **Build**: `npm run build` (frontend)
4. **Start**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

---

## 🔍 Jak to działa:

### nixpacks.toml (główny plik):
```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'python311', 'python311Packages.pip']
# ↑ Instaluje wszystkie potrzebne języki

[phases.install]
cmds = [
    'cd frontend && npm install',           # Frontend deps
    'cd backend && pip install -r requirements.txt'  # Backend deps
]

[phases.build]
cmds = ['cd frontend && npm run build']     # Production build

[start]
cmd = 'cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT'
# ↑ Używa $PORT z Railway (KRYTYCZNE!)
```

---

## ⚠️ WAŻNE:

### Backend NIE MOŻE używać hardcoded portu!
❌ **ŹLE**: `uvicorn server:app --port 8001`  
✅ **DOBRZE**: `uvicorn server:app --port $PORT`

Railway dynamicznie przypisuje port przez zmienną `$PORT`.

---

## 🧪 Test lokalny (opcjonalny):

Jeśli masz zainstalowane `nixpacks`:
```bash
nixpacks build . --name test-app
docker run -p 8080:8080 -e PORT=8080 test-app
```

---

## 📊 Checklist Railway Variables:

- [ ] `MONGO_URL` - **WYMAGANE**
- [ ] `DB_NAME` - **WYMAGANE**
- [ ] `CORS_ORIGINS` - Opcjonalne (default: `*`)
- [ ] `PORT` - Automatycznie ustawione przez Railway

---

## 🎉 Expected Result:

Po deploymencie:
```
✅ Build successful
✅ Backend running on https://your-app.railway.app
✅ API endpoint: https://your-app.railway.app/api/
✅ Health check: https://your-app.railway.app/api/ → {"message": "Hello World"}
```

---

## 🐛 Troubleshooting:

### Build nadal failuje?
1. Sprawdź logi: Railway Dashboard → Deployments → Logs
2. Upewnij się że `nixpacks.toml` jest w root (obok `backend/` i `frontend/`)
3. Sprawdź czy Railway ma dostęp do repo

### Runtime error?
1. Sprawdź czy `MONGO_URL` jest poprawny
2. Sprawdź czy backend uruchamia się: Railway Logs → Filter "uvicorn"
3. Test endpoint: `curl https://your-app.railway.app/api/`

---

## 📝 Co NIE zostało zmienione:

✅ Kod aplikacji (frontend/backend) - **bez zmian**  
✅ Dependencies (package.json, requirements.txt) - **bez zmian**  
✅ Logika biznesowa - **bez zmian**  

**TYLKO deployment configuration został naprawiony!**

---

Gotowe do deployu! 🚀
