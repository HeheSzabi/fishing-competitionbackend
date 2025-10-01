# How to Start Both Servers

## Quick Start Guide

You need TWO terminal windows running simultaneously:

### Terminal 1: Backend Server
```bash
cd "C:\Users\imres\BACKUP\FISHING COMPETITION"
npm run dev
```

**Expected output:**
```
Server running on port 3000
```

### Terminal 2: Frontend Server
```bash
cd "C:\Users\imres\BACKUP\FISHING COMPETITION\client"
ng serve
```

**Expected output:**
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200 **
```

## Troubleshooting

### Backend won't start?
Check if port 3000 is already in use:
```bash
# Windows PowerShell
netstat -ano | findstr :3000

# If something is using it, kill the process or use a different port
```

### Frontend won't start?
Check if port 4200 is already in use:
```bash
# Windows PowerShell
netstat -ano | findstr :4200
```

### "Connection Refused" Error?
This means the backend is NOT running. Make sure Terminal 1 shows "Server running on port 3000"

## Access the Application

Once BOTH servers are running:
- Open browser: `http://localhost:4200`
- Backend API: `http://localhost:3000/api/*`

## Current Status

**Backend**: Starting... (I just started it for you)
**Frontend**: You need to start this manually in a new terminal

---

**Remember**: Keep both terminal windows open while developing!

