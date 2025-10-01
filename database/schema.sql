-- Fishing Competition Database Schema

-- Create database (run this separately)
-- CREATE DATABASE fishing_competition;

-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sectors table
CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    name VARCHAR(10) NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competition_id, name)
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competition_id, name)
);

-- Weigh-ins table
CREATE TABLE IF NOT EXISTS weigh_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    weight_grams INTEGER NOT NULL CHECK (weight_grams >= 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sectors_competition_id ON sectors(competition_id);
CREATE INDEX IF NOT EXISTS idx_participants_competition_id ON participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_participants_sector_id ON participants(sector_id);
CREATE INDEX IF NOT EXISTS idx_weigh_ins_participant_id ON weigh_ins(participant_id);
CREATE INDEX IF NOT EXISTS idx_weigh_ins_created_at ON weigh_ins(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_competitions_updated_at 
    BEFORE UPDATE ON competitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO competitions (name, description, date) VALUES 
('Spring Fishing Championship 2024', 'Annual spring fishing competition', '2024-04-15'),
('Summer Bass Tournament', 'Bass fishing tournament', '2024-07-20');

-- Get competition IDs for sample data
DO $$
DECLARE
    comp1_id UUID;
    comp2_id UUID;
BEGIN
    SELECT id INTO comp1_id FROM competitions WHERE name = 'Spring Fishing Championship 2024';
    SELECT id INTO comp2_id FROM competitions WHERE name = 'Summer Bass Tournament';
    
    -- Create sectors for first competition
    INSERT INTO sectors (competition_id, name, max_participants) VALUES 
    (comp1_id, 'A', 3),
    (comp1_id, 'B', 3),
    (comp1_id, 'C', 3);
    
    -- Create sectors for second competition
    INSERT INTO sectors (competition_id, name, max_participants) VALUES 
    (comp2_id, 'A', 4),
    (comp2_id, 'B', 4);
END $$;
