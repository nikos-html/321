# 🔧 PRZEWODNIK: Zarządzanie Użytkownikami

## 📋 Masz 2 sposoby zarządzania użytkownikami:

### **SPOSÓB 1: Panel Administratora (Web UI)** 🌐
**Najłatwiejszy - dla codziennego użytku**

1. Zaloguj się jako admin na stronie
2. Kliknij przycisk **"🔧 Panel Admina"**
3. Zarządzaj użytkownikami przez przeglądarkę

**Możliwości:**
- ✅ Dodawanie użytkowników
- ✅ Usuwanie użytkowników
- ✅ Aktywacja/Dezaktywacja kont
- ✅ Podgląd historii dokumentów
- ✅ Statystyki systemu

---

### **SPOSÓB 2: Skrypt Python (Konsola)** 💻
**Dla zaawansowanych - dostęp przez terminal**

## 🚀 JAK URUCHOMIĆ SKRYPT:

### **Lokalnie:**
```bash
cd /app/backend
python manage_users.py
```

### **Na Railway:**
```bash
# Połącz się przez Railway CLI
railway run python backend/manage_users.py
```

---

## 📖 MENU SKRYPTU:

Po uruchomieniu zobaczysz:

```
============================================================
📧 DocGen - Manager Użytkowników
============================================================

🔗 Connecting to MongoDB...
✅ Connected to database: MongoDB

============================================================
MENU GŁÓWNE
============================================================

1. 👥 Lista użytkowników
2. ➕ Dodaj nowego użytkownika
3. 🗑️  Usuń użytkownika
4. 🔒 Aktywuj/Dezaktywuj użytkownika
5. 📊 Statystyki systemu
0. 🚪 Wyjście

Wybierz opcję (0-5):
```

---

## 📝 PRZYKŁADY UŻYCIA:

### **1. Lista użytkowników (opcja 1)**
```
👥 Lista użytkowników:

Email                               Nazwa                Rola       Status       Utworzony
----------------------------------------------------------------------------------------------------
mambadoxyi@gmail.com                Admin                admin      ✅ Aktywny   2026-01-02

Łącznie: 1 użytkowników
```

---

### **2. Dodaj użytkownika (opcja 2)**
```
➕ Tworzenie nowego użytkownika

📧 Email: jan.kowalski@example.com
👤 Nazwa użytkownika (Enter = email): Jan Kowalski
🔑 Hasło (min. 6 znaków): mojehaslo123
🔑 Potwierdź hasło: mojehaslo123

🛡️  Wybierz rolę:
  1. User (zwykły użytkownik)
  2. Admin (administrator)

Wybór (1/2): 1

⏳ Tworzenie użytkownika...

✅ Użytkownik utworzony pomyślnie!

📧 Email:    jan.kowalski@example.com
👤 Nazwa:    Jan Kowalski
🛡️  Rola:     user
🔑 Hasło:    mojehaslo123
```

---

### **3. Usuń użytkownika (opcja 3)**
```
🗑️  Usuwanie użytkownika

📧 Email użytkownika do usunięcia: jan.kowalski@example.com

⚠️  Czy na pewno chcesz usunąć użytkownika:
   Email: jan.kowalski@example.com
   Nazwa: Jan Kowalski
   Rola:  user

Wpisz 'TAK' aby potwierdzić: TAK

✅ Użytkownik jan.kowalski@example.com został usunięty
```

---

### **4. Aktywuj/Dezaktywuj (opcja 4)**
```
🔒 Aktywacja/Dezaktywacja użytkownika

📧 Email użytkownika: jan.kowalski@example.com

⚠️  Czy na pewno chcesz dezaktywować użytkownika jan.kowalski@example.com?
Wpisz 'TAK' aby potwierdzić: TAK

✅ Użytkownik jan.kowalski@example.com został dezaktywowany
```

---

### **5. Statystyki (opcja 5)**
```
📊 Statystyki systemu:

👥 Użytkownicy:
   Łącznie:     5
   Aktywni:     4
   Nieaktywni:  1
   Administratorzy: 2

📄 Dokumenty:
   Łącznie:     125
   Wysłane:     120
   Błędy:       5
```

---

## 🔑 ISTNIEJĄCE KONTO ADMINA:

```
📧 Email:    mambadoxyi@gmail.com
🔑 Hasło:    Pterodaktyl2012
👤 Nazwa:    Admin
🛡️  Rola:     admin
```

**To konto zostało już utworzone i możesz się nim zalogować!**

---

## 🆘 SZYBKI START - Tworzenie pierwszego użytkownika:

```bash
# 1. Wejdź do folderu backend
cd /app/backend

# 2. Uruchom skrypt
python manage_users.py

# 3. Wybierz opcję 2 (Dodaj użytkownika)

# 4. Wypełnij dane:
📧 Email: twoj@email.com
👤 Nazwa: Twoje Imię
🔑 Hasło: twoje_haslo
🛡️  Rola: 1 (user) lub 2 (admin)

# 5. Gotowe! Teraz możesz się zalogować
```

---

## 💡 WSKAZÓWKI:

### **Kiedy używać Panelu Web:**
- ✅ Szybkie dodanie użytkownika
- ✅ Podgląd wszystkich użytkowników
- ✅ Sprawdzenie statystyk
- ✅ Codzienna praca

### **Kiedy używać Skryptu Python:**
- ✅ Pierwszy setup (brak admina)
- ✅ Masowe operacje
- ✅ Automatyzacja (skrypty)
- ✅ Troubleshooting / debugging
- ✅ Praca na serwerze Railway bez dostępu do strony

---

## ⚠️ WAŻNE:

1. **Skrypt wymaga połączenia z MongoDB** - upewnij się że `.env` jest poprawny
2. **Hasła są hashowane** - nie można ich odzyskać, tylko zresetować
3. **Nie usuwaj ostatniego admina** - stracisz dostęp do panelu
4. **Na Railway** skrypt działa tak samo jak lokalnie

---

## 🐛 TROUBLESHOOTING:

**Problem: "MONGO_URL not found"**
```bash
# Sprawdź czy .env istnieje
ls -la /app/backend/.env

# Sprawdź zawartość
cat /app/backend/.env | grep MONGO_URL
```

**Problem: "Connection refused"**
```bash
# Sprawdź czy MongoDB działa
sudo systemctl status mongod

# Lub na Railway - sprawdź service w dashboard
```

**Problem: "User already exists"**
```bash
# Sprawdź listę użytkowników (opcja 1)
# Lub użyj innego emaila
```

---

## 📞 POTRZEBUJESZ POMOCY?

**Sprawdź co jest w bazie:**
```bash
python manage_users.py
# Wybierz opcję 1 (Lista użytkowników)
```

**Zresetuj hasło użytkownika:**
```bash
# 1. Usuń użytkownika (opcja 3)
# 2. Utwórz go ponownie z nowym hasłem (opcja 2)
```

---

**Gotowe! Masz teraz pełną kontrolę nad użytkownikami!** 🎉
