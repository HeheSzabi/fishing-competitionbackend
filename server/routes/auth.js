const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const crypto = require('crypto');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Database connection - Supabase configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres.ttbirrudgrrfvtgsvzxc',
  host: process.env.DB_HOST || 'aws-1-eu-north-1.pooler.supabase.com',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Szabolcska86!',
  port: process.env.DB_PORT || 6543,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, first_name, last_name, email, phone, role, created_at`,
      [firstName, lastName, email, passwordHash, phone]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, phone, password_hash, role, is_active, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, street_address, city, 
              postal_code, country, photo_url, profile_completed, role, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      streetAddress: user.street_address,
      city: user.city,
      postalCode: user.postal_code,
      country: user.country,
      photoUrl: user.photo_url,
      profileCompleted: user.profile_completed,
      role: user.role,
      createdAt: user.created_at
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, streetAddress, city, postalCode, country, profileCompleted } = req.body;
    const userId = req.user.id;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           street_address = COALESCE($5, street_address),
           city = COALESCE($6, city),
           postal_code = COALESCE($7, postal_code),
           country = COALESCE($8, country),
           profile_completed = COALESCE($9, profile_completed),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, first_name, last_name, email, phone, street_address, city, 
                 postal_code, country, photo_url, profile_completed, role, created_at`,
      [firstName, lastName, email, phone, streetAddress, city, postalCode, country, profileCompleted, userId]
    );

    const user = result.rows[0];
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      streetAddress: user.street_address,
      city: user.city,
      postalCode: user.postal_code,
      country: user.country,
      photoUrl: user.photo_url,
      profileCompleted: user.profile_completed,
      role: user.role,
      createdAt: user.created_at
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload profile photo
router.post('/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    // Get old photo to delete it
    const oldPhotoResult = await pool.query(
      'SELECT photo_url FROM users WHERE id = $1',
      [userId]
    );

    // Update user with new photo URL
    const result = await pool.query(
      `UPDATE users 
       SET photo_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING photo_url`,
      [photoUrl, userId]
    );

    // Delete old photo file if it exists
    if (oldPhotoResult.rows[0]?.photo_url) {
      const oldPhotoPath = path.join(__dirname, '../..', oldPhotoResult.rows[0].photo_url);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    res.json({
      message: 'Photo uploaded successfully',
      photoUrl: result.rows[0].photo_url
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    // Delete uploaded file if database update fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete profile photo
router.delete('/profile/photo', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current photo
    const result = await pool.query(
      'SELECT photo_url FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]?.photo_url) {
      return res.status(404).json({ message: 'No photo to delete' });
    }

    const photoPath = path.join(__dirname, '../..', result.rows[0].photo_url);

    // Remove photo from database
    await pool.query(
      'UPDATE users SET photo_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    // Delete file if it exists
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    res.json({ message: 'Photo deleted successfully' });

  } catch (error) {
    console.error('Photo delete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [result.rows[0].id, resetToken, expiresAt]
    );

    // In production, send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If the email exists, a reset link has been sent' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Invalid token or password' });
    }

    // Find valid token
    const result = await pool.query(
      `SELECT prt.user_id, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and mark token as used
    await pool.query('BEGIN');
    
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, result.rows[0].user_id]
    );

    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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

module.exports = router;
