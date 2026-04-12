const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  watchedAt: [{ type: Date }], // Array of watch timestamps to track multiple views
  totalWatchTime: { type: Number, default: 0 }, // in seconds
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 }, // % of video watched
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Composite index to ensure one progress entry per user-video pair
videoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('VideoProgress', videoProgressSchema);
