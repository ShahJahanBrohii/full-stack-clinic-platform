# Apex Clinic Backend API

Complete REST API for the Apex Clinic management system built with Express.js and MongoDB.

## Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB running on `mongodb://127.0.0.1:27017`

### Installation & Setup

```bash
# Install dependencies
npm install

# Configure environment (already set)
# .env file has: MONGO_URI, JWT_SECRET, PORT

# Create admin account (one-time)
node createAdmin.js

# Start server
npm start
```

Server runs on `http://localhost:5000`
API endpoint: `http://localhost:5000/api`

---

## API Endpoints Overview

### Authentication (`/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new patient |
| POST | `/login` | ❌ | Login and get JWT |
| GET | `/me` | ✅ | Get current user |
| PUT | `/profile` | ✅ | Update name/phone |
| PUT | `/password` | ✅ | Change password |
| POST | `/logout` | ✅ | Logout (optional) |

**Example: Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+92300123456"
  }'
```

**Response:**
```json
{
  "message": "Registration successful!",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+92300123456",
    "role": "patient"
  }
}
```

### Services (`/services`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ❌ | Any | List all services |
| GET | `/:id` | ❌ | Any | Get service details |
| POST | `/` | ✅ | Admin | Create service |
| PUT | `/:id` | ✅ | Admin | Update service |
| DELETE | `/:id` | ✅ | Admin | Delete service |

**Available Time Slots (Bookings)**
```
09:00, 09:30, 10:00, 10:30, 11:00, 11:30,
12:00, 12:30, 14:00, 14:30, 15:00, 15:30,
16:00, 16:30, 17:00, 17:30 (30-min intervals)
```

### Bookings (`/bookings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/my` | ✅ | Get user's bookings |
| GET | `/:id` | ✅ | Get booking details |
| GET | `/slots?serviceId=X&date=Y` | ❌ | Available slots |
| POST | `/` | ✅ | Create booking |
| PATCH | `/:id/cancel` | ✅ | Cancel booking |
| POST | `/:id/payment` | ✅ | Confirm payment |

**Create Booking Example**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "serviceId": "...",
    "date": "2026-04-15",
    "timeSlot": "10:00",
    "notes": "First visit",
    "paymentMethod": "card"
  }'
```

### Videos (`/videos`)
| Method | Endpoint | Auth | Query Params | Role | Description |
|--------|----------|------|--------------|------|-------------|
| GET | `/` | ❌ | category, search, difficulty | Any | List videos |
| GET | `/:id` | ❌ | - | Any | Get video (increments views) |
| GET | `/categories` | ❌ | - | Any | Get categories list |
| POST | `/` | ✅ | - | Admin | Create video |
| PUT | `/:id` | ✅ | - | Admin | Update video |
| DELETE | `/:id` | ✅ | - | Admin | Delete video |

**Get Videos with Filter**
```bash
curl "http://localhost:5000/api/videos?category=Warm-up&difficulty=beginner"
```

### Admin: Patients (`/admin/patients`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/patients` | ✅ Admin | List all patients |
| GET | `/patients/:id` | ✅ Admin | Get patient + bookings |
| PUT | `/patients/:id` | ✅ Admin | Update patient |
| DELETE | `/patients/:id` | ✅ Admin | Deactivate patient |

### Admin: Bookings (`/admin/bookings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bookings` | ✅ Admin | List all bookings |
| PATCH | `/bookings/:id/status` | ✅ Admin | Update booking status |

**Status Values:** `pending`, `confirmed`, `completed`, `cancelled`

### Admin: Analytics (`/admin/analytics`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/dashboard` | ✅ Admin | Dashboard stats |

**Response includes:**
- Total patients, services, bookings, revenue
- Bookings breakdown by status
- Monthly booking trends
- Top 5 booked services

### Admin: Settings (`/admin/settings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/settings` | ✅ Admin | Get system settings |
| PUT | `/settings` | ✅ Admin | Update settings |

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

Token obtained from `/auth/login` or `/auth/register` response.
Token stored in frontend localStorage as `apex_token`.
Token valid for 7 days.

---

## Booking Status Workflow

```
pending → confirmed → completed
         ↓
       cancelled
```

- **pending**: Just created, awaiting payment confirmation
- **confirmed**: Payment done, appointment confirmed
- **completed**: Appointment done
- **cancelled**: Cancelled by patient or admin

---

## Data Models

### User
- `name` (String, required)
- `email` (String, unique, required)
- `password` (String, hashed)
- `phone` (String, optional)
- `role` (enum: patient, admin)
- `isActive` (Boolean, default: true)
- `createdAt`, `updatedAt` (timestamps)

### Service
- `name`, `description` (String)
- `price` (Number, min 0)
- `duration` (Number, minutes, min 15)
- `category` (String)
- `isActive` (Boolean)
- `createdAt`, `updatedAt`

### Booking
- `patientId` (ref: User)
- `serviceId` (ref: Service)
- `date` (Date)
- `timeSlot` (String, 30-min intervals)
- `status` (pending/confirmed/completed/cancelled)
- `paymentStatus` (pending/completed/failed)
- `paymentMethod` (card/cash/online)
- `notes` (String)
- `createdAt`, `updatedAt`

### Video
- `title`, `description` (String)
- `category` (String)
- `videoUrl` (String)
- `thumbnailUrl` (String, optional)
- `duration` (Number, seconds)
- `difficulty` (beginner/intermediate/advanced)
- `views` (Number, auto-incremented)
- `isActive` (Boolean)
- `createdAt`, `updatedAt`

---

## Environment Variables

```
MONGO_URI=mongodb://127.0.0.1:27017/clinic
JWT_SECRET=shahjahanbrohi
PORT=5000
```

---

## Default Admin Account

```
Email: admin@apexclinic.pk
Password: admin12345
```

---

## Error Handling

All errors follow consistent format:
```json
{
  "message": "Error description"
}
```

**Status Codes:**
- `200` — Success
- `201` — Created
- `400` — Bad request (validation error)
- `401` — Unauthorized (no token/invalid token)
- `403` — Forbidden (insufficient role)
- `404` — Not found
- `500` — Server error

---

## File Structure

```
backend/
├── server.js           — Main server file
├── .env               — Environment variables
├── createAdmin.js     — Bootstrap admin script
├── package.json       — Dependencies
│
├── models/
│   ├── User.js        — User schema
│   ├── Service.js     — Service schema
│   ├── Booking.js     — Booking schema
│   └── Video.js       — Video schema
│
├── routes/
│   ├── authRoutes.js   — Auth endpoints
│   ├── bookingRoutes.js — Booking endpoints
│   ├── serviceRoutes.js — Service CRUD (public + admin)
│   ├── videoRoutes.js  — Video CRUD (public + admin)
│   └── adminRoutes.js  — Admin dashboard endpoints
│
└── middleware/
    └── auth.js        — JWT & admin middleware
```

---

## Next Steps / Deployment

1. **Production Checklist:**
   - Change JWT_SECRET to something strong
   - Update MONGO_URI for production database
   - Enable HTTPS
   - Add rate limiting
   - Add logging
   - Add request validation

2. **Optional Enhancements:**
   - Email notifications for bookings
   - SMS reminders
   - Advanced analytics
   - Payment gateway integration
   - File uploads (documents, videos)
   - Two-factor authentication

---

## Support

For issues or questions, contact: admin@apexclinic.pk
