# Fisherman Profile System

## Overview

After registering, users are now prompted to complete their fisherman profile with additional information including photo upload, phone number, and address details.

## Features Implemented

### ✅ 1. Extended User Profile
- **Profile Photo**: Upload and manage profile pictures (max 5MB)
- **Contact Information**: Phone number and email
- **Physical Address**: Street address, city, postal code, country
- **Profile Completion Tracking**: System tracks if profile is completed

### ✅ 2. Photo Upload System
- **File Upload**: Supports JPEG, PNG, GIF, WEBP formats
- **File Size Limit**: Maximum 5MB per image
- **Preview**: Real-time preview before upload
- **Replace/Delete**: Users can change or remove their photos
- **Automatic Cleanup**: Old photos are automatically deleted when replaced

### ✅ 3. Profile Completion Flow
- **Post-Registration**: Users redirected to profile completion after signup
- **Optional Skip**: Users can skip and complete later
- **Admin Bypass**: Admin users don't need to complete profiles
- **Persistent Storage**: All data saved to database

### ✅ 4. Responsive Design
- Mobile-friendly interface
- Beautiful gradient design
- User-friendly form validation
- Clear error messages

## Database Schema Changes

### New Columns in `users` Table

```sql
-- Contact and Address Fields
street_address VARCHAR(255)
city VARCHAR(100)
postal_code VARCHAR(20)
country VARCHAR(100) DEFAULT 'Hungary'

-- Photo Storage
photo_url VARCHAR(500)

-- Profile Completion Tracking
profile_completed BOOLEAN DEFAULT false
```

## API Endpoints

### Profile Management

#### Get Profile
```
GET /api/auth/profile
Headers: Authorization: Bearer <token>

Response:
{
  "id": 1,
  "firstName": "János",
  "lastName": "Kovács",
  "email": "janos@example.com",
  "phone": "+36 30 123 4567",
  "streetAddress": "Fő utca 12",
  "city": "Budapest",
  "postalCode": "1011",
  "country": "Hungary",
  "photoUrl": "/uploads/profiles/user-1-1234567890.jpg",
  "profileCompleted": true,
  "role": "user",
  "createdAt": "2025-10-01T10:00:00.000Z"
}
```

#### Update Profile
```
PUT /api/auth/profile
Headers: Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "phone": "+36 30 123 4567",
  "streetAddress": "Fő utca 12",
  "city": "Budapest",
  "postalCode": "1011",
  "country": "Hungary",
  "profileCompleted": true
}
```

#### Upload Profile Photo
```
POST /api/auth/profile/photo
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- photo: <file>

Response:
{
  "message": "Photo uploaded successfully",
  "photoUrl": "/uploads/profiles/user-1-1234567890.jpg"
}
```

#### Delete Profile Photo
```
DELETE /api/auth/profile/photo
Headers: Authorization: Bearer <token>

Response:
{
  "message": "Photo deleted successfully"
}
```

## File Storage

### Upload Directory Structure
```
FISHING COMPETITION/
└── uploads/
    └── profiles/
        ├── user-1-1696156789000.jpg
        ├── user-2-1696156790000.png
        └── ...
```

### Naming Convention
Files are named using the pattern: `user-{userId}-{timestamp}.{extension}`

### Static File Serving
Photos are accessible at: `http://localhost:3001/uploads/profiles/{filename}`

## Setup Instructions

### 1. Apply Database Migration

```bash
psql -U postgres -d fishing_competition -f database/add-profile-fields.sql
```

### 2. Create Upload Directory

The directory is automatically created on first upload, but you can create it manually:

```bash
mkdir -p "uploads/profiles"
```

### 3. Install Dependencies

Already installed with multer:
```bash
npm install
```

### 4. Start the Server

```bash
npm run dev
```

## User Flow

### For New Users

1. **Register Account**
   - Fill in basic info (name, email, password)
   - Optional: Add phone number during registration

2. **Redirected to Profile Completion**
   - Upload profile photo (optional)
   - Add/confirm phone number
   - Fill in address details (required)
   - Click "Profil Mentése" to save

3. **Access Granted**
   - Redirected to competitions page
   - Can now register for competitions
   - Profile marked as completed

### For Existing Users

- Can access profile completion page at any time
- Link from user menu (can be added)
- All fields editable
- Photos can be updated or removed

## Frontend Components

### Profile Completion Component
- **Location**: `client/src/app/components/profile-completion/`
- **Route**: `/profile/complete`
- **Guard**: AuthGuard (requires authentication)

### Features
- Photo upload with drag & drop support
- Real-time preview of selected image
- Form validation with error messages
- Responsive design for mobile devices
- "Skip for now" option
- Loading indicators

## Security

### Authentication
- All profile endpoints require JWT authentication
- Users can only access/modify their own profiles
- Admin role check for privileged operations

### File Upload Security
- File type validation (images only)
- File size limits (5MB max)
- Secure filename generation
- Old files automatically cleaned up
- Files stored outside web root

### Input Validation
- Phone number format validation
- Required field validation
- SQL injection protection via parameterized queries
- XSS protection via Angular sanitization

## Configuration

### Environment Variables

Add to `.env` if needed:
```env
# File upload settings (defaults shown)
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH=uploads/profiles
```

### Allowed File Types

Currently accepts:
- JPEG/JPG
- PNG
- GIF
- WEBP

To add more types, edit `server/config/upload.js`:
```javascript
const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
```

## Testing

### Test Profile Creation

1. Register a new user
2. Upload a photo (max 5MB)
3. Fill in address details
4. Click save
5. Verify redirect to competitions page

### Test Photo Upload

```bash
# Using curl
curl -X POST http://localhost:3001/api/auth/profile/photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@path/to/image.jpg"
```

### Test Profile Update

```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+36301234567",
    "streetAddress": "Fő utca 12",
    "city": "Budapest",
    "postalCode": "1011",
    "country": "Hungary",
    "profileCompleted": true
  }'
```

## Troubleshooting

### Photo Not Uploading

**Issue**: 413 Request Entity Too Large
**Solution**: Check file size is under 5MB

**Issue**: 400 Bad Request - Invalid file type
**Solution**: Ensure file is JPEG, PNG, GIF, or WEBP

**Issue**: Photo not displaying
**Solution**: 
- Check uploads directory exists
- Verify static file serving is enabled in server
- Check file permissions

### Profile Not Saving

**Issue**: Validation errors
**Solution**: Ensure all required fields are filled:
- Street Address
- City  
- Postal Code
- Country

**Issue**: Unauthorized error
**Solution**: Ensure user is logged in and JWT token is valid

### Redirect Not Working

**Issue**: Not redirected after registration
**Solution**: Clear browser cache and ensure homepage component is updated

## Production Considerations

### File Storage

For production, consider:
1. **Cloud Storage**: AWS S3, Google Cloud Storage, Azure Blob
2. **CDN**: Serve images through CDN for better performance
3. **Image Optimization**: Resize/compress images on upload
4. **Backup Strategy**: Regular backups of uploads directory

### Performance

- Add image compression on upload
- Implement lazy loading for photos
- Use image thumbnails for lists
- Cache user profiles

### Security Enhancements

- Implement virus scanning for uploads
- Add rate limiting for uploads
- Use signed URLs for private photos
- Implement CSRF protection

## Future Enhancements

- [ ] Image cropping tool
- [ ] Multiple photo upload
- [ ] Photo gallery for fishermen
- [ ] Social media integration
- [ ] Profile visibility settings
- [ ] Profile badges/achievements
- [ ] QR code for profile sharing

## Summary

The profile system is now fully functional with:
- ✅ Photo upload and management
- ✅ Address and contact information
- ✅ Profile completion tracking
- ✅ Automatic redirection flow
- ✅ Mobile-responsive design
- ✅ Secure file handling

Users will be prompted to complete their profiles after registration, creating a rich fisherman database for the competition system!

