const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fishing_competition',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5433,
});

module.exports = { pool };
