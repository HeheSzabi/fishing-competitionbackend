const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Get sector results for a competition
router.get('/competition/:competitionId/sectors', async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        s.id as sector_id,
        s.name as sector_name,
        p.id as participant_id,
        p.name as participant_name,
        COALESCE(SUM(w.weight_grams), 0) as total_weight,
        ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY COALESCE(SUM(w.weight_grams), 0) DESC) as sector_rank,
        ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY COALESCE(SUM(w.weight_grams), 0) DESC) as sector_points
      FROM sectors s
      LEFT JOIN participants p ON s.id = p.sector_id
      LEFT JOIN weigh_ins w ON p.id = w.participant_id
      WHERE s.competition_id = $1
      GROUP BY s.id, s.name, p.id, p.name
      ORDER BY s.name, total_weight DESC
    `, [competitionId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sector results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overall results for a competition
router.get('/competition/:competitionId/overall', async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const result = await pool.query(`
      WITH sector_rankings AS (
        SELECT 
          p.id as participant_id,
          p.name as participant_name,
          s.name as sector_name,
          COALESCE(SUM(w.weight_grams), 0) as total_weight,
          ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY COALESCE(SUM(w.weight_grams), 0) DESC) as sector_points
        FROM participants p
        JOIN sectors s ON p.sector_id = s.id
        LEFT JOIN weigh_ins w ON p.id = w.participant_id
        WHERE p.competition_id = $1
        GROUP BY p.id, p.name, s.id, s.name
      )
      SELECT 
        participant_id,
        participant_name,
        sector_name,
        total_weight,
        sector_points,
        ROW_NUMBER() OVER (ORDER BY sector_points ASC, total_weight DESC) as overall_rank
      FROM sector_rankings
      ORDER BY overall_rank
    `, [competitionId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching overall results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get competition summary
router.get('/competition/:competitionId/summary', async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.name as competition_name,
        c.date as competition_date,
        COUNT(DISTINCT s.id) as sector_count,
        COUNT(DISTINCT p.id) as participant_count,
        COALESCE(SUM(w.weight_grams), 0) as total_catch_weight,
        COUNT(w.id) as total_weigh_ins
      FROM competitions c
      LEFT JOIN sectors s ON c.id = s.competition_id
      LEFT JOIN participants p ON c.id = p.competition_id
      LEFT JOIN weigh_ins w ON p.id = w.participant_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.date
    `, [competitionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching competition summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard for a competition
router.get('/competition/:competitionId/leaderboard', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { limit = 10 } = req.query;
    
    const result = await pool.query(`
      WITH sector_rankings AS (
        SELECT 
          p.id as participant_id,
          p.name as participant_name,
          s.name as sector_name,
          COALESCE(SUM(w.weight_grams), 0) as total_weight,
          ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY COALESCE(SUM(w.weight_grams), 0) DESC) as sector_points
        FROM participants p
        JOIN sectors s ON p.sector_id = s.id
        LEFT JOIN weigh_ins w ON p.id = w.participant_id
        WHERE p.competition_id = $1
        GROUP BY p.id, p.name, s.id, s.name
      )
      SELECT 
        participant_id,
        participant_name,
        sector_name,
        total_weight,
        sector_points,
        ROW_NUMBER() OVER (ORDER BY sector_points ASC, total_weight DESC) as overall_rank
      FROM sector_rankings
      ORDER BY overall_rank
      LIMIT $2
    `, [competitionId, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
