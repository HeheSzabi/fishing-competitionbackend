-- Add new fields to competitions table
-- Run this script to update the database schema

-- Add new columns to competitions table
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS organizer VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact VARCHAR(255),
ADD COLUMN IF NOT EXISTS entry_fee VARCHAR(255),
ADD COLUMN IF NOT EXISTS prizes TEXT,
ADD COLUMN IF NOT EXISTS schedule TEXT,
ADD COLUMN IF NOT EXISTS rules_equipment TEXT,
ADD COLUMN IF NOT EXISTS general_rules TEXT;

-- Update existing competitions with sample data (optional)
UPDATE competitions 
SET 
    location = 'Moby Dick Nagyversenytó',
    organizer = 'Dálnoki István',
    contact = '06302402917',
    entry_fee = '16,000 HUF / fő',
    prizes = '1st place: Trophy + 50,000 HUF, 2nd place: Medal + 30,000 HUF, 3rd place: Medal + 20,000 HUF',
    schedule = '08:00 - Regisztráció, 09:00 - Verseny kezdete, 15:00 - Verseny vége, 15:30 - Díjátadás',
    rules_equipment = 'Csak egy horgászbot használata engedélyezett, Mesterséges csali tilos, Minimum méret: 25 cm',
    general_rules = 'A versenyzők kötelesek betartani a helyszín szabályait, A szervezők döntése végleges'
WHERE location IS NULL;
