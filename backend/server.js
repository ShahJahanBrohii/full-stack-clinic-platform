const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler } = require('./utils/errors');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { initializeReminderScheduler } = require('./utils/reminderScheduler');

dotenv.config();

const app = express();

const normalizeOrigin = (origin) => (origin || '').trim().replace(/\/+$/, '');
const isLocalDevOrigin = (origin) => {
  const value = normalizeOrigin(origin).toLowerCase();
  return value.includes('://localhost') || value.includes('://127.0.0.1');
};

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const localDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const allowedOrigins = [...new Set([...configuredOrigins, ...localDevOrigins])];

// ── MIDDLEWARE ─────────────────────────────────────────────────────────────
const corsOptions = process.env.NODE_ENV === 'production'
  ? {
      origin: (origin, callback) => {
        // Allow requests with no Origin header (like server-to-server or curl)
        if (!origin) return callback(null, true);

        // If no CORS origins are configured, allow all origins.
        if (allowedOrigins.length === 0) return callback(null, true);

        const normalizedOrigin = normalizeOrigin(origin);

        if (isLocalDevOrigin(normalizedOrigin) || allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
    }
  : {
      origin: true,
    };

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' })); // Allow payment proof image uploads
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Apply rate limiting
app.use('/api/', apiLimiter); // General API rate limit
app.use('/api/auth/login', authLimiter); // Strict limit on login
app.use('/api/auth/register', authLimiter); // Strict limit on registration

// ── DATABASE CONNECTION ────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// ── ROUTES ─────────────────────────────────────────────────────────────────

// Import route modules
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const videoRoutes = require('./routes/videoRoutes');
const videoProgressRoutes = require('./routes/videoProgressRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Mount routes with API prefix
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/video-progress', videoProgressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Backward-compatible aliases (for older clients configured without /api prefix)
app.use('/admin', adminRoutes);

// ── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  });
});

// ── ERROR HANDLING ──────────────────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Route not found.'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── START SERVER ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  // Initialize appointment reminder scheduler
  initializeReminderScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  🚀 Apex Clinic Server Ready                          ║
╠════════════════════════════════════════════════════════╣
║  Port: ${PORT}
║  Environment: ${process.env.NODE_ENV || 'development'}
║  API: http://localhost:${PORT}/api
║  Rate Limiting: Enabled
║  Validation: Enabled
╚════════════════════════════════════════════════════════╝
    `);
  });
};

startServer().catch((error) => {
  console.error('✗ Failed to start server:', error.message);
  process.exit(1);
});

module.exports = app;
