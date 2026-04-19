const express = require('express');
const router = express.Router();
const ClinicSettings = require('../models/ClinicSettings');

function serializePublicSettings(settings) {
  if (!settings) return settings;
  const plain = typeof settings.toObject === 'function' ? settings.toObject() : settings;

  return {
    clinicName: plain.clinicName,
    clinicEmail: plain.clinicEmail,
    tagline: plain.tagline,
    address: plain.address,
    phone: plain.phone,
    website: plain.website,
    currency: plain.currency,
    workingHours: plain.workingHours,
    slotDuration: plain.slotDuration,
    maxPatientsPerSlot: plain.maxPatientsPerSlot,
    bufferTime: plain.bufferTime,
    availability: plain.availability,
    notifications: plain.notifications,
    updatedAt: plain.updatedAt,
  };
}

router.get('/clinic-settings', async (req, res) => {
  try {
    const settings = await ClinicSettings.getSingleton();
    res.json({ settings: serializePublicSettings(settings) });
  } catch (error) {
    console.error('Get public clinic settings error:', error);
    res.status(500).json({ message: 'Error fetching clinic settings.' });
  }
});

module.exports = router;