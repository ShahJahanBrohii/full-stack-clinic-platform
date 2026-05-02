# Quick Start Guide - Apex Clinic

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js installed (v14+)
- MongoDB running locally

### Step 1: Start Backend
```bash
cd Clinic/backend
npm install
node createAdmin.js
npm start
```

If the admin login is already out of sync, run this instead to reset it:

```bash
node createAdmin.js --email=admin@apexclinic.pk --password=admin12345 --name="Shah Jahan Admin"
```

Expected output: `🚀 Server running on port 5000`

### Step 2: Start Frontend (New Terminal)
```bash
cd Clinic/frontend
npm install
npm run dev
```

Expected output: `Local: http://localhost:5173`

### Step 3: Access Application
- **Frontend:** http://localhost:5173
- **API:** http://localhost:5000/api

### Step 4: Login as Admin
```
Email: admin@apexclinic.pk
Password: admin12345
```

---

## 📚 Documentation

1. **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** — Complete summary of all improvements
2. **[SETUP.md](./SETUP.md)** — Full setup and deployment guide
3. **[backend/API.md](./backend/API.md)** — Complete API reference

---

## 🔧 Build Tools

| Command | Directory | Purpose |
|---------|-----------|---------|
| `npm install` | frontend/ or backend/ | Install dependencies |
| `npm start` | backend/ | Start backend server |
| `npm run dev` | frontend/ | Start frontend dev server |
| `npm run build` | frontend/ | Build for production |
| `npm run lint` | frontend/ | Run ESLint |

---

## 📱 What You Can Do

### As a Patient
- Register and create account
- View available services
- Book appointments with time slots
- Pay for appointments
- View booking history
- Watch exercise videos
- Update profile

### As an Admin
- Manage services (create, edit, delete)
- Manage patients (view, update, deactivate)
- View and update bookings
- Upload and manage videos
- View detailed analytics
- Configure clinic settings

---

## 🛠️ Project Structure

```
Clinic/
├── frontend/          React + Vite app
│   └── src/
├── backend/          Express API
│   ├── routes/       37 endpoints
│   ├── models/       4 schemas
│   └── middleware/   Authentication
├── IMPROVEMENTS.md   Complete summary
├── SETUP.md         Deployment guide
└── API.md (backend) API reference
```

---

## 📊 What Was Built

- ✅ 37 API endpoints
- ✅ 4 database models (User, Service, Booking, Video)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Complete admin dashboard
- ✅ Booking system with time slots
- ✅ Payment tracking
- ✅ Analytics dashboard
- ✅ Error handling & validation

---

## 🔑 Default Credentials

```
Admin Account:
Email: admin@apexclinic.pk
Password: admin12345
```

After login, you'll access the admin dashboard at `/admin`

---

## 📖 API Overview

**37 Total Endpoints:**
- 6 Auth endpoints (register, login, profile, password)
- 5 Service endpoints (CRUD)
- 6 Booking endpoints (manage appointments)
- 7 Video endpoints (CRUD)
- 13 Admin endpoints (patients, bookings, analytics, settings)
- 5 System endpoints (health check, error handlers)

All documented in [backend/API.md](./backend/API.md)

---

## 🚨 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongosh`
- Check port 5000 is free: `netstat -ano | findstr :5000`

### Frontend can't connect to API
- Ensure backend is running
- Check `.env` has: `VITE_API_URL=http://localhost:5000/api`

### Database issues
- Reset with: `mongosh > use clinic > db.dropDatabase()`
- Recreate admin: `node createAdmin.js`

See [SETUP.md](./SETUP.md) for detailed troubleshooting.

---

## 📝 Next Steps

1. ✅ Test application with provided credentials
2. ✅ Create services from admin panel
3. ✅ Register as patient and make bookings
4. ✅ View admin analytics
5. 📋 Read full documentation
6. 🚀 Deploy to production

---

For complete documentation, see:
- **Development:** [SETUP.md](./SETUP.md)
- **API Routes:** [backend/API.md](./backend/API.md)
- **Full Summary:** [IMPROVEMENTS.md](./IMPROVEMENTS.md)

**Ready to run!** 🎉
