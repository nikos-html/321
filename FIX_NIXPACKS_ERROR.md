# 🔧 Naprawa błędu: externally-managed-environment

## ❌ Problem z pierwszej wersji:

```
error: externally-managed-environment
This command has been disabled as it tries to modify the immutable `/nix/store` filesystem.
Build Failed: process "cd backend && pip install -r requirements.txt" did not complete successfully: exit code: 1
```

**Przyczyna**: Nixpacks blokuje bezpośrednie `pip install` do Nix store (immutable filesystem).

---

## ✅ Rozwiązanie: Python Virtual Environment

### Co zostało zmienione:

#### 1. **nixpacks.toml** - dodano virtualenv:

```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'python311', 'python311Packages.pip', 'python311Packages.virtualenv']
# ↑ Dodano virtualenv

[phases.install]
cmds = [
    'cd frontend && npm install',
    'cd backend && python -m venv venv',                              # ← NOWE: Tworzy venv
    'cd backend && . venv/bin/activate && pip install --upgrade pip', # ← NOWE: Aktywuje venv
    'cd backend && . venv/bin/activate && pip install -r requirements.txt'  # ← NOWE: Instaluje w venv
]

[phases.build]
cmds = ['cd frontend && npm run build']

[start]
cmd = 'cd backend && . venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port $PORT'
# ↑ Aktywuje venv przed startem
```

**Dlaczego to działa:**
- ✅ Virtual environment instaluje packages poza Nix store
- ✅ Używa lokalnego directory `/app/backend/venv/`
- ✅ Kompatybilne z Nixpacks immutable filesystem

---

## 🚀 Co musisz zrobić:

### Krok 1: Push zaktualizowanych plików
```bash
git add nixpacks.toml railway.json Procfile
git commit -m "fix: use Python venv to avoid Nix store conflicts"
git push origin main
```

### Krok 2: Redeploy na Railway
Railway automatycznie wykryje zmiany i zrobi nowy build.

---

## 📋 Zmienione pliki:

1. **nixpacks.toml** 
   - Dodano `python311Packages.virtualenv`
   - Install phase tworzy venv przed pip install
   - Start command aktywuje venv

2. **railway.json**
   - Zaktualizowano buildCommand z venv
   - Zaktualizowano startCommand z venv

3. **Procfile**
   - Zaktualizowano start command z venv

---

## ✅ Expected Result:

Po push i redeploy:
```
✅ Setup: Node.js 20 + Python 3.11 + pip + virtualenv
✅ Install: npm install (frontend)
✅ Install: python -m venv venv (backend)
✅ Install: pip install -r requirements.txt (w venv)
✅ Build: npm run build (frontend)
✅ Start: uvicorn z aktywowanym venv
```

---

## 🧪 Test lokalny (opcjonalnie):

Jeśli chcesz przetestować lokalnie:
```bash
cd /app/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8080
```

---

## 📊 Przed vs Po:

| Aspekt | ❌ Przed | ✅ Po |
|--------|----------|-------|
| pip install | Bezpośrednio do Nix store | W virtualenv |
| Error | externally-managed-environment | Brak błędu |
| Packages location | `/nix/store/` (blocked) | `/app/backend/venv/` (allowed) |
| Start command | `uvicorn server:app` | `. venv/bin/activate && uvicorn` |

---

## ⚠️ WAŻNE:

- Folder `venv/` nie powinien być w git (jest w .gitignore)
- Railway tworzy venv przy każdym buildzie (świeże środowisko)
- Aktywacja venv jest wymagana w start command

---

Teraz deployment powinien działać! 🎉
