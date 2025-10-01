-- Verify Database Schema for Profile System
-- Run this to check if all required columns exist

-- Check users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Expected columns:
-- id, first_name, last_name, email, password_hash, role, is_active, 
-- email_verified, created_at, updated_at, phone, street_address, 
-- city, postal_code, country, photo_url, profile_completed

