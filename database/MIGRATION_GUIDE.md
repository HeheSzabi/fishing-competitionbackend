# Database Migration Guide

## Overview
This guide will help you migrate your working Supabase database to support all the new features from your current project.

## Prerequisites
- ✅ Working Supabase project
- ✅ Access to Supabase SQL Editor
- ✅ Current database has basic tables: competitions, sectors, participants, weigh_ins

## Migration Steps

### Step 1: Backup Your Current Database
```sql
-- In Supabase SQL Editor, run this to see your current schema
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;
```

### Step 2: Run the Migration Script
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the entire `SUPABASE_MIGRATION.sql` script
4. Click "Run" to execute the migration

### Step 3: Verify the Migration
After running the migration, verify these tables exist:
- ✅ `users` - User authentication
- ✅ `password_reset_tokens` - Password reset
- ✅ `user_sessions` - Session management
- ✅ `competition_registrations` - User registrations
- ✅ Enhanced `competitions` table with new fields
- ✅ Enhanced `users` table with profile fields

### Step 4: Test the Migration
```sql
-- Test 1: Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 2: Check new columns in competitions
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'competitions' 
AND column_name IN ('location', 'organizer', 'cover_image');

-- Test 3: Check new columns in users
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('phone', 'photo_url', 'profile_completed');
```

## What This Migration Adds

### 🆕 New Tables:
1. **`users`** - Complete user authentication system
2. **`password_reset_tokens`** - Password reset functionality
3. **`user_sessions`** - Session management
4. **`competition_registrations`** - User competition registration

### 🔄 Enhanced Tables:
1. **`competitions`** - Added location, organizer, contact, entry_fee, prizes, schedule, rules, cover_image
2. **`users`** - Added phone, address fields, photo_url, profile_completed
3. **`participants`** - Added user_id and registration_id links

### 📊 New Features:
- ✅ User registration and authentication
- ✅ Profile management with photos
- ✅ Competition registration system
- ✅ Enhanced competition details
- ✅ Cover image support
- ✅ Email notification system support

## Next Steps After Migration

1. **Update Environment Variables** - Add new database connection details
2. **Deploy Updated Backend** - Add new API routes for authentication
3. **Update Frontend** - Deploy new Angular components
4. **Configure File Storage** - Set up image upload handling
5. **Test Everything** - Verify all new features work

## Rollback Plan (If Needed)

If something goes wrong, you can:
1. Check Supabase logs for errors
2. Drop specific tables if needed:
   ```sql
   DROP TABLE IF EXISTS competition_registrations;
   DROP TABLE IF EXISTS user_sessions;
   DROP TABLE IF EXISTS password_reset_tokens;
   DROP TABLE IF EXISTS users;
   ```
3. Remove added columns:
   ```sql
   ALTER TABLE competitions DROP COLUMN IF EXISTS location;
   ALTER TABLE competitions DROP COLUMN IF EXISTS organizer;
   -- etc.
   ```

## Support

If you encounter any issues:
1. Check the Supabase logs
2. Verify all tables were created
3. Test with simple queries first
4. Contact support if needed

---

**Ready to proceed?** Run the migration script in your Supabase SQL Editor!
