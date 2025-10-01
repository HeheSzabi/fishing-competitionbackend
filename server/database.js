const { Pool } = require('pg');
require('dotenv').config();

// Database connection - Supabase configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres.ttbirrudgrrfvtgsvzxc',
  host: process.env.DB_HOST || 'aws-1-eu-north-1.pooler.supabase.com',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Szabolcska86!',
  port: process.env.DB_PORT || 6543,
});

module.exports = { pool };
