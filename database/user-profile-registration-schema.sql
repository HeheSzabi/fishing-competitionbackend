-- User Profile and Competition Registration Schema
-- Extends the existing users table and creates competition registration system

-- Add phone number to users table for fisherman profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Competition Registrations table
-- Links users to competitions they've registered for
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

-- Update participants table to optionally link to registered users
ALTER TABLE participants ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES competition_registrations(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competition_registrations_user_id ON competition_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_competition_id ON competition_registrations(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_status ON competition_registrations(status);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_competition_registrations_updated_at 
    BEFORE UPDATE ON competition_registrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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

