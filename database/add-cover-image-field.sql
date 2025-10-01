-- Add cover image field to competitions table
-- Run this script to update the database schema for competition cover images

-- Add cover_image column to competitions table
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);

-- Add comment to describe the field
COMMENT ON COLUMN competitions.cover_image IS 'URL or file path to the competition cover image';

-- Create index for better performance when filtering by cover image
CREATE INDEX IF NOT EXISTS idx_competitions_cover_image ON competitions(cover_image) WHERE cover_image IS NOT NULL;
