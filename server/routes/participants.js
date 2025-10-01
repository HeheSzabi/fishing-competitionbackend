const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Randomly assign participants to sectors (MUST be before /:id route)
router.post('/competition/:competitionId/random-assign', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing sector assignments first
      await client.query(
        'UPDATE participants SET sector_id = NULL WHERE competition_id = $1',
        [competitionId]
      );
      
      // Get all participants for the competition
      const participantsResult = await client.query(
        'SELECT * FROM participants WHERE competition_id = $1',
        [competitionId]
      );
      
      // Get all sectors for the competition
      const sectorsResult = await client.query(
        'SELECT * FROM sectors WHERE competition_id = $1 ORDER BY name',
        [competitionId]
      );
      
      if (participantsResult.rows.length === 0) {
        return res.json({ message: 'No participants found for this competition' });
      }
      
      if (sectorsResult.rows.length === 0) {
        return res.status(400).json({ error: 'No sectors found for this competition' });
      }
      
      const participants = participantsResult.rows;
      const sectors = sectorsResult.rows;
      
      // Shuffle participants array
      const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
      
      // Assign participants to sectors evenly
      const assignments = [];
      let sectorIndex = 0;
      
      for (let i = 0; i < shuffledParticipants.length; i++) {
        const participant = shuffledParticipants[i];
        const sector = sectors[sectorIndex];
        
        // Check if sector has space
        const currentSectorCount = await client.query(
          'SELECT COUNT(*) as count FROM participants WHERE sector_id = $1',
          [sector.id]
        );
        
        const currentCount = parseInt(currentSectorCount.rows[0].count);
        
        if (currentCount < sector.max_participants) {
          // Assign participant to this sector
          await client.query(
            'UPDATE participants SET sector_id = $1 WHERE id = $2',
            [sector.id, participant.id]
          );
          
          console.log(`Assigned participant ${participant.name} to sector ${sector.name}`);
          
          assignments.push({
            participant: participant,
            sector: sector
          });
          
          // Move to next sector
          sectorIndex = (sectorIndex + 1) % sectors.length;
        } else {
          // This sector is full, try next sector
          sectorIndex = (sectorIndex + 1) % sectors.length;
          
          // If all sectors are full, break
          let allSectorsFull = true;
          for (const s of sectors) {
            const countResult = await client.query(
              'SELECT COUNT(*) as count FROM participants WHERE sector_id = $1',
              [s.id]
            );
            if (parseInt(countResult.rows[0].count) < s.max_participants) {
              allSectorsFull = false;
              break;
            }
          }
          
          if (allSectorsFull) {
            break;
          }
          
          // Try again with the same participant
          i--;
        }
      }
      
      await client.query('COMMIT');
      
      // Verify assignments were made
      const verificationResult = await client.query(`
        SELECT p.name, s.name as sector_name 
        FROM participants p 
        LEFT JOIN sectors s ON p.sector_id = s.id 
        WHERE p.competition_id = $1
      `, [competitionId]);
      
      console.log('Verification - Participants and their sectors:', verificationResult.rows);
      
      res.json({
        message: `Successfully assigned ${assignments.length} participants to sectors`,
        assignments: assignments,
        verification: verificationResult.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error in random assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available sectors for a competition (MUST be before /:id route)
router.get('/competition/:competitionId/available-sectors', async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const result = await pool.query(`
      SELECT s.*, 
             s.max_participants - COALESCE(participant_count, 0) as available_spots
      FROM sectors s
      LEFT JOIN (
        SELECT sector_id, COUNT(*) as participant_count
        FROM participants
        WHERE competition_id = $1
        GROUP BY sector_id
      ) p ON s.id = p.sector_id
      WHERE s.competition_id = $1
      ORDER BY s.name
    `, [competitionId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available sectors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all participants for a competition
router.get('/competition/:competitionId', async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const result = await pool.query(`
      SELECT p.*, s.name as sector_name,
             u.first_name, u.last_name, u.photo_url,
             COALESCE(wi.total_weight, 0) as total_weight,
             COALESCE(wi.weigh_in_count, 0) as weigh_in_count
      FROM participants p
      LEFT JOIN sectors s ON p.sector_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT participant_id,
               SUM(weight_grams) as total_weight,
               COUNT(*) as weigh_in_count
        FROM weigh_ins
        GROUP BY participant_id
      ) wi ON p.id = wi.participant_id
      WHERE p.competition_id = $1
      ORDER BY s.name, p.name
    `, [competitionId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get participant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT p.*, s.name as sector_name, c.name as competition_name
      FROM participants p
      LEFT JOIN sectors s ON p.sector_id = s.id
      LEFT JOIN competitions c ON p.competition_id = c.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add participant to competition
router.post('/', async (req, res) => {
  try {
    const { name, competition_id, sector_id } = req.body;
    
    // Check if sector has space
    const sectorResult = await pool.query(
      'SELECT max_participants, (SELECT COUNT(*) FROM participants WHERE sector_id = $1) as current_count FROM sectors WHERE id = $1',
      [sector_id]
    );
    
    if (sectorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sector not found' });
    }
    
    const { max_participants, current_count } = sectorResult.rows[0];
    if (current_count >= max_participants) {
      return res.status(400).json({ error: 'Sector is full' });
    }
    
    const result = await pool.query(
      'INSERT INTO participants (name, competition_id, sector_id) VALUES ($1, $2, $3) RETURNING *',
      [name, competition_id, sector_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update participant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sector_id } = req.body;
    
    // If changing sector, check if new sector has space
    if (sector_id) {
      const sectorResult = await pool.query(
        'SELECT max_participants, (SELECT COUNT(*) FROM participants WHERE sector_id = $1) as current_count FROM sectors WHERE id = $1',
        [sector_id]
      );
      
      if (sectorResult.rows.length === 0) {
        return res.status(404).json({ error: 'Sector not found' });
      }
      
      const { max_participants, current_count } = sectorResult.rows[0];
      if (current_count >= max_participants) {
        return res.status(400).json({ error: 'Sector is full' });
      }
    }
    
    const result = await pool.query(
      'UPDATE participants SET name = $1, sector_id = $2 WHERE id = $3 RETURNING *',
      [name, sector_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete participant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM participants WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json({ message: 'Participant deleted successfully' });
  } catch (error) {
    console.error('Error deleting participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
