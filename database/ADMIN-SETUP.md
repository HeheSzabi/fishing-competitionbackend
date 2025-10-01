# Admin User Setup Guide

This guide explains how to set up an admin user for the Fishing Competition system.

## Overview

The system now requires admin privileges to create, update, or delete competitions. Regular users can still view competitions, manage participants, and record weigh-ins.

## Setup Methods

### Method 1: Promote Existing User (Recommended)

1. **Register a regular user** through the application UI
2. **Connect to your database** and run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
   ```
3. **Test the login** with the promoted user

### Method 2: Create Admin User Directly

1. **Generate a password hash**:
   ```bash
   cd database
   node generate-admin-hash.js
   ```
   Follow the prompts to generate a secure hash.

2. **Run the SQL** with your generated hash:
   ```sql
   INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, email_verified)
   VALUES (
     'Admin',
     'User',
     'admin@yourdomain.com',
     'YOUR_GENERATED_HASH_HERE',
     'admin',
     true,
     true
   );
   ```

### Method 3: Development Setup (Quick)

For development environments only:

1. **Run the development setup script**:
   ```sql
   -- This creates admin@fishingcompetition.local with password: admin123
   \i setup-admin-secure.sql
   ```

2. **Login credentials**:
   - Email: `admin@fishingcompetition.local`
   - Password: `admin123`

## Verification

After setting up the admin user:

1. **Login to the application** with admin credentials
2. **Verify admin features**:
   - "New Competition" button should be visible
   - Navigation should show "New Competition" link
   - Can access `/competitions/new` route
3. **Test regular user**:
   - Login with non-admin user
   - "New Competition" button should be hidden
   - Accessing `/competitions/new` should redirect

## Security Notes

- **Change default passwords** immediately after setup
- **Use strong passwords** for admin accounts
- **Limit admin access** to trusted individuals
- **Monitor admin activities** in production
- **Use HTTPS** in production environments

## Troubleshooting

### Admin user can't create competitions
- Check if user role is set to 'admin' in database
- Verify JWT token contains correct role
- Check browser console for errors

### Regular users can still see create buttons
- Clear browser cache and localStorage
- Logout and login again
- Check if frontend changes are deployed

### Backend returns 403 errors
- Verify JWT token is being sent in Authorization header
- Check if user role is 'admin' in the token payload
- Ensure backend middleware is properly configured

## Database Schema

The admin system uses the existing `users` table with these key fields:
- `role`: Set to 'admin' for admin users, 'user' for regular users
- `is_active`: Must be true for the user to login
- `email_verified`: Should be true for admin users

## API Endpoints Requiring Admin Access

- `POST /api/competitions` - Create competition
- `PUT /api/competitions/:id` - Update competition  
- `DELETE /api/competitions/:id` - Delete competition

All other endpoints remain accessible to authenticated users.
