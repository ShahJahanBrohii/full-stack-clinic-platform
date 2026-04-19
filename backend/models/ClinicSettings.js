const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    open: { type: Boolean, default: true },
    from: { type: String, default: '' },
    to: { type: String, default: '' },
  },
  { _id: false }
);

const clinicSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  clinicName: { type: String, default: 'Sport Injuries Rehab Center' },
  clinicEmail: { type: String, default: 'contact@sportinjuriesrehabcenter.pk' },
  tagline: { type: String, default: 'Rehab • Recover • Rebuild • Return Stronger' },
  address: { type: String, default: 'Sports District, Karachi' },
  phone: { type: String, default: '03318348748 | 03703699444' },
  website: { type: String, default: 'https://sportinjuriesrehabcenter.pk' },
  currency: { type: String, default: 'PKR' },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:30' },
  },
  slotDuration: { type: Number, default: 30 },
  maxPatientsPerSlot: { type: Number, default: 1 },
  bufferTime: { type: Number, default: 0 },
  availability: {
    Monday: { type: availabilitySchema, default: () => ({ open: true, from: '09:00', to: '19:00' }) },
    Tuesday: { type: availabilitySchema, default: () => ({ open: true, from: '09:00', to: '19:00' }) },
    Wednesday: { type: availabilitySchema, default: () => ({ open: true, from: '09:00', to: '19:00' }) },
    Thursday: { type: availabilitySchema, default: () => ({ open: true, from: '09:00', to: '19:00' }) },
    Friday: { type: availabilitySchema, default: () => ({ open: true, from: '09:00', to: '19:00' }) },
    Saturday: { type: availabilitySchema, default: () => ({ open: true, from: '10:00', to: '16:00' }) },
    Sunday: { type: availabilitySchema, default: () => ({ open: false, from: '', to: '' }) },
  },
  notifications: {
    bookingConfirmation: { type: Boolean, default: true },
    bookingReminder: { type: Boolean, default: true },
    reminderHours: { type: String, default: '24' },
    cancellationAlert: { type: Boolean, default: true },
    newPatientAlert: { type: Boolean, default: true },
    paymentReceipt: { type: Boolean, default: true },
    adminDailyDigest: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

clinicSettingsSchema.statics.getSingleton = async function getSingleton() {
  let settings = await this.findOne({ key: 'global' });

  if (!settings) {
    settings = await this.create({ key: 'global' });
  }

  return settings;
};

module.exports = mongoose.model('ClinicSettings', clinicSettingsSchema);
