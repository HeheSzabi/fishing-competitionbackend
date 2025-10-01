# Apply Fisherman Profile Database Schema

## The Problem
You're getting 404 errors because the database doesn't have the columns for:
- Address fields (street_address, city, postal_code, country)
- Photo URL (photo_url)
- Profile completion tracking (profile_completed)

## Solution: Apply the Database Migration

### Option 1: Using psql Command Line

Open PowerShell or Command Prompt and run:

```bash
psql -U postgres -d fishing_competition -f "database/add-profile-fields.sql"
```

**If you're using a different username:**
```bash
psql -U your_username -d fishing_competition -f "database/add-profile-fields.sql"
```

### Option 2: Using pgAdmin (GUI)

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on `fishing_competition` database
4. Select **Query Tool**
5. Open the file: `database/add-profile-fields.sql`
6. Click **Execute** (F5)

### Option 3: Copy-Paste SQL

If you prefer, open your database tool and run this SQL:

```sql
-- Add profile fields for fishermen
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Hungary';
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Update existing users
UPDATE users SET profile_completed = false WHERE profile_completed IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
```

## Verify It Worked

After running the SQL, verify with:

```sql
-- Check the users table structure
\d users

-- Or in standard SQL:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

You should see these NEW columns:
- ✅ street_address
- ✅ city
- ✅ postal_code
- ✅ country
- ✅ photo_url
- ✅ profile_completed

## What This Does

This migration adds the following to your `users` table:

### Address Information
- `street_address` - Street and house number
- `city` - City name  
- `postal_code` - Postal/ZIP code
- `country` - Country (defaults to 'Hungary')

### Profile Photo
- `photo_url` - Path to uploaded profile picture

### Tracking
- `profile_completed` - Boolean flag to track if profile is filled

## After Applying

Once the database is updated:
1. Restart your backend server (if it's running)
2. Try the profile completion page again
3. Photo upload should now work! ✅

## Troubleshooting

**Error: "relation 'users' does not exist"**
- You need to run `auth_schema.sql` first to create the users table

**Error: "database 'fishing_competition' does not exist"**
- Create the database first: `CREATE DATABASE fishing_competition;`

**Error: "password authentication failed"**
- Check your PostgreSQL username and password

## Need Help?

If you're stuck, tell me:
1. What database tool are you using? (pgAdmin, psql, other)
2. What error message you're seeing
3. Your PostgreSQL version

---

**Once this is applied, your photo upload will work!** 🎉

