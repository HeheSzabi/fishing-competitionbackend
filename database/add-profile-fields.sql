-- Add profile fields for fishermen
-- This adds address and photo fields to the users table

-- Add address fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Hungary';

-- Add photo field
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- Add profile completion tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Create uploads directory structure (for reference, actual creation done by backend)
-- Profile photos will be stored in: /uploads/profiles/user-{id}-{timestamp}.{ext}

-- Update existing users to not have profile completed (they need to fill it in)
UPDATE users SET profile_completed = false WHERE profile_completed IS NULL;

-- Add index for profile completion queries
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);

