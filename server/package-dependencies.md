# Required Dependencies for Authentication

Add these dependencies to your server package.json:

```bash
npm install bcryptjs jsonwebtoken crypto
```

Or add to package.json:
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  }
}
```

## Environment Variables

Create a `.env` file in the server directory:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=fishing_competition
DB_PASSWORD=your_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
```

## Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE fishing_competition;
```

2. Run the auth schema:
```bash
psql -d fishing_competition -f database/auth_schema.sql
```
