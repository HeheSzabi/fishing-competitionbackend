const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { pool } = require('../database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/competitions/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }
  next(error);
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to require admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get all competitions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             COUNT(p.id) as participant_count,
             COUNT(DISTINCT s.id) as sector_count
      FROM competitions c
      LEFT JOIN participants p ON c.id = p.competition_id
      LEFT JOIN sectors s ON c.id = s.competition_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get competition by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const competitionResult = await pool.query(
      'SELECT * FROM competitions WHERE id = $1',
      [id]
    );
    
    if (competitionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    const sectorsResult = await pool.query(`
      SELECT s.*, 
             COUNT(p.id) as participant_count
      FROM sectors s
      LEFT JOIN participants p ON s.id = p.sector_id
      WHERE s.competition_id = $1
      GROUP BY s.id
      ORDER BY s.name
    `, [id]);
    
    const participantsResult = await pool.query(`
      SELECT p.*, s.name as sector_name
      FROM participants p
      LEFT JOIN sectors s ON p.sector_id = s.id
      WHERE p.competition_id = $1
      ORDER BY s.name, p.name
    `, [id]);
    
    console.log('Competition API - Participants with sectors:', participantsResult.rows.map(p => ({
      name: p.name,
      sector_id: p.sector_id,
      sector_name: p.sector_name
    })));
    
    res.json({
      competition: competitionResult.rows[0],
      sectors: sectorsResult.rows,
      participants: participantsResult.rows
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new competition
router.post('/', authenticateToken, requireAdmin, upload.single('cover_image'), handleUploadError, async (req, res) => {
  try {
    console.log('Received competition data:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { 
      name, 
      description, 
      date, 
      location, 
      organizer, 
      contact, 
      entry_fee, 
      prizes, 
      schedule, 
      rules_equipment, 
      general_rules, 
      sector_count, 
      participants_per_sector 
    } = req.body;
    
    // Get cover image path if file was uploaded
    const cover_image = req.file ? `/uploads/competitions/${req.file.filename}` : null;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create competition
      const competitionResult = await client.query(
        'INSERT INTO competitions (name, description, date, location, organizer, contact, entry_fee, prizes, schedule, rules_equipment, general_rules, cover_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
        [name, description, date, location, organizer, contact, entry_fee, prizes, schedule, rules_equipment, general_rules, cover_image]
      );
      
      const competitionId = competitionResult.rows[0].id;
      
      // Create sectors
      const sectors = [];
      for (let i = 0; i < sector_count; i++) {
        const sectorName = String.fromCharCode(65 + i); // A, B, C, etc.
        const sectorResult = await client.query(
          'INSERT INTO sectors (competition_id, name, max_participants) VALUES ($1, $2, $3) RETURNING *',
          [competitionId, sectorName, participants_per_sector]
        );
        sectors.push(sectorResult.rows[0]);
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        competition: competitionResult.rows[0],
        sectors: sectors
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating competition:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update competition
router.put('/:id', authenticateToken, requireAdmin, upload.single('cover_image'), handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Received competition update data:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { 
      name, 
      description, 
      date, 
      location, 
      organizer, 
      contact, 
      entry_fee, 
      prizes, 
      schedule, 
      rules_equipment, 
      general_rules,
      sector_count,
      participants_per_sector
    } = req.body;
    
    // Get cover image path if file was uploaded
    const cover_image = req.file ? `/uploads/competitions/${req.file.filename}` : req.body.cover_image;
    
    console.log('Updating competition with data:', req.body);
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update competition details
      const result = await client.query(
        `UPDATE competitions 
         SET name = $1, 
             description = $2, 
             date = $3, 
             location = $4, 
             organizer = $5, 
             contact = $6, 
             entry_fee = $7, 
             prizes = $8, 
             schedule = $9, 
             rules_equipment = $10, 
             general_rules = $11,
             cover_image = $12
         WHERE id = $13 
         RETURNING *`,
        [name, description, date, location, organizer, contact, entry_fee, prizes, schedule, rules_equipment, general_rules, cover_image, id]
      );
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Competition not found' });
      }
      
      // Handle sector updates if sector_count or participants_per_sector is provided
      if (sector_count !== undefined || participants_per_sector !== undefined) {
        // Get current sectors
        const currentSectorsResult = await client.query(
          'SELECT * FROM sectors WHERE competition_id = $1 ORDER BY name',
          [id]
        );
        
        const currentSectors = currentSectorsResult.rows;
        const currentSectorCount = currentSectors.length;
        const newSectorCount = sector_count || currentSectorCount;
        const newParticipantsPerSector = participants_per_sector || (currentSectors[0]?.max_participants || 3);
        
        console.log(`Current sectors: ${currentSectorCount}, New sectors: ${newSectorCount}`);
        console.log(`New participants per sector: ${newParticipantsPerSector}`);
        
        // Check if there are any participants assigned to sectors
        const participantsResult = await client.query(
          'SELECT COUNT(*) as count FROM participants WHERE competition_id = $1 AND sector_id IS NOT NULL',
          [id]
        );
        
        const hasAssignedParticipants = parseInt(participantsResult.rows[0].count) > 0;
        
        if (hasAssignedParticipants && newSectorCount < currentSectorCount) {
          // Don't allow reducing sector count if participants are already assigned
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: 'Cannot reduce sector count when participants are already assigned to sectors. Please unassign participants first.' 
          });
        }
        
        if (newSectorCount !== currentSectorCount) {
          if (newSectorCount < currentSectorCount) {
            // Remove excess sectors (from the end)
            const sectorsToRemove = currentSectors.slice(newSectorCount);
            for (const sector of sectorsToRemove) {
              await client.query('DELETE FROM sectors WHERE id = $1', [sector.id]);
              console.log(`Deleted sector ${sector.name}`);
            }
          } else {
            // Add new sectors
            for (let i = currentSectorCount; i < newSectorCount; i++) {
              const sectorName = String.fromCharCode(65 + i); // A, B, C, etc.
              await client.query(
                'INSERT INTO sectors (competition_id, name, max_participants) VALUES ($1, $2, $3)',
                [id, sectorName, newParticipantsPerSector]
              );
              console.log(`Added sector ${sectorName}`);
            }
          }
        }
        
        // Update max_participants for all existing sectors
        await client.query(
          'UPDATE sectors SET max_participants = $1 WHERE competition_id = $2',
          [newParticipantsPerSector, id]
        );
        console.log(`Updated max_participants to ${newParticipantsPerSector} for all sectors`);
      }
      
      await client.query('COMMIT');
      
      console.log('Competition updated successfully:', result.rows[0]);
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating competition:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete competition
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM competitions WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    console.error('Error deleting competition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
