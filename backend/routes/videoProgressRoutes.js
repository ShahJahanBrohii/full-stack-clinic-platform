const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const VideoProgress = require('../models/VideoProgress');
const Video = require('../models/Video');
const { authMiddleware } = require('../middleware/auth');

// ── GET VIDEO PROGRESS FOR CURRENT USER ────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const progress = await VideoProgress.find({ userId: req.user._id })
      .populate('videoId', 'title duration');

    res.json({
      progress,
      message: 'Video progress retrieved successfully'
    });
  } catch (err) {
    console.error('Get video progress error:', err);
    res.status(500).json({ message: 'Error retrieving video progress.' });
  }
});

// ── GET SPECIFIC VIDEO PROGRESS ────────────────────────────────────────────
router.get('/:videoId', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;

    const progress = await VideoProgress.findOne({
      userId: req.user._id,
      videoId,
    }).populate('videoId');

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found.' });
    }

    res.json(progress);
  } catch (err) {
    console.error('Get specific progress error:', err);
    res.status(500).json({ message: 'Error retrieving progress.' });
  }
});

// ── UPDATE VIDEO PROGRESS ──────────────────────────────────────────────────
router.post('/:videoId/track', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { progress = 0, watchTime = 0, completed = false } = req.body;

    // Validate video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    // Validate progress is between 0-100
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0-100.' });
    }

    // Find or create progress record
    let videoProgress = await VideoProgress.findOne({
      userId: req.user._id,
      videoId,
    });

    if (!videoProgress) {
      videoProgress = new VideoProgress({
        userId: req.user._id,
        videoId,
        progress,
        totalWatchTime: watchTime,
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
      });
    } else {
      // Update existing
      videoProgress.progress = progress;
      videoProgress.totalWatchTime = (videoProgress.totalWatchTime || 0) + watchTime;
      if (completed && !videoProgress.isCompleted) {
        videoProgress.isCompleted = true;
        videoProgress.completedAt = new Date();
      }
      videoProgress.updatedAt = new Date();
      videoProgress.watchedAt.push(new Date());
    }

    await videoProgress.save();

    res.json({
      videoProgress,
      message: 'Progress updated successfully'
    });
  } catch (err) {
    console.error('Track progress error:', err);
    res.status(500).json({ message: 'Error tracking progress.' });
  }
});

// ── MARK VIDEO AS COMPLETED ────────────────────────────────────────────────
router.post('/:videoId/complete', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;

    let progress = await VideoProgress.findOne({
      userId: req.user._id,
      videoId,
    });

    if (!progress) {
      progress = new VideoProgress({
        userId: req.user._id,
        videoId,
        progress: 100,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      progress.progress = 100;
      progress.isCompleted = true;
      progress.completedAt = new Date();
      progress.updatedAt = new Date();
    }

    await progress.save();

    res.json({
      message: 'Video marked as completed',
      progress,
    });
  } catch (err) {
    console.error('Complete video error:', err);
    res.status(500).json({ message: 'Error marking video as completed.' });
  }
});

// ── DELETE VIDEO PROGRESS ──────────────────────────────────────────────────
router.delete('/:videoId', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;

    const result = await VideoProgress.deleteOne({
      userId: req.user._id,
      videoId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Progress not found.' });
    }

    res.json({ message: 'Progress deleted successfully.' });
  } catch (err) {
    console.error('Delete progress error:', err);
    res.status(500).json({ message: 'Error deleting progress.' });
  }
});

// ── GET PROGRESS STATS FOR DASHBOARD ───────────────────────────────────────
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const results = await VideoProgress.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          completedVideos: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          totalWatchTime: { $sum: '$totalWatchTime' },
          avgProgress: { $avg: '$progress' },
        },
      },
    ]);

    const stats = results[0] || {
      totalVideos: 0,
      completedVideos: 0,
      totalWatchTime: 0,
      avgProgress: 0,
    };

    res.json({ stats });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ message: 'Error retrieving statistics.' });
  }
});

module.exports = router;
