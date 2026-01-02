"""
Script to create admin user in MongoDB
Run: cd backend && python create_admin.py
"""
import asyncio
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import bcrypt
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Admin credentials
ADMIN_EMAIL = "mambadoxyi@gmail.com"
ADMIN_PASSWORD = "Pterodaktyl2012"
ADMIN_USERNAME = "Admin"

async def create_admin():
    """Create admin user in MongoDB"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ.get('MONGO_URL')
        if not mongo_url:
            print("❌ Error: MONGO_URL not found in .env")
            sys.exit(1)

        db_name = os.environ.get('DB_NAME')
        if not db_name:
            print("❌ Error: DB_NAME not found in .env")
            sys.exit(1)

        print(f"🔗 Connecting to MongoDB...")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]

        # Check if admin already exists
        existing_admin = await db.users.find_one({"email": ADMIN_EMAIL})
        if existing_admin:
            print(f"⚠️  Admin with email {ADMIN_EMAIL} already exists!")
            choice = input("Do you want to update the password? (y/n): ")
            if choice.lower() != 'y':
                print("❌ Cancelled")
                client.close()
                return

            # Update password
            hashed_password = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt())
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {
                    "password": hashed_password.decode('utf-8'),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            print(f"✅ Admin password updated successfully!")
        else:
            # Hash password
            hashed_password = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt())

            # Create admin user
            admin_user = {
                "id": str(uuid.uuid4()),
                "email": ADMIN_EMAIL,
                "username": ADMIN_USERNAME,
                "password": hashed_password.decode('utf-8'),
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }

            result = await db.users.insert_one(admin_user)
            print(f"✅ Admin user created successfully!")

        print(f"\n📧 Email: {ADMIN_EMAIL}")
        print(f"🔑 Password: {ADMIN_PASSWORD}")
        print(f"👤 Username: {ADMIN_USERNAME}")
        print(f"🛡️  Role: admin")

        # Close connection
        client.close()
        print("\n✅ Done!")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Creating admin user...")
    asyncio.run(create_admin())
