# Environment Variables Setup Guide

## 1. Create .env file in server directory

Create a file named `.env` in the `server/` directory with the following content:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=fishing_competition
DB_PASSWORD=your_postgres_password_here
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 2. Update the values:

### Database Settings:
- `DB_PASSWORD`: Replace with your actual PostgreSQL password
- `DB_USER`: Usually 'postgres' (default)
- `DB_HOST`: Usually 'localhost' for local development
- `DB_NAME`: The name of your database (fishing_competition)

### JWT Settings:
- `JWT_SECRET`: Create a strong, random secret key (at least 32 characters)
- `JWT_EXPIRES_IN`: How long tokens are valid (7d = 7 days)

### Server Settings:
- `PORT`: The port your server runs on (3000)
- `NODE_ENV`: Set to 'development' for local development

## 3. Install dotenv package (if not already installed):

```bash
cd server
npm install dotenv
```

## 4. Make sure your server/index.js loads the .env file:

The file should already have:
```javascript
require('dotenv').config();
```

## 5. Create the PostgreSQL database:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create the database
CREATE DATABASE fishing_competition;

-- Create a user (optional, you can use postgres user)
CREATE USER fishing_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fishing_competition TO fishing_user;
```

## 6. Run the database schema:

```bash
psql -d fishing_competition -f database/auth_schema.sql
```

## 7. Test the setup:

```bash
cd server
npm start
```

You should see: "Server running on port 3000"
