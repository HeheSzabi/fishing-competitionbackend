-- SUPABASE MIGRATION SCRIPT
-- This script adds all the new features to your working Supabase database
-- Run this in your Supabase SQL Editor

-- ==============================================
-- 1. USER AUTHENTICATION SYSTEM
-- ==============================================

-- Users table (main user authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions (optional, for session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 2. ENHANCED COMPETITIONS TABLE
-- ==============================================

-- Add new fields to existing competitions table
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS organizer VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact VARCHAR(255),
ADD COLUMN IF NOT EXISTS entry_fee VARCHAR(255),
ADD COLUMN IF NOT EXISTS prizes TEXT,
ADD COLUMN IF NOT EXISTS schedule TEXT,
ADD COLUMN IF NOT EXISTS rules_equipment TEXT,
ADD COLUMN IF NOT EXISTS general_rules TEXT,
ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);

-- ==============================================
-- 3. USER PROFILES
-- ==============================================

-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS street_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Hungary',
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- ==============================================
-- 4. COMPETITION REGISTRATION SYSTEM
-- ==============================================

-- Competition Registrations table
CREATE TABLE IF NOT EXISTS competition_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'withdrawn', 'confirmed')),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    withdrawal_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, competition_id)
);

-- Update participants table to link to registered users
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES competition_registrations(id) ON DELETE SET NULL;

-- ==============================================
-- 5. INDEXES FOR PERFORMANCE
-- ==============================================

-- User authentication indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);

-- Profile completion index
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);

-- Registration indexes
CREATE INDEX IF NOT EXISTS idx_competition_registrations_user_id ON competition_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_competition_id ON competition_registrations(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_status ON competition_registrations(status);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);

-- Cover image index
CREATE INDEX IF NOT EXISTS idx_competitions_cover_image ON competitions(cover_image) WHERE cover_image IS NOT NULL;

-- ==============================================
-- 6. TRIGGERS AND FUNCTIONS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_registrations_updated_at 
    BEFORE UPDATE ON competition_registrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 7. VIEWS FOR COMPLEX QUERIES
-- ==============================================

-- View to get registration details with user info
CREATE OR REPLACE VIEW competition_registrations_view AS
SELECT 
    cr.id,
    cr.user_id,
    cr.competition_id,
    cr.status,
    cr.registration_date,
    cr.withdrawal_date,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    c.name as competition_name,
    c.date as competition_date,
    c.location as competition_location
FROM competition_registrations cr
JOIN users u ON cr.user_id = u.id
JOIN competitions c ON cr.competition_id = c.id;

-- Function to get registered users count for a competition
CREATE OR REPLACE FUNCTION get_competition_registered_count(comp_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM competition_registrations 
        WHERE competition_id = comp_id 
        AND status = 'registered'
    );
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 8. SAMPLE ADMIN USER (Optional)
-- ==============================================

-- Uncomment and modify to create an admin user
-- INSERT INTO users (first_name, last_name, email, password_hash, role, profile_completed) 
-- VALUES ('Admin', 'User', 'admin@fishing.com', '$2a$12$your-hashed-password-here', 'admin', true)
-- ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- 9. VERIFICATION QUERIES
-- ==============================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'competition_registrations', 'password_reset_tokens', 'user_sessions')
ORDER BY table_name;

-- Check if new columns were added to competitions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'competitions' 
AND column_name IN ('location', 'organizer', 'contact', 'entry_fee', 'prizes', 'schedule', 'rules_equipment', 'general_rules', 'cover_image')
ORDER BY column_name;

-- Check if new columns were added to users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('phone', 'street_address', 'city', 'postal_code', 'country', 'photo_url', 'profile_completed')
ORDER BY column_name;
