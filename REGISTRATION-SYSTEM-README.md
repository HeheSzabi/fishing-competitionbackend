# Fishing Competition Registration System

## Overview

This fishing competition management system now includes a comprehensive user registration feature that allows fishermen to sign up for competitions and receive email confirmations.

## Features

### 1. User Profile System
- **Contact Information**: Users can provide their phone number during registration (optional)
- **Fisherman Profiles**: All registered users are considered fishermen
- **Profile Management**: Users can update their contact information

### 2. Competition Registration
- **Easy Sign-Up**: Fishermen can register for competitions with a single click using the "Feliratkozok a versenyre" button
- **Email Confirmations**: Automatic email sent upon registration
- **Withdrawal Option**: Users can withdraw from competitions at any time
- **Withdrawal Confirmation**: Email notification sent when withdrawing

### 3. Registration Features
- View registration status on competition cards
- Real-time updates via WebSocket
- Registration statistics tracking
- User can see all their registered competitions

## Database Schema

### New Tables

#### `competition_registrations`
Tracks which users have registered for which competitions.

```sql
- id: UUID (Primary Key)
- user_id: INTEGER (References users table)
- competition_id: UUID (References competitions table)
- status: VARCHAR (registered, withdrawn, confirmed)
- registration_date: TIMESTAMP
- withdrawal_date: TIMESTAMP (optional)
- notes: TEXT (optional)
```

#### Updated `users` table
```sql
- phone: VARCHAR(20) - Optional phone number for contact
```

## Setup Instructions

### 1. Database Setup

Run the new schema migration:

```bash
psql -U postgres -d fishing_competition -f database/user-profile-registration-schema.sql
```

### 2. Email Configuration

#### Development Mode (Console Logging)
By default, the system logs emails to the console. No configuration needed.

#### Production Mode (Real Email Service)

Add the following to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Fishing Competition <noreply@fishingcompetition.com>"

# OR use custom SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password

# Client URL for email links
CLIENT_URL=http://localhost:4200
```

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use that App Password in `EMAIL_PASSWORD`

### 3. Install Dependencies

```bash
npm install
```

The `nodemailer` package has been added for email functionality.

## API Endpoints

### Registration Endpoints

#### Register for Competition
```
POST /api/registrations/register
Headers: Authorization: Bearer <token>
Body: { "competitionId": "<uuid>" }
```

#### Withdraw from Competition
```
POST /api/registrations/withdraw
Headers: Authorization: Bearer <token>
Body: { "competitionId": "<uuid>" }
```

#### Check Registration Status
```
GET /api/registrations/check/:competitionId
Headers: Authorization: Bearer <token>
```

#### Get User's Registrations
```
GET /api/registrations/user/:userId
Headers: Authorization: Bearer <token>
```

#### Get Competition Registrations
```
GET /api/registrations/competition/:competitionId
```

#### Get Registration Statistics
```
GET /api/registrations/stats/:competitionId
```

### Updated Auth Endpoints

#### Register (with phone)
```
POST /api/auth/register
Body: {
  "firstName": "János",
  "lastName": "Kovács",
  "email": "janos@example.com",
  "password": "secure123",
  "phone": "+36 30 123 4567" // Optional
}
```

#### Update Profile (with phone)
```
PUT /api/auth/profile
Headers: Authorization: Bearer <token>
Body: {
  "firstName": "János",
  "lastName": "Kovács",
  "email": "janos@example.com",
  "phone": "+36 30 123 4567"
}
```

## Frontend Components

### Registration Service
Located at: `client/src/app/services/registration.service.ts`

Provides methods for:
- Registering for competitions
- Withdrawing from competitions
- Checking registration status
- Getting registration statistics

### Updated Components

#### Competition List Component
- Shows "Feliratkozok a versenyre" button for non-registered users
- Shows "Visszalépés" button for registered users
- Real-time registration status updates

#### Competition Detail Component
- Registration/withdrawal buttons in header
- Shows current registration status
- Email confirmation notifications

#### Auth Modal Component
- Added optional phone number field
- Hungarian language support
- Improved validation

## Email Templates

### Registration Confirmation Email
- Welcome message
- Competition details (name, date, location)
- Link to competition page
- Instructions for managing registration

### Withdrawal Confirmation Email
- Confirmation of withdrawal
- Competition details
- Option to re-register

## User Flow

### For Fishermen

1. **Registration**
   - Create account with email, name, and optional phone
   - Browse available competitions
   - Click "Feliratkozok a versenyre" on desired competition
   - Receive email confirmation

2. **Managing Registrations**
   - View all registered competitions
   - Withdraw from competition if needed
   - Receive withdrawal confirmation email
   - Re-register if desired (before competition date)

3. **Competition Day**
   - Registered users are tracked in the system
   - Can participate in weigh-ins
   - Results are recorded

### For Administrators

1. **View Registrations**
   - See all registered fishermen for each competition
   - Access contact information (email, phone)
   - View registration statistics

2. **Manage Participants**
   - Assign registered users to sectors
   - Track participation
   - Manage competition flow

## Security

- JWT authentication required for all registration endpoints
- Users can only manage their own registrations (except admins)
- Email validation on registration
- Phone number format validation (optional field)
- SQL injection protection via parameterized queries

## Real-Time Features

- WebSocket events for registration updates
- Automatic UI updates when users register/withdraw
- Live registration count updates

## Testing

### Test Email Service (Development)

The system logs emails to the console in development mode. Check your server console to see email content.

### Test Registration Flow

1. Create a user account
2. Navigate to competitions page
3. Click "Feliratkozok a versenyre"
4. Check server console for email output
5. Verify registration status updates
6. Test withdrawal process

## Troubleshooting

### Email Not Sending

1. Check environment variables are set correctly
2. Verify SMTP credentials
3. Check console for error messages
4. Ensure firewall allows SMTP connections

### Registration Button Not Showing

1. Verify user is authenticated
2. Check user role (should not be admin)
3. Ensure competition data is loaded
4. Check browser console for errors

### Database Errors

1. Ensure schema migration has been run
2. Check database connection settings
3. Verify user permissions on database

## Future Enhancements

- SMS notifications (using phone numbers)
- Registration limits per competition
- Waitlist functionality
- Payment integration for entry fees
- Registration QR codes
- Calendar integration (iCal export)
- Reminder emails before competition

## Support

For issues or questions, contact the development team or check the main README.md file.

