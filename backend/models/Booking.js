const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g., "09:00", "09:30", "10:00"
  notes: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'under_review', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: { type: String }, // "card", "cash", "jazzcash", "easypaisa"
  transactionId: { type: String }, // for payment reference
  consultationType: {
    type: String,
    enum: ['in_person', 'online'],
    default: 'in_person'
  },
  sessionLink: { type: String }, // Google Meet / Zoom link for online consultation
  paymentWalletNumber: { type: String }, // receiver wallet number used for manual transfer
  paymentProofImage: { type: String }, // base64 data URL screenshot
  paymentProofSubmittedAt: { type: Date },
  paymentReviewNote: { type: String },
  paymentReviewedAt: { type: Date },
  paymentReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reminderSent: { type: Boolean, default: false }, // Track if reminder email was sent
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
