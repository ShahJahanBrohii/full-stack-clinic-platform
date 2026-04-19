const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Video = require('../models/Video');
const ClinicSettings = require('../models/ClinicSettings');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

router.use(authMiddleware, adminMiddleware);

const MANUAL_PAYMENT_METHODS = ['jazzcash', 'easypaisa'];
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'under_review', 'completed', 'failed'];

function isManualPaymentMethod(paymentMethod) {
  return MANUAL_PAYMENT_METHODS.includes(String(paymentMethod || '').toLowerCase());
}

async function getClinicSettings() {
  const settings = await ClinicSettings.getSingleton();
  return settings;
}

function serializeClinicSettings(settings) {
  if (!settings) return settings;
  const plain = typeof settings.toObject === 'function' ? settings.toObject() : settings;
  delete plain.__v;
  return plain;
}

async function updateClinicSettings(patch) {
  const settings = await getClinicSettings();
  for (const [key, value] of Object.entries(patch || {})) {
    if (value !== undefined) {
      settings[key] = value;
    }
  }
  settings.updatedAt = new Date();
  await settings.save();
  return serializeClinicSettings(settings);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  try {
    const numeric = Number(
      typeof value === 'object' && value !== null && typeof value.toString === 'function'
        ? value.toString()
        : value
    );
    if (Number.isNaN(numeric)) return "";
    return `PKR ${numeric.toLocaleString('en-PK')}`;
  } catch {
    return "";
  }
}

function parseNumericValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return value;
  const parsed = Number(String(value).match(/\d+(?:\.\d+)?/)?.[0]);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseServiceDuration(value) {
  const parsed = parseNumericValue(value);
  return parsed ?? undefined;
}

function parseVideoDuration(value) {
  const parsed = parseNumericValue(value);
  if (parsed === undefined) return undefined;
  if (typeof value === "string" && value.toLowerCase().includes("sec")) {
    return parsed;
  }
  if (typeof value === "string" && value.toLowerCase().includes("min")) {
    return Math.round(parsed * 60);
  }
  return parsed > 60 ? parsed : Math.round(parsed * 60);
}

function formatService(service) {
  if (!service) return service;

  const rawDuration =
    service.duration === null || service.duration === undefined
      ? ''
      : String(service.duration);
  const duration =
    rawDuration && /min/i.test(rawDuration)
      ? rawDuration
      : rawDuration
        ? `${rawDuration} min`
        : '';

  return {
    _id: service._id,
    title: service.name,
    name: service.name,
    tagline: service.tagline ?? '',
    description: service.description,
    category: service.category,
    duration,
    price: formatMoney(service.price),
    features: service.features ?? [],
    published: service.isActive,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

function formatVideo(video) {
  if (!video) return video;

  return {
    _id: video._id,
    title: video.title,
    description: video.description,
    category: video.category,
    youtubeUrl: video.videoUrl,
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration ? `${Math.max(1, Math.round(video.duration / 60))} min` : '',
    durationSeconds: video.duration,
    difficulty: video.difficulty,
    tags: video.tags ?? '',
    views: video.views ?? 0,
    published: video.isActive,
    isActive: video.isActive,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}

function formatBooking(booking) {
  if (!booking) return booking;

  const patient = booking.patientId || {};
  const service = booking.serviceId || {};

  return {
    _id: booking._id,
    patientId: patient._id || booking.patientId,
    serviceId: service._id || booking.serviceId,
    patientName: patient.name || booking.patientName || '',
    patientEmail: patient.email || booking.patientEmail || '',
    patientPhone: patient.phone || '',
    serviceName: service.name || booking.serviceName || '',
    serviceCategory: service.category || booking.serviceCategory || '',
    date: booking.date,
    timeSlot: booking.timeSlot,
    status: booking.status,
    consultationType: booking.consultationType || 'in_person',
    sessionLink: booking.sessionLink || '',
    price: formatMoney(service.price ?? booking.price),
    paymentMethod: booking.paymentMethod || '',
    paymentStatus: booking.paymentStatus,
    paymentConfirmed: booking.paymentStatus === 'completed',
    paymentRequiresReview: booking.paymentStatus === 'under_review',
    paymentProofAvailable: Boolean(booking.paymentProofImage),
    paymentProofImage: booking.paymentProofImage || '',
    paymentProofSubmittedAt: booking.paymentProofSubmittedAt || null,
    paymentWalletNumber: booking.paymentWalletNumber || '',
    paymentReviewNote: booking.paymentReviewNote || '',
    paymentReviewedAt: booking.paymentReviewedAt || null,
    transactionId: booking.transactionId || '',
    notes: booking.notes || '',
    reminderSent: booking.reminderSent || false,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

function formatPatient(patient, stats = {}) {
  if (!patient) return patient;

  return {
    _id: patient._id,
    name: patient.name,
    email: patient.email,
    phone: patient.phone || '',
    condition: patient.condition || '',
    bio: patient.bio || '',
    status: patient.isActive ? 'active' : 'inactive',
    isActive: patient.isActive,
    joinDate: patient.createdAt,
    totalBookings: stats.totalBookings || 0,
    completedSessions: stats.completedSessions || 0,
  };
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfMonth(date = new Date()) {
  const value = new Date(date);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getDayRange(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function buildPatientStats(patientIds) {
  if (patientIds.length === 0) return {};

  const results = await Booking.aggregate([
    { $match: { patientId: { $in: patientIds } } },
    {
      $group: {
        _id: '$patientId',
        totalBookings: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
  ]);

  return results.reduce((accumulator, row) => {
    accumulator[row._id.toString()] = {
      totalBookings: row.totalBookings,
      completedSessions: row.completedSessions,
    };
    return accumulator;
  }, {});
}

async function buildAnalyticsSummary() {
  const today = startOfDay();
  const tomorrow = startOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const monthStart = startOfMonth();
  const nextMonth = new Date(monthStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const [
    totalPatients,
    newPatientsThisMonth,
    totalServices,
    totalBookings,
    completedSessions,
    cancelledBookings,
    pendingBookings,
    bookingsToday,
    completedRevenueBookings,
    monthlyRevenueBookings,
    bookingsByStatus,
    monthlyTrend,
    monthlyRevenueTrend,
    topServices,
  ] = await Promise.all([
    User.countDocuments({ role: 'patient', isActive: true }),
    User.countDocuments({ role: 'patient', createdAt: { $gte: monthStart, $lt: nextMonth } }),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    Booking.find({ paymentStatus: 'completed' }).populate('serviceId', 'price'),
    Booking.find({ paymentStatus: 'completed', date: { $gte: monthStart, $lt: nextMonth } }).populate('serviceId', 'price'),
    Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Booking.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service',
        },
      },
      {
        $addFields: {
          servicePrice: { $ifNull: [{ $arrayElemAt: ['$service.price', 0] }, 0] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          revenue: { $sum: '$servicePrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Booking.aggregate([
      {
        $group: {
          _id: '$serviceId',
          bookedCount: { $sum: 1 },
        },
      },
      { $sort: { bookedCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
    ]),
  ]);

  const totalRevenue = completedRevenueBookings.reduce((sum, booking) => {
    return sum + Number(booking.serviceId?.price || 0);
  }, 0);

  const revenueThisMonth = monthlyRevenueBookings.reduce((sum, booking) => {
    return sum + Number(booking.serviceId?.price || 0);
  }, 0);

  return {
    summary: {
      totalPatients,
      totalServices,
      totalBookings,
      totalRevenue,
      bookingsToday,
      pendingBookings,
      completedSessions,
      cancelledBookings,
      newPatientsThisMonth,
      revenueThisMonth,
    },
    bookingsByStatus,
    monthlyTrend,
    monthlyRevenueTrend,
    topServices: topServices.map((entry) => ({
      ...entry,
      service: entry.service?.[0] ? formatService(entry.service[0]) : null,
    })),
  };
}

async function updateServiceFromBody(service, body) {
  if (body.title || body.name) service.name = body.title || body.name;
  if (body.tagline !== undefined) service.tagline = body.tagline;
  if (body.description !== undefined) service.description = body.description;
  if (body.price !== undefined) service.price = parseNumericValue(body.price) ?? service.price;
  if (body.duration !== undefined) service.duration = parseServiceDuration(body.duration) ?? service.duration;
  if (body.category !== undefined) service.category = body.category;
  if (body.features !== undefined) {
    if (Array.isArray(body.features)) {
      service.features = body.features.filter(Boolean);
    } else if (typeof body.features === 'string') {
      service.features = body.features.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  if (body.published !== undefined) service.isActive = Boolean(body.published);
  if (body.isActive !== undefined) service.isActive = Boolean(body.isActive);
  service.updatedAt = new Date();
  await service.save();
  return service;
}

async function updateVideoFromBody(video, body) {
  if (body.title !== undefined) video.title = body.title;
  if (body.description !== undefined) video.description = body.description;
  if (body.category !== undefined) video.category = body.category;
  if (body.youtubeUrl !== undefined) video.videoUrl = body.youtubeUrl;
  if (body.videoUrl !== undefined) video.videoUrl = body.videoUrl;
  if (body.thumbnailUrl !== undefined) video.thumbnailUrl = body.thumbnailUrl;
  if (body.duration !== undefined) video.duration = parseVideoDuration(body.duration) ?? video.duration;
  if (body.difficulty !== undefined) video.difficulty = body.difficulty;
  if (body.tags !== undefined) video.tags = body.tags;
  if (body.published !== undefined) video.isActive = Boolean(body.published);
  if (body.isActive !== undefined) video.isActive = Boolean(body.isActive);
  video.updatedAt = new Date();
  await video.save();
  return video;
}

async function updateBookingFromBody(booking, body) {
  if (body.date !== undefined) booking.date = new Date(body.date);
  if (body.timeSlot !== undefined) booking.timeSlot = body.timeSlot;
  if (body.notes !== undefined) booking.notes = body.notes;
  if (body.status !== undefined) booking.status = body.status;
  if (body.consultationType !== undefined) booking.consultationType = body.consultationType;
  if (body.sessionLink !== undefined) booking.sessionLink = body.sessionLink;
  if (body.paymentMethod !== undefined) booking.paymentMethod = body.paymentMethod;
  if (body.paymentStatus !== undefined) booking.paymentStatus = body.paymentStatus;
  if (body.transactionId !== undefined) booking.transactionId = body.transactionId;
  if (body.paymentReviewNote !== undefined) booking.paymentReviewNote = body.paymentReviewNote;
  if (body.paymentProofImage !== undefined) booking.paymentProofImage = body.paymentProofImage;
  if (body.paymentWalletNumber !== undefined) booking.paymentWalletNumber = body.paymentWalletNumber;

  if (body.serviceId || body.serviceName || body.title) {
    const serviceName = body.serviceName || body.title;
    let service = null;

    if (body.serviceId && mongoose.Types.ObjectId.isValid(body.serviceId)) {
      service = await Service.findById(body.serviceId);
    } else if (serviceName) {
      service = await Service.findOne({ name: new RegExp(`^${serviceName}$`, 'i') });
    }

    if (service) {
      booking.serviceId = service._id;
    }
  }

  if (booking.patientId && (body.patientName || body.patientEmail || body.phone)) {
    const patient = await User.findById(booking.patientId);
    if (patient) {
      if (body.patientName !== undefined) patient.name = body.patientName;
      if (body.patientEmail !== undefined) patient.email = body.patientEmail.toLowerCase();
      if (body.phone !== undefined) patient.phone = body.phone;
      patient.updatedAt = new Date();
      await patient.save();
    }
  }

  booking.updatedAt = new Date();
  await booking.save();
  return booking;
}

// ── PATIENT MANAGEMENT ───────────────────────────────────────────────────────
router.get('/patients', async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = { role: 'patient' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { condition: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const patients = await User.find(query, '-password').sort({ createdAt: -1 });
    const statsByPatient = await buildPatientStats(patients.map((patient) => patient._id));

    res.json({
      patients: patients.map((patient) => formatPatient(patient, statsByPatient[patient._id.toString()] || {})),
      total: patients.length,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Error fetching patients.' });
  }
});

router.get('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid patient ID.' });
    }

    const patient = await User.findById(id, '-password');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const bookings = await Booking.find({ patientId: id })
      .populate('serviceId', 'name category price duration')
      .sort({ date: -1 });

    const stats = {
      totalBookings: bookings.length,
      completedSessions: bookings.filter((booking) => booking.status === 'completed').length,
    };

    res.json({
      patient: formatPatient(patient, stats),
      bookings: bookings.map(formatBooking),
      bookingCount: bookings.length,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Error fetching patient.' });
  }
});

router.get('/patients/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid patient ID.' });
    }

    const bookings = await Booking.find({ patientId: id })
      .populate('serviceId', 'name category price duration')
      .sort({ date: -1 });

    res.json({ bookings: bookings.map(formatBooking) });
  } catch (error) {
    console.error('Get patient bookings error:', error);
    res.status(500).json({ message: 'Error fetching patient bookings.' });
  }
});

router.put('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, condition, bio, isActive, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid patient ID.' });
    }

    const patient = await User.findById(id);

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    if (email && email.toLowerCase() !== patient.email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'User with this email already exists.' });
      }
      patient.email = email.toLowerCase();
    }

    if (name !== undefined) patient.name = name;
    if (phone !== undefined) patient.phone = phone;
    if (condition !== undefined) patient.condition = condition;
    if (bio !== undefined) patient.bio = bio;
    if (status !== undefined) patient.isActive = status === 'active';
    if (isActive !== undefined) patient.isActive = Boolean(isActive);
    patient.updatedAt = new Date();

    await patient.save();

    res.json({
      message: 'Patient updated successfully!',
      patient: formatPatient(patient),
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Error updating patient.' });
  }
});

router.delete('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid patient ID.' });
    }

    const patient = await User.findById(id);

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    patient.isActive = false;
    patient.updatedAt = new Date();
    await patient.save();

    res.json({ message: 'Patient deactivated successfully!' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Error deleting patient.' });
  }
});

// ── BOOKING MANAGEMENT ───────────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const { status, patientId, serviceId, limit, sort } = req.query;
    const query = {};

    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    if (serviceId) query.serviceId = serviceId;

    const sortOrder = sort === 'oldest' ? { date: 1 } : { date: -1 };
    let bookingQuery = Booking.find(query)
      .populate('patientId', 'name email phone')
      .populate('serviceId', 'name category price duration')
      .sort(sortOrder);

    if (limit !== undefined) {
      const numericLimit = Number(limit);
      if (!Number.isNaN(numericLimit) && numericLimit > 0) {
        bookingQuery = bookingQuery.limit(numericLimit);
      }
    }

    const bookings = await bookingQuery;
    const totalCount = await Booking.countDocuments(query);

    const stats = {
      pending: await Booking.countDocuments({ ...query, status: 'pending' }),
      confirmed: await Booking.countDocuments({ ...query, status: 'confirmed' }),
      completed: await Booking.countDocuments({ ...query, status: 'completed' }),
      cancelled: await Booking.countDocuments({ ...query, status: 'cancelled' }),
    };

    res.json({
      bookings: bookings.map(formatBooking),
      total: totalCount,
      stats,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Error fetching bookings.' });
  }
});

router.post('/bookings', async (req, res) => {
  try {
    const {
      patientId,
      serviceId,
      date,
      timeSlot,
      notes,
      status,
      paymentMethod,
      paymentStatus,
      consultationType,
      sessionLink,
      transactionId,
    } = req.body;

    if (!patientId || !serviceId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Patient, service, date, and time slot are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: 'Invalid patient or service ID.' });
    }

    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({ message: 'Invalid time slot.' });
    }

    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    const dayRange = getDayRange(date);
    if (!dayRange) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    const duplicate = await Booking.findOne({
      serviceId,
      date: { $gte: dayRange.start, $lte: dayRange.end },
      timeSlot,
      status: { $nin: ['cancelled'] },
    });

    if (duplicate) {
      return res.status(400).json({ message: 'This time slot is already booked.' });
    }

    const normalizedPaymentMethod = String(paymentMethod || 'cash').toLowerCase();
    const defaultPaymentStatus = isManualPaymentMethod(normalizedPaymentMethod) ? 'under_review' : 'pending';
    const resolvedPaymentStatus = paymentStatus || defaultPaymentStatus;
    const resolvedStatus = status || (resolvedPaymentStatus === 'completed' ? 'confirmed' : 'pending');

    if (!BOOKING_STATUSES.includes(resolvedStatus)) {
      return res.status(400).json({ message: 'Invalid booking status.' });
    }

    if (!PAYMENT_STATUSES.includes(resolvedPaymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status.' });
    }

    const booking = new Booking({
      patientId,
      serviceId,
      date: dayRange.start,
      timeSlot,
      notes,
      status: resolvedStatus,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: resolvedPaymentStatus,
      consultationType: consultationType || 'in_person',
      sessionLink: sessionLink || '',
      transactionId: transactionId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('patientId', 'name email phone')
      .populate('serviceId', 'name category price duration');

    res.status(201).json({
      message: 'Booking created successfully!',
      booking: formatBooking(populatedBooking),
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Error creating booking.' });
  }
});

router.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id)
      .populate('patientId', 'name email phone condition')
      .populate('serviceId', 'name category price duration');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.json({ booking: formatBooking(booking) });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Error fetching booking.' });
  }
});

router.put('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id)
      .populate('patientId', 'name email phone condition')
      .populate('serviceId', 'name category price duration');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    await updateBookingFromBody(booking, req.body);

    const populatedBooking = await Booking.findById(booking._id)
      .populate('patientId', 'name email phone condition')
      .populate('serviceId', 'name category price duration');

    res.json({
      message: 'Booking updated successfully!',
      booking: formatBooking(populatedBooking),
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Error updating booking.' });
  }
});

router.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.json({ message: 'Booking deleted successfully!' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Error deleting booking.' });
  }
});

router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const booking = await Booking.findById(id)
      .populate('patientId', 'name email phone')
      .populate('serviceId', 'name category price duration');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    const refreshedBooking = await Booking.findById(id)
      .populate('patientId', 'name email phone')
      .populate('serviceId', 'name category price duration');

    res.json({
      message: 'Booking status updated successfully!',
      booking: formatBooking(refreshedBooking),
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Error updating booking status.' });
  }
});

router.patch('/bookings/:id/payment-review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid review action.' });
    }

    const booking = await Booking.findById(id)
      .populate('patientId', 'name email phone')
      .populate('serviceId', 'name category price duration');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (!isManualPaymentMethod(booking.paymentMethod) || !booking.paymentProofImage) {
      return res.status(400).json({ message: 'No manual payment proof found for this booking.' });
    }

    booking.paymentReviewNote = typeof note === 'string' ? note.trim() : '';
    booking.paymentReviewedAt = new Date();
    booking.paymentReviewedBy = req.user._id;

    if (action === 'approve') {
      booking.paymentStatus = 'completed';
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
    } else {
      booking.paymentStatus = 'failed';
      if (booking.status !== 'cancelled') {
        booking.status = 'pending';
      }
    }

    booking.updatedAt = new Date();
    await booking.save();

    const refreshedBooking = await Booking.findById(id)
      .populate('patientId', 'name email phone')
      .populate('serviceId', 'name category price duration');

    res.json({
      message: action === 'approve' ? 'Payment approved successfully!' : 'Payment rejected successfully!',
      booking: formatBooking(refreshedBooking),
    });
  } catch (error) {
    console.error('Review payment error:', error);
    res.status(500).json({ message: 'Error reviewing payment.' });
  }
});

// ── SERVICE MANAGEMENT ──────────────────────────────────────────────────────
async function handleGetServices(req, res) {
  try {
    const services = await Service.find({}).sort({ name: 1 });
    const formatted = services
      .map((service) => {
        try {
          return formatService(service);
        } catch (error) {
          console.error('Service serialization failed:', service?._id?.toString?.() || 'unknown', error.message);
          return null;
        }
      })
      .filter(Boolean);

    res.json({ services: formatted });
  } catch (error) {
    console.error('Get admin services error:', error);
    res.status(500).json({ message: 'Error fetching services.' });
  }
}

async function handleCreateService(req, res) {
  try {
    const name = req.body.name || req.body.title;
    const description = req.body.description || '';
    const price = parseNumericValue(req.body.price);
    const duration = parseServiceDuration(req.body.duration);
    const category = req.body.category || 'General';

    if (!name || !description || price === undefined || duration === undefined || !category) {
      return res.status(400).json({ message: 'Name, description, price, duration, and category are required.' });
    }

    const service = new Service({
      name,
      tagline: req.body.tagline || '',
      description,
      price,
      duration,
      category,
      features: Array.isArray(req.body.features)
        ? req.body.features.filter(Boolean)
        : typeof req.body.features === 'string'
          ? req.body.features.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      isActive: req.body.published !== undefined ? Boolean(req.body.published) : req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
    });

    await service.save();

    res.status(201).json({
      message: 'Service created successfully!',
      service: formatService(service),
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Error creating service.' });
  }
}

router.get('/services', handleGetServices);
router.get('/service', handleGetServices);

router.post('/services', handleCreateService);
router.post('/service', handleCreateService);

router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid service ID.' });
    }

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    const updatedService = await updateServiceFromBody(service, req.body);

    res.json({
      message: 'Service updated successfully!',
      service: formatService(updatedService),
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Error updating service.' });
  }
});

router.put('/service/:id', async (req, res) => {
  req.url = `/services/${req.params.id}`;
  return router.handle(req, res);
});

router.patch('/services/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid service ID.' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    service.isActive = Boolean(published);
    service.updatedAt = new Date();
    await service.save();

    res.json({ message: 'Service visibility updated successfully!', service: formatService(service) });
  } catch (error) {
    console.error('Publish service error:', error);
    res.status(500).json({ message: 'Error updating service visibility.' });
  }
});

router.patch('/service/:id/publish', async (req, res) => {
  req.url = `/services/${req.params.id}/publish`;
  return router.handle(req, res);
});

router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid service ID.' });
    }

    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    res.json({ message: 'Service deleted successfully!' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Error deleting service.' });
  }
});

router.delete('/service/:id', async (req, res) => {
  req.url = `/services/${req.params.id}`;
  return router.handle(req, res);
});

// ── VIDEO MANAGEMENT ────────────────────────────────────────────────────────
router.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find({}).sort({ createdAt: -1 });
    res.json({ videos: videos.map(formatVideo) });
  } catch (error) {
    console.error('Get admin videos error:', error);
    res.status(500).json({ message: 'Error fetching videos.' });
  }
});

router.post('/videos', async (req, res) => {
  try {
    const title = req.body.title || '';
    const description = req.body.description || '';
    const category = req.body.category || '';
    const videoUrl = req.body.videoUrl || req.body.youtubeUrl || '';
    const duration = parseVideoDuration(req.body.duration);

    if (!title || !description || !category || !videoUrl || duration === undefined) {
      return res.status(400).json({ message: 'Title, description, category, video URL, and duration are required.' });
    }

    const video = new Video({
      title,
      description,
      category,
      videoUrl,
      thumbnailUrl: req.body.thumbnailUrl || '',
      duration,
      difficulty: req.body.difficulty || 'beginner',
      tags: req.body.tags || '',
      isActive: req.body.published !== undefined ? Boolean(req.body.published) : req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
    });

    await video.save();

    res.status(201).json({
      message: 'Video created successfully!',
      video: formatVideo(video),
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ message: 'Error creating video.' });
  }
});

router.put('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID.' });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    const updatedVideo = await updateVideoFromBody(video, req.body);

    res.json({
      message: 'Video updated successfully!',
      video: formatVideo(updatedVideo),
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ message: 'Error updating video.' });
  }
});

router.patch('/videos/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID.' });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    video.isActive = Boolean(published);
    video.updatedAt = new Date();
    await video.save();

    res.json({ message: 'Video visibility updated successfully!', video: formatVideo(video) });
  } catch (error) {
    console.error('Publish video error:', error);
    res.status(500).json({ message: 'Error updating video visibility.' });
  }
});

router.delete('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID.' });
    }

    const video = await Video.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    res.json({ message: 'Video deleted successfully!' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Error deleting video.' });
  }
});

// ── ANALYTICS ────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const dashboard = await buildAnalyticsSummary();
    res.json({ stats: dashboard.summary });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error fetching stats.' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const dashboard = await buildAnalyticsSummary();
    res.json(dashboard);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics.' });
  }
});

router.get('/analytics/dashboard', async (req, res) => {
  try {
    const dashboard = await buildAnalyticsSummary();
    res.json(dashboard);
  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    res.status(500).json({ message: 'Error fetching analytics.' });
  }
});

router.get('/analytics/bookings', async (req, res) => {
  try {
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ bookingsByStatus });
  } catch (error) {
    console.error('Get analytics bookings error:', error);
    res.status(500).json({ message: 'Error fetching booking analytics.' });
  }
});

// ── SETTINGS ────────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    res.json(await getClinicSettings());
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Error fetching settings.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = await updateClinicSettings(req.body);

    res.json({
      message: 'Settings updated successfully!',
      settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Error updating settings.' });
  }
});

router.put('/settings/clinic', async (req, res) => {
  try {
    const settings = await updateClinicSettings({
      clinicName: req.body.clinicName,
      clinicEmail: req.body.clinicEmail ?? req.body.email,
      tagline: req.body.tagline,
      address: req.body.address,
      phone: req.body.phone,
      website: req.body.website,
      currency: req.body.currency,
    });

    res.json({
      message: 'Clinic settings updated successfully!',
      settings,
    });
  } catch (error) {
    console.error('Update clinic settings error:', error);
    res.status(500).json({ message: 'Error updating clinic settings.' });
  }
});

router.put('/settings/availability', async (req, res) => {
  try {
    const settings = await updateClinicSettings({
      availability: req.body.schedule,
      slotDuration: Number(req.body.slotDuration),
      bufferTime: Number(req.body.bufferTime ?? 0),
    });

    res.json({
      message: 'Availability updated successfully!',
      settings,
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Error updating availability.' });
  }
});

router.put('/settings/notifications', async (req, res) => {
  try {
    const settings = await updateClinicSettings({
      notifications: req.body,
    });

    res.json({
      message: 'Notification settings updated successfully!',
      settings,
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Error updating notification settings.' });
  }
});

module.exports = router;
