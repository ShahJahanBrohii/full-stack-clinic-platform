const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

// ── GET ALL SERVICES ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    const services = await Service.find(query).sort({ name: 1 });
    res.json(services);
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ message: 'Error fetching services.' });
  }
});

// ── GET SERVICE BY ID ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid service ID.' });
    }

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    res.json(service);
  } catch (err) {
    console.error('Get service error:', err);
    res.status(500).json({ message: 'Error fetching service.' });
  }
});

// ── ADMIN: CREATE SERVICE ──────────────────────────────────────────────────
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, duration, category } = req.body;

    // Validate input
    if (!name || !description || !price || !duration || !category) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (price < 0 || duration < 15) {
      return res.status(400).json({ message: 'Price must be >= 0 and duration must be >= 15 minutes.' });
    }

    const service = new Service({
      name,
      description,
      price,
      duration,
      category
    });

    await service.save();

    res.status(201).json({
      message: 'Service created successfully!',
      service
    });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ message: 'Error creating service.' });
  }
});

// ── ADMIN: UPDATE SERVICE ──────────────────────────────────────────────────
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, category, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid service ID.' });
    }

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    // Update fields
    if (name) service.name = name;
    if (description) service.description = description;
    if (price !== undefined) service.price = price;
    if (duration) service.duration = duration;
    if (category) service.category = category;
    if (isActive !== undefined) service.isActive = isActive;
    service.updatedAt = new Date();

    await service.save();

    res.json({
      message: 'Service updated successfully!',
      service
    });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ message: 'Error updating service.' });
  }
});

// ── ADMIN: DELETE SERVICE ──────────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
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
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ message: 'Error deleting service.' });
  }
});

module.exports = router;
