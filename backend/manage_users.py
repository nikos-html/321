#!/usr/bin/env python3
"""
Skrypt do tworzenia użytkowników w systemie DocGen
Uruchom: cd backend && python manage_users.py
"""
import asyncio
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import bcrypt
import uuid
from datetime import datetime

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def print_header():
    print("\n" + "="*60)
    print("📧 DocGen - Manager Użytkowników")
    print("="*60 + "\n")

async def connect_db():
    """Connect to MongoDB"""
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("❌ Error: MONGO_URL not found in .env")
        sys.exit(1)

    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"🔗 Connecting to MongoDB...")
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        # Test connection
        await client.admin.command('ping')
        print(f"✅ Connected to database: {db_name}\n")
        return db, client
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        sys.exit(1)

async def list_users(db):
    """List all users"""
    print("\n👥 Lista użytkowników:\n")
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    if not users:
        print("  Brak użytkowników w systemie.\n")
        return
    
    print(f"{'Email':<35} {'Nazwa':<20} {'Rola':<10} {'Status':<12} {'Utworzony'}")
    print("-" * 100)
    
    for user in users:
        status = "✅ Aktywny" if user.get('is_active', True) else "🔒 Nieaktywny"
        created = user.get('created_at', '')[:10] if user.get('created_at') else 'N/A'
        print(f"{user['email']:<35} {user.get('username', 'N/A'):<20} {user.get('role', 'user'):<10} {status:<12} {created}")
    
    print(f"\nŁącznie: {len(users)} użytkowników\n")

async def create_user(db):
    """Create new user interactively"""
    print("\n➕ Tworzenie nowego użytkownika\n")
    
    # Email
    while True:
        email = input("📧 Email: ").strip()
        if not email:
            print("❌ Email nie może być pusty")
            continue
        
        # Check if exists
        existing = await db.users.find_one({"email": email})
        if existing:
            print(f"❌ Użytkownik z emailem {email} już istnieje!")
            return
        break
    
    # Username
    username = input("👤 Nazwa użytkownika (Enter = email): ").strip()
    if not username:
        username = email.split('@')[0]
    
    # Password
    while True:
        password = input("🔑 Hasło (min. 6 znaków): ").strip()
        if len(password) < 6:
            print("❌ Hasło musi mieć min. 6 znaków")
            continue
        
        confirm = input("🔑 Potwierdź hasło: ").strip()
        if password != confirm:
            print("❌ Hasła się nie zgadzają")
            continue
        break
    
    # Role
    print("\n🛡️  Wybierz rolę:")
    print("  1. User (zwykły użytkownik)")
    print("  2. Admin (administrator)")
    
    while True:
        choice = input("\nWybór (1/2): ").strip()
        if choice == "1":
            role = "user"
            break
        elif choice == "2":
            role = "admin"
            break
        else:
            print("❌ Nieprawidłowy wybór")
    
    # Create user
    print("\n⏳ Tworzenie użytkownika...")
    
    try:
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "username": username,
            "password": hashed_password.decode('utf-8'),
            "role": role,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True,
            "documents_generated": 0
        }
        
        await db.users.insert_one(user)
        
        print("\n✅ Użytkownik utworzony pomyślnie!\n")
        print(f"📧 Email:    {email}")
        print(f"👤 Nazwa:    {username}")
        print(f"🛡️  Rola:     {role}")
        print(f"🔑 Hasło:    {password}")
        print()
        
    except Exception as e:
        print(f"\n❌ Błąd tworzenia użytkownika: {e}\n")

async def delete_user(db):
    """Delete user by email"""
    print("\n🗑️  Usuwanie użytkownika\n")
    
    email = input("📧 Email użytkownika do usunięcia: ").strip()
    if not email:
        print("❌ Email nie może być pusty")
        return
    
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"❌ Użytkownik {email} nie istnieje")
        return
    
    print(f"\n⚠️  Czy na pewno chcesz usunąć użytkownika:")
    print(f"   Email: {user['email']}")
    print(f"   Nazwa: {user.get('username', 'N/A')}")
    print(f"   Rola:  {user.get('role', 'user')}")
    
    confirm = input("\nWpisz 'TAK' aby potwierdzić: ").strip()
    
    if confirm != "TAK":
        print("❌ Anulowano")
        return
    
    try:
        await db.users.delete_one({"email": email})
        print(f"\n✅ Użytkownik {email} został usunięty\n")
    except Exception as e:
        print(f"\n❌ Błąd usuwania: {e}\n")

async def toggle_user_status(db):
    """Toggle user active status"""
    print("\n🔒 Aktywacja/Dezaktywacja użytkownika\n")
    
    email = input("📧 Email użytkownika: ").strip()
    if not email:
        print("❌ Email nie może być pusty")
        return
    
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"❌ Użytkownik {email} nie istnieje")
        return
    
    current_status = user.get('is_active', True)
    new_status = not current_status
    
    status_text = "aktywować" if new_status else "dezaktywować"
    print(f"\n⚠️  Czy na pewno chcesz {status_text} użytkownika {email}?")
    
    confirm = input("Wpisz 'TAK' aby potwierdzić: ").strip()
    
    if confirm != "TAK":
        print("❌ Anulowano")
        return
    
    try:
        await db.users.update_one(
            {"email": email},
            {"$set": {"is_active": new_status}}
        )
        status_result = "aktywowany" if new_status else "dezaktywowany"
        print(f"\n✅ Użytkownik {email} został {status_result}\n")
    except Exception as e:
        print(f"\n❌ Błąd aktualizacji: {e}\n")

async def show_stats(db):
    """Show system statistics"""
    print("\n📊 Statystyki systemu:\n")
    
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    admin_users = await db.users.count_documents({"role": "admin"})
    total_docs = await db.documents.count_documents({})
    sent_docs = await db.documents.count_documents({"email_sent": True})
    
    print(f"👥 Użytkownicy:")
    print(f"   Łącznie:     {total_users}")
    print(f"   Aktywni:     {active_users}")
    print(f"   Nieaktywni:  {total_users - active_users}")
    print(f"   Administratorzy: {admin_users}")
    
    print(f"\n📄 Dokumenty:")
    print(f"   Łącznie:     {total_docs}")
    print(f"   Wysłane:     {sent_docs}")
    print(f"   Błędy:       {total_docs - sent_docs}")
    print()

async def main_menu():
    """Main menu"""
    db, client = await connect_db()
    
    try:
        while True:
            print("\n" + "="*60)
            print("MENU GŁÓWNE")
            print("="*60)
            print("\n1. 👥 Lista użytkowników")
            print("2. ➕ Dodaj nowego użytkownika")
            print("3. 🗑️  Usuń użytkownika")
            print("4. 🔒 Aktywuj/Dezaktywuj użytkownika")
            print("5. 📊 Statystyki systemu")
            print("0. 🚪 Wyjście")
            
            choice = input("\nWybierz opcję (0-5): ").strip()
            
            if choice == "1":
                await list_users(db)
            elif choice == "2":
                await create_user(db)
            elif choice == "3":
                await delete_user(db)
            elif choice == "4":
                await toggle_user_status(db)
            elif choice == "5":
                await show_stats(db)
            elif choice == "0":
                print("\n👋 Do zobaczenia!\n")
                break
            else:
                print("\n❌ Nieprawidłowy wybór\n")
        
    finally:
        client.close()

if __name__ == "__main__":
    print_header()
    asyncio.run(main_menu())
