-- Setup Admin User Script
-- This script creates an admin user for the fishing competition system
-- Run this script after setting up the database and auth schema

-- Create admin user (replace with your desired admin credentials)
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, email_verified)
VALUES (
  'Admin',
  'User',
  'admin@fishingcompetition.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K8', -- password: admin123
  'admin',
  true,
  true
);

-- Verify the admin user was created
SELECT id, first_name, last_name, email, role, is_active, created_at 
FROM users 
WHERE role = 'admin';

-- Note: The password hash above is for 'admin123'
-- In production, you should:
-- 1. Use a stronger password
-- 2. Change the password immediately after first login
-- 3. Use environment variables for sensitive data
