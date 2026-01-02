# 🔴 FIX: "Could not import module main" ERROR

## PROBLEM
Railway próbuje uruchomić `main.py` zamiast `server.py`

## ✅ ROZWIĄZANIE - 3 PLIKI DODANE:

### 1. `/app/Procfile`
```
web: bash start.sh
```

### 2. `/app/start.sh`
Script który:
- Sprawdza czy venv istnieje
- Tworzy venv jeśli nie istnieje
- Aktywuje venv
- Uruchamia `uvicorn server:app`

### 3. `/app/railway.json`
```json
{
  "deploy": {
    "startCommand": "bash start.sh"
  }
}
```

---

## 🚀 CO ZROBIĆ TERAZ:

### 1. Push do GitHub:
```bash
git add Procfile start.sh railway.json
git commit -m "fix: Railway start command - use server.py not main.py"
git push origin main
```

### 2. W Railway Dashboard (OPCJONALNIE):
Jeśli nadal nie działa, ustaw manualnie:
- **Settings** → **Deploy** → **Start Command**: `bash start.sh`

### 3. Sprawdź deployment logs:
Powinieneś zobaczyć:
```
🔍 Checking backend directory...
✅ venv directory found
🚀 Starting uvicorn...
```

---

## 📋 PRIORITY ORDER Railway używa:

1. **railway.json** `startCommand` ← Najwyższy priorytet
2. **Procfile** `web:`
3. **nixpacks.toml** `[start] cmd`
4. Auto-detection (default)

Dodaliśmy wszystkie 3, więc Railway MUSI użyć naszego command.

---

## 🐛 DEBUGGING

Jeśli nadal pokazuje błąd, sprawdź w Railway logs:

```bash
# Szukaj tych linii:
🔍 Checking backend directory...
🔍 Checking if venv exists...
🔍 Python location:
🔍 Installed packages:
```

To powie nam dokładnie co się dzieje podczas startu.

---

## ✅ PO NAPRAWIE

Backend powinien startować z:
```
INFO:     Started server process
INFO:     Waiting for application startup.
✅ MongoDB client initialized for database: MongoDB
✅ MongoDB connection successful
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```
