const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const router = express.Router();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fishing_competition',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5433,
});

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

// Get all registrations for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own registrations (unless admin)
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT cr.*, c.name as competition_name, c.date, c.location, c.description
       FROM competition_registrations cr
       JOIN competitions c ON cr.competition_id = c.id
       WHERE cr.user_id = $1
       ORDER BY cr.registration_date DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all registrations for a competition
router.get('/competition/:competitionId', async (req, res) => {
  try {
    const { competitionId } = req.params;

    const result = await pool.query(
      `SELECT cr.*, u.first_name, u.last_name, u.email, u.phone
       FROM competition_registrations cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.competition_id = $1 AND cr.status = 'registered'
       ORDER BY cr.registration_date ASC`,
      [competitionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching competition registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user is registered for a competition
router.get('/check/:competitionId', authenticateToken, async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM competition_registrations 
       WHERE user_id = $1 AND competition_id = $2`,
      [userId, competitionId]
    );

    if (result.rows.length > 0) {
      res.json({ 
        isRegistered: result.rows[0].status === 'registered',
        registration: result.rows[0]
      });
    } else {
      res.json({ isRegistered: false, registration: null });
    }
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register user for a competition
router.post('/register', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { competitionId } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Check competition capacity
    const capacityCheck = await client.query(
      `SELECT 
        (SELECT COUNT(*) FROM participants WHERE competition_id = $1) as current_count,
        (SELECT SUM(max_participants) FROM sectors WHERE competition_id = $1) as total_capacity
       FROM competitions WHERE id = $1`,
      [competitionId]
    );

    const { current_count, total_capacity } = capacityCheck.rows[0];
    
    if (current_count >= total_capacity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'A verseny megtelt, nincs több hely' });
    }

    // Check if user is already registered
    const existingRegistration = await client.query(
      `SELECT * FROM competition_registrations 
       WHERE user_id = $1 AND competition_id = $2`,
      [userId, competitionId]
    );

    if (existingRegistration.rows.length > 0) {
      const registration = existingRegistration.rows[0];
      
      if (registration.status === 'registered') {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Már regisztráltál erre a versenyre' });
      } else if (registration.status === 'withdrawn') {
        // Re-register (user previously withdrew)
        const updateResult = await client.query(
          `UPDATE competition_registrations 
           SET status = 'registered', registration_date = CURRENT_TIMESTAMP, withdrawal_date = NULL
           WHERE id = $1
           RETURNING *`,
          [registration.id]
        );
        
        // Get user details for participant entry
        const userResult = await client.query(
          'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
          [userId]
        );
        const user = userResult.rows[0];
        
        // Re-create participant entry
        const participantName = `${user.first_name} ${user.last_name}`;
        await client.query(
          `INSERT INTO participants (competition_id, sector_id, name, user_id, registration_id)
           VALUES ($1, NULL, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [competitionId, participantName, userId, registration.id]
        );
        
        await client.query('COMMIT');
        
        // Get competition details for email
        const competitionResult = await pool.query(
          'SELECT * FROM competitions WHERE id = $1',
          [competitionId]
        );

        // Send confirmation email
        const userForEmail = {
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email
        };
        await emailService.sendRegistrationConfirmation(userForEmail, competitionResult.rows[0]);

        return res.status(201).json({
          message: 'Sikeresen regisztráltál a versenyre!',
          registration: updateResult.rows[0]
        });
      }
    }

    // Get user details
    const userResult = await client.query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    
    // Create new registration
    const result = await client.query(
      `INSERT INTO competition_registrations (user_id, competition_id, status)
       VALUES ($1, $2, 'registered')
       RETURNING *`,
      [userId, competitionId]
    );

    const registrationId = result.rows[0].id;

    // Create participant entry (no sector assigned yet)
    const participantName = `${user.first_name} ${user.last_name}`;
    const participantResult = await client.query(
      `INSERT INTO participants (competition_id, sector_id, name, user_id, registration_id)
       VALUES ($1, NULL, $2, $3, $4)
       RETURNING *`,
      [competitionId, participantName, userId, registrationId]
    );

    await client.query('COMMIT');

    // Get competition details for email
    const competitionResult = await pool.query(
      'SELECT * FROM competitions WHERE id = $1',
      [competitionId]
    );

    // Send confirmation email
    const userForEmail = {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email
    };
    await emailService.sendRegistrationConfirmation(userForEmail, competitionResult.rows[0]);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`competition-${competitionId}`).emit('registration-updated', {
        type: 'new_registration',
        competitionId,
        registration: result.rows[0]
      });
    }

    res.status(201).json({
      message: 'Sikeresen regisztráltál a versenyre!',
      registration: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering for competition:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Withdraw from a competition
router.post('/withdraw', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { competitionId } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Check if user is registered
    const registrationResult = await client.query(
      `SELECT * FROM competition_registrations 
       WHERE user_id = $1 AND competition_id = $2 AND status = 'registered'`,
      [userId, competitionId]
    );

    if (registrationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Nem vagy regisztrálva erre a versenyre' });
    }

    // Update registration status
    const result = await client.query(
      `UPDATE competition_registrations 
       SET status = 'withdrawn', withdrawal_date = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND competition_id = $2
       RETURNING *`,
      [userId, competitionId]
    );

    // Remove participant entry (they're no longer participating)
    await client.query(
      `DELETE FROM participants 
       WHERE user_id = $1 AND competition_id = $2`,
      [userId, competitionId]
    );

    await client.query('COMMIT');

    // Get user and competition details for email
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
      [userId]
    );
    const competitionResult = await pool.query(
      'SELECT * FROM competitions WHERE id = $1',
      [competitionId]
    );

    // Send confirmation email
    const user = {
      firstName: userResult.rows[0].first_name,
      lastName: userResult.rows[0].last_name,
      email: userResult.rows[0].email
    };
    await emailService.sendWithdrawalConfirmation(user, competitionResult.rows[0]);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`competition-${competitionId}`).emit('registration-updated', {
        type: 'withdrawal',
        competitionId,
        registration: result.rows[0]
      });
    }

    res.json({
      message: 'Sikeresen visszaléptél a versenyről.',
      registration: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error withdrawing from competition:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get registration statistics for a competition
router.get('/stats/:competitionId', async (req, res) => {
  try {
    const { competitionId } = req.params;

    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'registered') as registered_count,
        COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn_count,
        COUNT(*) as total_count
       FROM competition_registrations
       WHERE competition_id = $1`,
      [competitionId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching registration stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

