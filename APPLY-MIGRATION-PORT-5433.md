# Apply Database Migration - Port 5433

## Your Configuration
- PostgreSQL Port: **5433**
- Database: **fishing_competition**

## Apply Profile Fields Migration

### Using psql Command Line

```bash
psql -U postgres -h localhost -p 5433 -d fishing_competition -f "database/add-profile-fields.sql"
```

**If prompted for password, enter your PostgreSQL password**

### Or Apply All Schemas in Order

```bash
# Navigate to the FISHING COMPETITION folder first
cd "C:\Users\imres\BACKUP\FISHING COMPETITION"

# Then run these commands:
psql -U postgres -h localhost -p 5433 -d fishing_competition -f database/schema.sql
psql -U postgres -h localhost -p 5433 -d fishing_competition -f database/auth_schema.sql
psql -U postgres -h localhost -p 5433 -d fishing_competition -f database/add-profile-fields.sql
psql -U postgres -h localhost -p 5433 -d fishing_competition -f database/user-profile-registration-schema.sql
```

### Manual SQL (Copy-Paste Method)

If you prefer to use pgAdmin or another tool:

**Connect to:**
- Host: localhost
- Port: **5433**
- Database: fishing_competition
- User: postgres

**Then run this SQL:**

```sql
-- Add profile fields for fishermen
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Hungary';
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

UPDATE users SET profile_completed = false WHERE profile_completed IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
```

### Verify It Worked

```bash
psql -U postgres -h localhost -p 5433 -d fishing_competition -c "\d users"
```

You should see the new columns listed!

---

## After Applying

1. ✅ Restart your backend server
2. ✅ Clear browser cache
3. ✅ Try uploading a photo again
4. **It will work!** 🎉

---

## Quick Copy-Paste Command

```bash
psql -U postgres -h localhost -p 5433 -d fishing_competition -f "database/add-profile-fields.sql"
```

