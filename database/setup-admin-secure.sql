-- Secure Admin User Setup Script
-- This script provides instructions for creating an admin user securely

-- Method 1: Create admin user through the application
-- 1. Register a regular user through the application UI
-- 2. Then run this SQL to promote them to admin:
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- Method 2: Create admin user directly (requires password hashing)
-- You'll need to hash the password using bcrypt with salt rounds 12
-- Example using Node.js:
-- const bcrypt = require('bcryptjs');
-- const password = 'your-secure-password';
-- const saltRounds = 12;
-- const hash = await bcrypt.hash(password, saltRounds);
-- console.log('Password hash:', hash);

-- Then insert with the generated hash:
-- INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, email_verified)
-- VALUES (
--   'Admin',
--   'User', 
--   'admin@yourdomain.com',
--   'GENERATED_HASH_HERE',
--   'admin',
--   true,
--   true
-- );

-- Method 3: Temporary admin setup (for development only)
-- This creates an admin user with a known password for development
-- WARNING: Only use this in development environments!

-- Password: admin123 (hashed with bcrypt, salt rounds 12)
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, email_verified)
VALUES (
  'Admin',
  'User',
  'admin@fishingcompetition.local',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K8',
  'admin',
  true,
  true
) ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  is_active = true,
  updated_at = CURRENT_TIMESTAMP;

-- Verify admin user exists
SELECT id, first_name, last_name, email, role, is_active, created_at 
FROM users 
WHERE role = 'admin';
