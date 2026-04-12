const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendReminderEmail } = require('./emailService');

/**
 * Initialize appointment reminder scheduler
 * Checks every day at 2 PM for appointments happening the next day
 * and sends reminder emails to patients
 
 */

function initializeReminderScheduler() {
  console.log('⏰ Initializing appointment reminder scheduler...');

  // Schedule: Every day at 2:00 PM
  const task = cron.schedule('0 14 * * *', async () => {
    console.log('📬 Running appointment reminder job...');
    
    try {
      // Get tomorrow's date range
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      // Find all confirmed bookings for tomorrow
      const upcomingBookings = await Booking.find({
        date: {
          $gte: tomorrow,
          $lt: nextDay,
        },
        status: 'confirmed',
        reminderSent: { $ne: true },
      }).populate('patientId', 'name email').populate('serviceId', 'name');

      if (upcomingBookings.length === 0) {
        console.log('✓ No appointments to remind for tomorrow');
        return;
      }

      console.log(`📧 Sending ${upcomingBookings.length} reminder email(s)...`);

      // Send reminder emails
      for (const booking of upcomingBookings) {
        try {
          const appointmentDate = new Date(booking.date)
            .toLocaleDateString('en-PK', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            });

          await sendReminderEmail(
            booking.patientId.name,
            booking.patientId.email,
            booking.serviceId.name || 'Your appointment',
            appointmentDate,
            booking.timeSlot,
          );

          // Mark reminder as sent
          booking.reminderSent = true;
          await booking.save();

          console.log(`✓ Reminder sent to ${booking.patientId.email}`);
        } catch (error) {
          console.error(
            `✗ Failed to send reminder to ${booking.patientId.email}:`,
            error.message
          );
        }
      }

      console.log('✓ Reminder job completed');
    } catch (error) {
      console.error('✗ Reminder scheduler error:', error.message);
    }
  }, {
    scheduled: false,
  });

  // Start the scheduled task
  task.start();
  console.log('✓ Reminder scheduler initialized (runs daily at 2:00 PM)');

  return task;
}

/**
 * Send manual reminder for testing
 * @param {string} bookingId - The booking ID to send reminder for
 */
async function sendManualReminder(bookingId) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('patientId', 'name email')
      .populate('serviceId', 'name');

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!booking.patientId.email) {
      throw new Error('User email not found');
    }

    const appointmentDate = new Date(booking.date)
      .toLocaleDateString('en-PK', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });

    await sendReminderEmail(
      booking.patientId.name,
      booking.patientId.email,
      booking.serviceId.name || 'Your appointment',
      appointmentDate,
      booking.timeSlot,
    );

    booking.reminderSent = true;
    await booking.save();

    console.log(`✓ Manual reminder sent to ${booking.patientId.email}`);
    return { success: true, message: 'Reminder sent successfully' };
  } catch (error) {
    console.error('✗ Manual reminder error:', error.message);
    return { success: false, message: error.message };
  }
}

module.exports = {
  initializeReminderScheduler,
  sendManualReminder,
};
