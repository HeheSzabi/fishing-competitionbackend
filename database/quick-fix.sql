-- Quick Fix: Add ALL Required Columns
-- Run this if you're getting 500 errors

-- First, ensure the users table exists
-- (This should already exist from auth_schema.sql)

-- Add phone column if not exists (from earlier)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Hungary';

-- Add photo field (THIS IS CRITICAL FOR PHOTO UPLOAD)
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- Add profile completion tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Update existing users
UPDATE users SET profile_completed = false WHERE profile_completed IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);

-- Verify it worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

