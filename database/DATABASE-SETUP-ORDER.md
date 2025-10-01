# Complete Database Setup Guide

## Overview
You need to apply database schemas IN ORDER for the fisherman profile system to work.

## Setup Order

### Step 1: Create Database (if not exists)
```sql
CREATE DATABASE fishing_competition;
```

### Step 2: Apply Base Competition Schema
```bash
psql -U postgres -d fishing_competition -f "database/schema.sql"
```

**This creates:**
- ✅ competitions table
- ✅ sectors table
- ✅ participants table
- ✅ weigh_ins table

### Step 3: Apply Authentication Schema
```bash
psql -U postgres -d fishing_competition -f "database/auth_schema.sql"
```

**This creates:**
- ✅ users table (with basic fields)
- ✅ password_reset_tokens table
- ✅ user_sessions table

### Step 4: Apply Profile Fields (REQUIRED FOR PHOTO UPLOAD)
```bash
psql -U postgres -d fishing_competition -f "database/add-profile-fields.sql"
```

**This adds to users table:**
- ✅ street_address
- ✅ city
- ✅ postal_code
- ✅ country
- ✅ photo_url
- ✅ profile_completed

### Step 5: Apply Registration Schema
```bash
psql -U postgres -d fishing_competition -f "database/user-profile-registration-schema.sql"
```

**This creates:**
- ✅ competition_registrations table
- ✅ Links users to competitions

### Step 6 (Optional): Add Competition Fields
```bash
psql -U postgres -d fishing_competition -f "database/add-competition-fields.sql"
```

**This adds extended competition info**

---

## Quick All-in-One Script

Run all migrations in order:

```bash
# Navigate to project root
cd "C:\Users\imres\BACKUP\FISHING COMPETITION"

# Apply all schemas
psql -U postgres -d fishing_competition -f database/schema.sql
psql -U postgres -d fishing_competition -f database/auth_schema.sql
psql -U postgres -d fishing_competition -f database/add-profile-fields.sql
psql -U postgres -d fishing_competition -f database/user-profile-registration-schema.sql
psql -U postgres -d fishing_competition -f database/add-competition-fields.sql
```

---

## Your Current Issue: Missing Profile Fields

Based on your error, you're missing **Step 4**.

### Quick Fix - Run This Now:

```bash
psql -U postgres -d fishing_competition -f "database/add-profile-fields.sql"
```

### Or Copy-Paste This SQL:

```sql
-- Add profile fields for fishermen
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Hungary';
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

UPDATE users SET profile_completed = false WHERE profile_completed IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
```

---

## Verify Database Structure

Check if everything is set up:

```sql
-- Check users table has all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Expected columns in users table:**
1. id
2. first_name
3. last_name
4. email
5. password_hash
6. role
7. is_active
8. email_verified
9. created_at
10. updated_at
11. **phone** (from earlier)
12. **street_address** ← NEW
13. **city** ← NEW
14. **postal_code** ← NEW
15. **country** ← NEW
16. **photo_url** ← NEW (needed for photo upload!)
17. **profile_completed** ← NEW

---

## What Each Schema Does

| Schema File | Purpose | Required For |
|-------------|---------|--------------|
| `schema.sql` | Competition basics | All competition features |
| `auth_schema.sql` | User authentication | Login/Register |
| `add-profile-fields.sql` | **Fisherman profiles** | **Photo upload, Address** |
| `user-profile-registration-schema.sql` | Competition signup | Registration system |
| `add-competition-fields.sql` | Extended comp info | Competition details |

---

## After Applying the Fix

1. ✅ Run the profile fields migration
2. ✅ Restart your backend server
3. ✅ Clear browser cache
4. ✅ Try uploading a photo again

**It will work!** 🎉

---

## Still Getting Errors?

Tell me:
1. ✅ Have you applied `auth_schema.sql`?
2. ✅ Have you applied `add-profile-fields.sql`?
3. What error message do you see?

The 404 error will disappear once the database has the `photo_url` column!

