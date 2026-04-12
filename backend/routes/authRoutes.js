const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/auth');
const { sendRegistrationEmail, sendPasswordResetEmail } = require('../utils/emailService');

function toPublicPatientName(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'Patient';
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || '';
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

// ── REGISTER ───────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new patient
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: 'patient'
    });

    await user.save();

    // Send registration confirmation email
    await sendRegistrationEmail(user.name, user.email);

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful! Confirmation email sent.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ── LOGIN ──────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been disabled.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ── PUBLIC PATIENT STORIES ───────────────────────────────────────────────
router.get('/patient-stories', async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 12)
      : 6;

    const patients = await User.find({
      role: 'patient',
      isActive: true,
      bio: { $exists: true, $ne: '' },
    }, 'name bio condition createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    const stories = patients
      .map((patient) => ({
        id: patient._id,
        name: toPublicPatientName(patient.name),
        story: String(patient.bio || '').trim(),
        condition: String(patient.condition || '').trim(),
      }))
      .filter((story) => story.story.length > 0);

    res.json({ stories });
  } catch (err) {
    console.error('Get patient stories error:', err);
    res.status(500).json({ message: 'Error fetching patient stories.' });
  }
});

// ── GET CURRENT USER ───────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Get Me error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── UPDATE PROFILE ─────────────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, bio } = req.body;
    const user = req.user;

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists.' });
      }
      user.email = email.toLowerCase();
    }
    if (bio !== undefined) user.bio = bio;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
});

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, currentPassword, newPassword } = req.body;
    const user = req.user;

    // Validate input
    const passwordToCheck = oldPassword || currentPassword;

    if (!passwordToCheck || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required.' });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(passwordToCheck, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date();

    await user.save();

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error during password change.' });
  }
});

// ── REQUEST PASSWORD RESET ────────────────────────────────────────────────
/**
 * POST /auth/forgot-password
 * Sends password reset link to user's email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { id: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Build reset link (adjust frontend URL as needed)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendPasswordResetEmail(user.name, user.email, resetLink);

    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error during password reset request.' });
  }
});

// ── RESET PASSWORD WITH TOKEN ──────────────────────────────────────────────
/**
 * POST /auth/reset-password
 * Resets password using token from email link
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Reset token is invalid or expired.' });
    }

    if (decoded.type !== 'password-reset') {
      return res.status(401).json({ message: 'Invalid token type.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Hash new password and save
    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: 'Password reset successful! Please log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
});

// ── LOGOUT (Optional - frontend just deletes token) ────────────────────────
router.post('/logout', authMiddleware, (req, res) => {
  // Token is managed by frontend (localStorage), nothing to do on backend
  res.json({ message: 'Logout successful!' });
});

module.exports = router;