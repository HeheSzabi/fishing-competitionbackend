# Setup Guide: Competition Registration System

## Prerequisites
- PostgreSQL database running
- Existing fishing competition database with auth schema already applied

## Step 1: Apply Database Schema

Run the registration schema migration:

```bash
psql -U postgres -d fishing_competition -f database/user-profile-registration-schema.sql
```

Or if you're using a different user:

```bash
psql -U your_username -d fishing_competition -f database/user-profile-registration-schema.sql
```

## Step 2: Verify Tables Created

Connect to your database and verify:

```sql
-- Check if phone column was added to users
\d users

-- Check if competition_registrations table exists
\d competition_registrations

-- Check if view was created
\d competition_registrations_view

-- Test the function
SELECT get_competition_registered_count('some-competition-id');
```

## Step 3: Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp env.example .env
```

Edit `.env` and set:
- Database credentials
- JWT secret
- Email configuration (optional for development)

## Step 4: Install Dependencies

Make sure all npm packages are installed:

```bash
npm install
```

## Step 5: Start the Server

```bash
npm run dev
```

Or for production:

```bash
npm start
```

## Step 6: Test the System

### Backend API Tests

1. **Register a User** (with phone number):
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "János",
    "lastName": "Kovács",
    "email": "test@example.com",
    "password": "test123",
    "phone": "+36 30 123 4567"
  }'
```

2. **Login**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

Save the token from the response for next requests.

3. **Register for Competition**:
```bash
curl -X POST http://localhost:3001/api/registrations/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "competitionId": "YOUR_COMPETITION_ID_HERE"
  }'
```

Check your console for the email output!

4. **Check Registration Status**:
```bash
curl http://localhost:3001/api/registrations/check/YOUR_COMPETITION_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

5. **Withdraw from Competition**:
```bash
curl -X POST http://localhost:3001/api/registrations/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "competitionId": "YOUR_COMPETITION_ID_HERE"
  }'
```

### Frontend Testing

1. Start the Angular development server:
```bash
cd client
ng serve
```

2. Navigate to `http://localhost:4200`

3. **Test User Registration**:
   - Click on login/register
   - Create a new account
   - Notice the phone number field (optional)
   - Register

4. **Test Competition Registration**:
   - Go to competitions page
   - Find a competition card
   - Click "Feliratkozok a versenyre"
   - Check for success message
   - Notice the button changes to "Visszalépés"

5. **Test Withdrawal**:
   - Click "Visszalépés"
   - Confirm the withdrawal
   - Check for success message
   - Notice the button changes back

6. **Check Email Output**:
   - Look at your terminal/console running the backend
   - You should see simulated email output with the email content

## Common Issues

### Issue: Column "phone" does not exist
**Solution**: Run the database migration again

### Issue: Email not logging to console
**Solution**: 
- Check that EMAIL_SERVICE is NOT set in .env
- The default behavior is console logging

### Issue: "Access token required" error
**Solution**: 
- Make sure you're logged in
- Check that the JWT token is being sent in headers
- Verify JWT_SECRET matches between frontend and backend

### Issue: Registration button not showing
**Solution**:
- Make sure you're logged in as a regular user (not admin)
- Check that competitions are loading
- Open browser developer tools and check for errors

## Production Deployment

### Email Configuration for Production

For Gmail (2-factor authentication required):
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

For other SMTP services:
```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-password
```

### Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use environment variables for all sensitive data
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up proper email service (not console logging)
- [ ] Configure database backups
- [ ] Set up monitoring and logging

## Data Migration

If you have existing users and want to add phone numbers later:

```sql
-- Add phone numbers to existing users manually
UPDATE users SET phone = '+36 30 123 4567' WHERE email = 'user@example.com';
```

## Support

Check the main `REGISTRATION-SYSTEM-README.md` for detailed API documentation and features.

