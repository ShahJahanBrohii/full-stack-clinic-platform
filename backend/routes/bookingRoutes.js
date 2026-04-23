const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { authMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');
const { sendBookingEmail, sendCancellationEmail } = require('../utils/emailService');

// Time slots available per day (in 30-minute intervals)
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

const MANUAL_PAYMENT_METHODS = ['jazzcash', 'easypaisa'];
const WALLET_NUMBERS = {
  jazzcash: process.env.JAZZCASH_WALLET_NUMBER || '0300-1234567',
  easypaisa: process.env.EASYPAISA_WALLET_NUMBER || '0311-7654321',
};

function isManualPaymentMethod(paymentMethod) {
  return MANUAL_PAYMENT_METHODS.includes(String(paymentMethod || '').toLowerCase());
}

function normalizePaymentMethod(paymentMethod) {
  if (!paymentMethod) return '';
  return String(paymentMethod).trim().toLowerCase();
}

function validatePaymentProofImage(value) {
  if (!value) return false;
  if (typeof value !== 'string') return false;
  if (!value.startsWith('data:image/')) return false;
  return value.length <= 1_500_000;
}

function isOnlineService(service) {
  if (!service) return false;
  const name = String(service.name || '').toLowerCase();
  const category = String(service.category || '').toLowerCase();
  return (
    name.includes('online') ||
    name.includes('virtual') ||
    category.includes('online') ||
    category.includes('virtual')
  );
}

function getDayRange(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

function ensurePatientRole(req, res) {
  if (req.user?.role !== 'patient') {
    res.status(403).json({ message: 'Only patients can perform this action.' });
    return false;
  }
  return true;
}

// ── GET MY BOOKINGS ────────────────────────────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    if (!ensurePatientRole(req, res)) return;

    const bookings = await Booking.find({ patientId: req.user._id })
      .populate('serviceId', 'name price duration category')
      .sort({ date: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Get my bookings error:', err);
    res.status(500).json({ message: 'Error fetching bookings.' });
  }
});

// ── GET AVAILABLE SLOTS ────────────────────────────────────────────────────
router.get('/slots', async (req, res) => {
  try {
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({ message: 'Service ID and date are required.' });
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    const dayRange = getDayRange(date);
    if (!dayRange) {
      return res.status(400).json({ message: 'Invalid date format. Use ISO date.' });
    }

    const bookedSlots = await Booking.find({
      serviceId,
      date: { $gte: dayRange.startOfDay, $lte: dayRange.endOfDay },
      status: { $nin: ['cancelled'] }
    }, 'timeSlot');

    const bookedSlotTimes = bookedSlots.map(b => b.timeSlot);
    const availableSlots = TIME_SLOTS.filter(slot => !bookedSlotTimes.includes(slot));

    res.json({ availableSlots });
  } catch (err) {
    console.error('Get slots error:', err);
    res.status(500).json({ message: 'Error fetching available slots.' });
  }
});

// ── GET BOOKING BY ID ──────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id)
      .populate('patientId', 'name email phone')
      .populate('serviceId', 'name price duration category');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check if user owns this booking or is admin
    if (booking.patientId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ message: 'Error fetching booking.' });
  }
});

// ── CREATE BOOKING ─────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!ensurePatientRole(req, res)) return;

    const { serviceId, date, timeSlot, notes, paymentMethod, paymentProofImage, transactionId } = req.body;

    // Validate input
    if (!serviceId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Service ID, date, and time slot are required.' });
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Service not found or inactive.' });
    }

    // Check if slot is valid
    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({ message: 'Invalid time slot.' });
    }

    const dayRange = getDayRange(date);
    if (!dayRange) {
      return res.status(400).json({ message: 'Invalid date format. Use ISO date.' });
    }

    // Check if slot is already booked
    const existingBooking = await Booking.findOne({
      serviceId,
      date: { $gte: dayRange.startOfDay, $lte: dayRange.endOfDay },
      timeSlot,
      status: { $nin: ['cancelled'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is already booked.' });
    }

    // Ensure date is in the future
    const bookingDate = new Date(dayRange.startOfDay);
    const now = new Date();
    if (bookingDate < now) {
      return res.status(400).json({ message: 'Cannot book appointments in the past.' });
    }

    // Create booking
    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod) || 'pending';
    const manualPayment = isManualPaymentMethod(normalizedPaymentMethod);

    if (manualPayment && !validatePaymentProofImage(paymentProofImage)) {
      return res.status(400).json({
        message: 'Payment screenshot is required for JazzCash/Easypaisa and must be a valid image.',
      });
    }

    const booking = new Booking({
      patientId: req.user._id,
      serviceId,
      date: bookingDate,
      timeSlot,
      notes,
      consultationType: isOnlineService(service) ? 'online' : 'in_person',
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: manualPayment ? 'under_review' : 'pending',
      paymentWalletNumber: manualPayment ? WALLET_NUMBERS[normalizedPaymentMethod] : undefined,
      paymentProofImage: manualPayment ? paymentProofImage : undefined,
      paymentProofSubmittedAt: manualPayment ? new Date() : undefined,
      transactionId: transactionId || undefined,
      status: 'confirmed',
    });

    await booking.save();

    // Populate and return
    const populatedBooking = await booking.populate('serviceId', 'name price duration category');

    // Send booking confirmation email
    const formattedDate = bookingDate.toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    await sendBookingEmail(
      req.user.name,
      req.user.email,
      service.name,
      formattedDate,
      timeSlot,
      service.price,
      booking._id.toString()
    );

    res.status(201).json({
      message: 'Booking created successfully! Confirmation email sent.',
      booking: populatedBooking
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Error creating booking.' });
  }
});

// ── CANCEL BOOKING ─────────────────────────────────────────────────────────
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    if (!ensurePatientRole(req, res)) return;

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id).populate('serviceId', 'name price category');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check ownership
    if (booking.patientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Check if already cancelled or completed
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking.' });
    }

    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save();

    // Send cancellation email
    const formattedDate = booking.date.toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const refundAmount = booking.serviceId.price || 'Full amount';
    await sendCancellationEmail(
      req.user.name,
      req.user.email,
      booking.serviceId.name,
      formattedDate,
      booking.timeSlot,
      refundAmount
    );

    res.json({ message: 'Booking cancelled successfully! Cancellation email sent.', booking });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ message: 'Error cancelling booking.' });
  }
});

// ── RESCHEDULE BOOKING ─────────────────────────────────────────────────────
router.patch('/:id/reschedule', authMiddleware, async (req, res) => {
  try {
    if (!ensurePatientRole(req, res)) return;

    const { id } = req.params;
    const { date, timeSlot } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'New date and time slot are required.' });
    }

    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({ message: 'Invalid time slot.' });
    }

    const booking = await Booking.findById(id).populate('serviceId', 'name price duration category');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check ownership
    if (booking.patientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reschedule a cancelled booking.' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot reschedule a completed booking.' });
    }

    const dayRange = getDayRange(date);
    if (!dayRange) {
      return res.status(400).json({ message: 'Invalid date format. Use ISO date.' });
    }

    const rescheduledDate = new Date(dayRange.startOfDay);
    if (rescheduledDate < new Date()) {
      return res.status(400).json({ message: 'Cannot reschedule appointments to the past.' });
    }

    const existingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      serviceId: booking.serviceId?._id || booking.serviceId,
      date: { $gte: dayRange.startOfDay, $lte: dayRange.endOfDay },
      timeSlot,
      status: { $nin: ['cancelled'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is already booked.' });
    }

    booking.date = rescheduledDate;
    booking.timeSlot = timeSlot;
    booking.status = booking.paymentStatus === 'under_review' ? 'pending' : 'confirmed';
    booking.reminderSent = false;
    booking.updatedAt = new Date();
    await booking.save();

    const populatedBooking = await booking.populate('serviceId', 'name price duration category');

    res.json({
      message: 'Booking rescheduled successfully!',
      booking: populatedBooking,
    });
  } catch (err) {
    console.error('Reschedule booking error:', err);
    res.status(500).json({ message: 'Error rescheduling booking.' });
  }
});

// ── CONFIRM PAYMENT ────────────────────────────────────────────────────────
router.post('/:id/payment', authMiddleware, async (req, res) => {
  try {
    if (!ensurePatientRole(req, res)) return;

    const { id } = req.params;
    const { paymentMethod, transactionId, paymentProofImage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required.' });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check ownership
    if (booking.patientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
    const manualPayment = isManualPaymentMethod(normalizedPaymentMethod);

    booking.paymentMethod = normalizedPaymentMethod;
    if (transactionId !== undefined) booking.transactionId = transactionId;

    if (manualPayment) {
      if (!validatePaymentProofImage(paymentProofImage)) {
        return res.status(400).json({
          message: 'Payment screenshot is required for JazzCash/Easypaisa and must be a valid image.',
        });
      }

      booking.paymentStatus = 'under_review';
      booking.paymentWalletNumber = WALLET_NUMBERS[normalizedPaymentMethod];
      booking.paymentProofImage = paymentProofImage;
      booking.paymentProofSubmittedAt = new Date();
      booking.status = booking.status === 'cancelled' ? 'cancelled' : 'pending';
    } else {
      booking.paymentStatus = 'completed';
      booking.status = 'confirmed';
      booking.paymentProofImage = undefined;
      booking.paymentProofSubmittedAt = undefined;
      booking.paymentWalletNumber = undefined;
    }

    booking.updatedAt = new Date();

    await booking.save();

    res.json({
      message: 'Payment confirmed successfully!',
      booking
    });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ message: 'Error confirming payment.' });
  }
});

module.exports = router;
