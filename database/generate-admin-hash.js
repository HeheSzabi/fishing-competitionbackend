#!/usr/bin/env node

/**
 * Generate Admin Password Hash
 * 
 * This script helps generate a secure password hash for creating admin users.
 * Run with: node generate-admin-hash.js
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Admin Password Hash Generator');
console.log('================================\n');

rl.question('Enter the admin password: ', (password) => {
  if (!password || password.length < 6) {
    console.log('❌ Password must be at least 6 characters long');
    rl.close();
    return;
  }

  const saltRounds = 12;
  const hash = bcrypt.hashSync(password, saltRounds);
  
  console.log('\n✅ Password hash generated successfully!');
  console.log('=====================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n📝 SQL to create admin user:');
  console.log('INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, email_verified)');
  console.log('VALUES (');
  console.log("  'Admin',");
  console.log("  'User',");
  console.log("  'admin@yourdomain.com',");
  console.log(`  '${hash}',`);
  console.log("  'admin',");
  console.log('  true,');
  console.log('  true');
  console.log(');');
  
  rl.close();
});

rl.on('close', () => {
  console.log('\n🔒 Remember to:');
  console.log('1. Change the email to your admin email');
  console.log('2. Run the SQL in your database');
  console.log('3. Test the login with the admin credentials');
  console.log('4. Change the password after first login');
  process.exit(0);
});
