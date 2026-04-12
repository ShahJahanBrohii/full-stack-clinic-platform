# Clinic Platform

A clinic management web app for online patient bookings, payments, treatment videos, and video consultation sessions.

## Features

- Patient registration and login
- Online appointment booking
- Payment-ready booking flow
- Video library for exercises, treatments, and clinic updates
- Admin dashboard for managing patients, services, bookings, and videos
- Role-aware UI for patients and admins
- Responsive interface optimized for desktop and mobile

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT-based authentication
- Media and updates: video library and patient stories endpoints

## Project Structure

- `backend/` - API server, models, routes, middleware, and utilities
- `frontend/` - React application, pages, components, context, and services
- `README.md` - project overview and setup guide
- `SETUP.md` - additional setup notes
- `QUICKSTART.md` - quick start instructions

## Local Setup

### 1. Install dependencies

From the project root, install both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Create the required `.env` files for the backend and frontend. At minimum, configure the database connection, JWT secret, and email settings for production use.

### 3. Run the backend

```bash
cd backend
npm start
```

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

## Notes

- Do not commit `.env` files or other secrets.
- Build artifacts such as `dist/`, `coverage/`, and `node_modules/` should stay out of GitHub.
- The repo is intended to support real patient bookings, payments, and video-based engagement rather than demo-only mock data.

## Documentation

- [SETUP.md](SETUP.md)
- [QUICKSTART.md](QUICKSTART.md)
- [VIDEO_PROGRESS_FEATURE.md](VIDEO_PROGRESS_FEATURE.md)
- [VIDEO_PROGRESS_QUICK_START.md](VIDEO_PROGRESS_QUICK_START.md)
