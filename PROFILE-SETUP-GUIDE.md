# Quick Setup Guide: Profile System

## 🚀 Quick Start (3 Steps)

### Step 1: Apply Database Migration

Run this command in your terminal:

```bash
psql -U postgres -d fishing_competition -f "database/add-profile-fields.sql"
```

Or if using a different database user:

```bash
psql -U your_username -d fishing_competition -f "database/add-profile-fields.sql"
```

### Step 2: Restart Server

The uploads directory will be created automatically on first upload.

```bash
npm run dev
```

### Step 3: Test the Flow

1. Go to `http://localhost:4200`
2. Click "Sign up" or "Login"
3. Register a new user
4. You'll be automatically redirected to the profile completion page
5. Upload a photo (optional)
6. Fill in address details
7. Click "Profil Mentése"
8. You'll be redirected to competitions page

## ✅ What Was Added

### Backend
- ✅ Photo upload endpoint (`POST /api/auth/profile/photo`)
- ✅ Photo delete endpoint (`DELETE /api/auth/profile/photo`)
- ✅ Extended profile endpoint with new fields
- ✅ File upload handling with Multer
- ✅ Automatic file cleanup

### Database
- ✅ `street_address`, `city`, `postal_code`, `country` columns
- ✅ `photo_url` column
- ✅ `profile_completed` boolean flag

### Frontend
- ✅ Profile completion component (`/profile/complete`)
- ✅ Photo upload with preview
- ✅ Address form fields
- ✅ Responsive design
- ✅ Automatic redirect after registration

## 📝 User Experience

### After Registration:
```
1. User registers → 
2. Redirected to /profile/complete → 
3. Fills in profile (photo + address) → 
4. Clicks "Profil Mentése" → 
5. Redirected to /competitions
```

### Can Skip:
- Users can click "Kihagyás egyelőre" to skip profile completion
- They can complete it later
- Profile marked as incomplete until they fill it

### Admin Users:
- Admins bypass profile completion
- Go directly to competitions after login
- Don't need to fill profile

## 🔍 Testing Checklist

- [ ] Database migration applied successfully
- [ ] Server starts without errors
- [ ] Can register new user
- [ ] Redirected to profile completion page
- [ ] Can upload photo (shows preview)
- [ ] Can remove photo
- [ ] Can fill in address fields
- [ ] Validation works (required fields)
- [ ] Can save profile
- [ ] Redirected to competitions after save
- [ ] Photos accessible at `http://localhost:3001/uploads/profiles/`

## 🐛 Common Issues

### Issue: "uploads directory not found"
**Solution**: The directory is created automatically. Just try uploading a photo.

### Issue: Photo upload fails
**Solutions**:
- Check file is under 5MB
- Ensure file is image format (JPEG, PNG, GIF, WEBP)
- Check server has write permissions

### Issue: Not redirected after registration
**Solution**: 
- Clear browser cache
- Check browser console for errors
- Ensure you're registering a new user (not admin)

## 📦 Files Created/Modified

### New Files:
```
database/add-profile-fields.sql
server/config/upload.js
client/src/app/components/profile-completion/
  ├── profile-completion.component.ts
  ├── profile-completion.component.html
  └── profile-completion.component.scss
PROFILE-SYSTEM-README.md
PROFILE-SETUP-GUIDE.md
```

### Modified Files:
```
server/index.js (added static file serving)
server/routes/auth.js (added photo endpoints)
client/src/app/app.routes.ts (added profile route)
client/src/app/services/auth.service.ts (extended User interface)
client/src/app/components/homepage/homepage.ts (added redirect logic)
```

## 🎯 Next Steps

After testing:
1. Customize the profile fields as needed
2. Add profile viewing for other users (optional)
3. Add profile editing page (currently only completion)
4. Consider adding more profile fields:
   - Years of fishing experience
   - Favorite fishing techniques
   - Bio/description
   - Social media links

## 🔒 Security Notes

- All uploads are authenticated (JWT required)
- File types are validated server-side
- File sizes are limited to 5MB
- Old files are automatically deleted
- Filenames are generated securely

## 📸 Photo Specifications

- **Max Size**: 5MB
- **Formats**: JPEG, JPG, PNG, GIF, WEBP
- **Storage**: `/uploads/profiles/`
- **Naming**: `user-{id}-{timestamp}.{ext}`
- **Access**: `http://localhost:3001/uploads/profiles/{filename}`

## ✨ Features Summary

**Profile Completion Page Includes:**
- ✅ Photo upload with preview
- ✅ Drag & drop support (HTML5)
- ✅ Phone number field
- ✅ Street address (required)
- ✅ City (required)
- ✅ Postal code (required)
- ✅ Country (required, defaults to "Hungary")
- ✅ Skip option
- ✅ Beautiful gradient design
- ✅ Mobile responsive

**Workflow:**
```
Registration → Profile Completion → Competitions
     ↓              ↓                    ↓
  Creates        Optional            Can now
   User          Photo +          participate
                 Address
```

---

**Status**: ✅ Ready to Use
**Last Updated**: October 1, 2025

