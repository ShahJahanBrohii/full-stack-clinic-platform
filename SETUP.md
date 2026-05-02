# Apex Clinic - Full Stack Setup Guide

Complete setup instructions for the Apex Clinic Management System (Frontend + Backend + Database).

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  React Frontend (Vite)                  Express Backend        │
│  ├── Authentication                    ├── Auth Routes         │
│  ├── Patient Dashboard                 ├── Booking API         │
│  ├── Admin Dashboard                   ├── Service API         │
│  └── Service/Video Booking             ├── Video API           │
│                                        └── Admin Routes        │
│         ↓ HTTP/REST (JWT Auth) ↓                               │
│                                                                 │
│                  MongoDB Database                              │
│            (clinic collection)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### System Requirements
- **Node.js:** v14 or higher (download from nodejs.org)
- **MongoDB:** Community Edition (running locally on port 27017)
- **npm:** Comes with Node.js

### Installation Steps

#### 1. Install Node.js
- Download from: https://nodejs.org/ (LTS recommended)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

#### 2. Install MongoDB
- Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
  - Or use MongoDB Community Edition installer
- Verify MongoDB is running:
  ```bash
  mongosh
  > exit
  ```

---

## Project Structure

```
Clinic/
├── frontend/              ← React Vite application
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env              ← Configure VITE_API_URL
│
├── backend/              ← Express.js API server
│   ├── routes/           ← API endpoints
│   ├── models/           ← MongoDB schemas
│   ├── middleware/       ← Auth middleware
│   ├── server.js         ← Main server file
│   ├── package.json
│   ├── .env              ← Configure DB & JWT
│   └── API.md            ← API documentation
│
└── README.md             ← This file
```

---

## Setup Instructions

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd Clinic/backend

# Install dependencies
npm install

# The .env file is already configured with:
# - MONGO_URI=mongodb://127.0.0.1:27017/clinic
# - JWT_SECRET=shahjahanbrohi
# - PORT=5000

# Create or reset admin account (run again any time)
node createAdmin.js --email=admin@apexclinic.pk --password=admin12345 --name="Shah Jahan Admin"

# Start the backend server
npm
```

**Expected Output:**
```
MongoDB connected successfully!
🚀 Server running on port 5000
📝 API available at http://localhost:5000/api
```

### Step 2: Frontend Setup

```bash
# In a NEW terminal, navigate to frontend directory
cd Clinic/frontend

# Install dependencies
npm install

# The .env file is already configured with:
# - VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v7.3.1  ready in 100 ms

  ➜  Local:   http://localhost:5173/
```

### Step 3: Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

---

## First Time Usage

### 1. Create Admin Account

The admin account is created during backend setup and can be reset later with the same command:

```
Email: admin@apexclinic.pk
Password: admin12345
```

If the login keeps failing, rerun:

```bash
node createAdmin.js --email=admin@apexclinic.pk --password=admin12345 --name="Shah Jahan Admin"
```

### 2. Login as Admin

1. Go to http://localhost:5173
2. Click "Login"
3. Enter admin credentials
4. You'll be redirected to admin dashboard at `/admin`

### 3. Admin Dashboard Features

From the admin panel, you can:
- **Patients:** View all patients, manage accounts
- **Bookings:** View and manage all bookings
- **Services:** Create and manage clinic services
- **Videos:** Upload and manage exercise videos
- **Analytics:** View dashboard statistics and trends
- **Settings:** Configure clinic information

### 4. Create Test Services

Add some services for testing bookings:

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin-token}" \
  -d '{
    "name": "Physiotherapy Session",
    "description": "One-on-one physical therapy session",
    "price": 2000,
    "duration": 60,
    "category": "Physical Therapy"
  }'
```

### 5. Register as Patient

1. Go to http://localhost:5173
2. Click "Register"
3. Fill in patient information
4. Access patient dashboard
5. Try booking a service

---

## Development Workflow

### Running Both Servers

Keep two terminal windows open:

**Terminal 1 - Backend:**
```bash
cd Clinic/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd Clinic/frontend
npm run dev
```

### Making Changes

**Backend Changes:**
- Edit files in `backend/routes/`, `backend/models/`, etc.
- Server auto-restarts when you save (if using nodemon)
- Otherwise, restart with `Ctrl+C` then `npm start`

**Frontend Changes:**
- Edit files in `frontend/src/`
- Vite provides hot module replacement (HMR)
- Changes appear instantly in browser

---

## Database Management

### View Database with MongoDB Compass

1. Download: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://127.0.0.1:27017/clinic`
3. Browse collections: users, services, bookings, videos

### Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh

# Show databases
show dbs

# Use clinic database
use clinic

# Show collections
show collections

# View users
db.users.find()

# View services
db.services.find()

# Count documents
db.users.count()

# Exit
exit
```

### Reset Database

```bash
mongosh
use clinic
db.dropDatabase()
exit
```

Then recreate admin:
```bash
cd Clinic/backend
node createAdmin.js
```

---

## API Testing

### Using cURL (Command Line)

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Using Postman

1. Download: https://www.postman.com/downloads/
2. Import API endpoints
3. Set Authorization header: `Bearer {token}`
4. Test endpoints

**Quick Import:**
1. New → REST Client
2. Set base URL: `http://localhost:5000/api`
3. Create requests for each endpoint

---

## Troubleshooting

### Backend Issues

**"MongoDB connection failed"**
- Ensure MongoDB is running: `mongosh`
- Check connection string in `.env`
- Default: `mongodb://127.0.0.1:27017/clinic`

**"Port 5000 already in use"**
- Kill process: `netstat -ano | findstr :5000`
- Or change PORT in `.env`

**"Module not found" errors**
- Run: `npm install`
- Delete `node_modules` and `package-lock.json`, then reinstall

### Frontend Issues

**"API connection refused"**
- Ensure backend is running: `npm start` in backend directory
- Check `VITE_API_URL` in frontend `.env`
- Default: `http://localhost:5000/api`

**"Blank page or errors"**
- Open browser console: F12
- Check for error messages
- Ensure backend is responding: `http://localhost:5000/api/health`

**Port 5173 already in use**
- Vite will use next available port automatically
- Or kill process: `netstat -ano | findstr :5173`

---

## Production Deployment

### Before Deploying:

1. **Security:**
   - Change `JWT_SECRET` in `.env` to something strong
   - Use environment variables for sensitive data
   - Enable HTTPS

2. **Database:**
   - Migrate to MongoDB Atlas (cloud) or managed service
   - Set `MONGO_URI` to production database
   - Enable authentication on MongoDB

3. **Frontend:**
   - Build: `npm run build`
   - Deploy to Vercel, Netlify, or your server
   - Update `VITE_API_URL` to production API URL

4. **Backend:**
   - Deploy to Heroku, Render, AWS, or your server
   - Use process manager (PM2) for Node.js
   - Set up logging and monitoring

### Example PM2 Setup (Development/Production):

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "clinic-api"

# View logs
pm2 logs clinic-api

# Restart
pm2 restart clinic-api

# Stop
pm2 stop clinic-api
```

---

## File Modifications Made

### Backend
- ✅ Created 4 new models (Service, Booking, Video, updated User)
- ✅ Created authentication middleware
- ✅ Completed auth routes with login, register, profile management
- ✅ Built complete booking system with time slots
- ✅ Created service CRUD endpoints
- ✅ Created video management endpoints
- ✅ Built admin dashboard routes (patients, bookings, analytics)
- ✅ Created main server.js file
- ✅ Added comprehensive error handling

### Frontend
- ✅ Created `.env` with API URL configuration

### Configuration
- ✅ Updated backend `package.json` with proper scripts
- ✅ Fixed `.env` format in backend
- ✅ Added API documentation

---

## Quick Commands Reference

| Command | Directory | Purpose |
|---------|-----------|---------|
| `npm install` | backend/ or frontend/ | Install dependencies |
| `npm start` | backend/ | Start backend server |
| `npm run dev` | frontend/ | Start frontend dev server |
| `npm run build` | frontend/ | Build frontend for production |
| `node createAdmin.js` | backend/ | Create admin account |
| `npm run lint` | frontend/ | Run linter |

---

## Next Steps

1. **Test the Application:**
   - Register as patient
   - Create services (as admin)
   - Create bookings
   - View admin dashboard

2. **Customize:**
   - Update clinic name/info in admin settings
   - Add custom services
   - Upload videos
   - Customize styling (update Tailwind colors)

3. **Development:**
   - Add more features per requirements
   - Implement payment gateway
   - Add email notifications
   - Deploy to production

---

## Support & Documentation

- **API Docs:** See [backend/API.md](./backend/API.md)
- **Database Schema:** See models in `backend/models/`
- **Frontend Code:** See `frontend/src/`
- **Frontend API Integration:** See `frontend/src/services/api.js`

---

## License

ISC License - Apex Clinic Management System

---

**Last Updated:** March 27, 2026
