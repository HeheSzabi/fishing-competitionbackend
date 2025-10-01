const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Get all weigh-ins for a participant
router.get('/participant/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM weigh_ins WHERE participant_id = $1 ORDER BY created_at DESC',
      [participantId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching weigh-ins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all weigh-ins for a competition
router.get('/competition/:competitionId', async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const result = await pool.query(`
      SELECT w.*, p.name as participant_name, s.name as sector_name
      FROM weigh_ins w
      JOIN participants p ON w.participant_id = p.id
      LEFT JOIN sectors s ON p.sector_id = s.id
      WHERE p.competition_id = $1
      ORDER BY w.created_at DESC
    `, [competitionId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching weigh-ins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new weigh-in
router.post('/', async (req, res) => {
  try {
    const { participant_id, weight_grams, notes } = req.body;
    
    // Validate participant exists
    const participantResult = await pool.query(
      'SELECT * FROM participants WHERE id = $1',
      [participant_id]
    );
    
    if (participantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    const result = await pool.query(
      'INSERT INTO weigh_ins (participant_id, weight_grams, notes) VALUES ($1, $2, $3) RETURNING *',
      [participant_id, weight_grams, notes]
    );
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const participant = participantResult.rows[0];
      io.to(`competition-${participant.competition_id}`).emit('weigh-in-added', {
        weighIn: result.rows[0],
        participant: participant
      });
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding weigh-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update weigh-in
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { weight_grams, notes } = req.body;
    
    const result = await pool.query(
      'UPDATE weigh_ins SET weight_grams = $1, notes = $2 WHERE id = $3 RETURNING *',
      [weight_grams, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weigh-in not found' });
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const participantResult = await pool.query(
        'SELECT p.*, c.id as competition_id FROM participants p JOIN competitions c ON p.competition_id = c.id WHERE p.id = (SELECT participant_id FROM weigh_ins WHERE id = $1)',
        [id]
      );
      
      if (participantResult.rows.length > 0) {
        const participant = participantResult.rows[0];
        io.to(`competition-${participant.competition_id}`).emit('weigh-in-updated', {
          weighIn: result.rows[0],
          participant: participant
        });
      }
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating weigh-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete weigh-in
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get participant info before deletion for real-time update
    const participantResult = await pool.query(
      'SELECT p.*, c.id as competition_id FROM participants p JOIN competitions c ON p.competition_id = c.id WHERE p.id = (SELECT participant_id FROM weigh_ins WHERE id = $1)',
      [id]
    );
    
    const result = await pool.query(
      'DELETE FROM weigh_ins WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weigh-in not found' });
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io && participantResult.rows.length > 0) {
      const participant = participantResult.rows[0];
      io.to(`competition-${participant.competition_id}`).emit('weigh-in-deleted', {
        weighInId: id,
        participant: participant
      });
    }
    
    res.json({ message: 'Weigh-in deleted successfully' });
  } catch (error) {
    console.error('Error deleting weigh-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get total weight for a participant
router.get('/participant/:participantId/total', async (req, res) => {
  try {
    const { participantId } = req.params;
    
    const result = await pool.query(
      'SELECT COALESCE(SUM(weight_grams), 0) as total_weight FROM weigh_ins WHERE participant_id = $1',
      [participantId]
    );
    
    res.json({ total_weight: result.rows[0].total_weight });
  } catch (error) {
    console.error('Error fetching total weight:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
