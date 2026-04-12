const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

// ── GET ALL VIDEOS ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, difficulty } = req.query;
    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const videos = await Video.find(query).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    console.error('Get videos error:', err);
    res.status(500).json({ message: 'Error fetching videos.' });
  }
});

// ── GET CATEGORIES ────────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const categories = await Video.distinct('category', { isActive: true });
    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ message: 'Error fetching categories.' });
  }
});

// ── GET VIDEO BY ID ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID.' });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    // Increment view count
    video.views = (video.views || 0) + 1;
    await video.save();

    res.json(video);
  } catch (err) {
    console.error('Get video error:', err);
    res.status(500).json({ message: 'Error fetching video.' });
  }
});

// ── ADMIN: CREATE VIDEO ────────────────────────────────────────────────────
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, category, videoUrl, thumbnailUrl, duration, difficulty } = req.body;

    // Validate input
    if (!title || !description || !category || !videoUrl || !duration) {
      return res.status(400).json({ message: 'Title, description, category, videoUrl, and duration are required.' });
    }

    if (duration < 1) {
      return res.status(400).json({ message: 'Duration must be at least 1 second.' });
    }

    const video = new Video({
      title,
      description,
      category,
      videoUrl,
      thumbnailUrl,
      duration,
      difficulty: difficulty || 'beginner'
    });

    await video.save();

    res.status(201).json({
      message: 'Video created successfully!',
      video
    });
  } catch (err) {
    console.error('Create video error:', err);
    res.status(500).json({ message: 'Error creating video.' });
  }
});

// ── ADMIN: UPDATE VIDEO ────────────────────────────────────────────────────
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, videoUrl, thumbnailUrl, duration, difficulty, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID.' });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    // Update fields
    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;
    if (videoUrl) video.videoUrl = videoUrl;
    if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;
    if (duration) video.duration = duration;
    if (difficulty) video.difficulty = difficulty;
    if (isActive !== undefined) video.isActive = isActive;
    video.updatedAt = new Date();

    await video.save();

    res.json({
      message: 'Video updated successfully!',
      video
    });
  } catch (err) {
    console.error('Update video error:', err);
    res.status(500).json({ message: 'Error updating video.' });
  }
});

// ── ADMIN: DELETE VIDEO ────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
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
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ message: 'Error deleting video.' });
  }
});

module.exports = router;
