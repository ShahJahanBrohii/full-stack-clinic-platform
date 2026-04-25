const nodemailer = require('nodemailer');

// ── Email Service Configuration ──────────────────────────────────────────────
/**
 * Initialize email transporter with Gmail SMTP.
 * Uses environment variables for credentials.
 * 
 * Required env vars:
 *   EMAIL_USER: sender email address
 *   EMAIL_PASSWORD: Gmail app-specific password (not regular password)
 * 
 * Setup guide:
 *   1. Enable 2FA on Gmail account
 *   2. Create App Password at myaccount.google.com/apppasswords
 *   3. Set EMAIL_USER and EMAIL_PASSWORD in .env
 *   4. For development, set EMAIL_ENABLED=true to actually send emails
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Email credentials not configured. Email sending disabled.');
    }
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const transporter = createTransporter();

// ── Email Templates ─────────────────────────────────────────────────────────

const emailTemplates = {
  // Registration confirmation email
  registration: (userName, userEmail) => ({
    subject: "Welcome to Ali's Clinic! 🏥",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Ali's Clinic</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Your sports injury rehab journey starts here</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${userName}</strong>,</p>

          <p>Thank you for creating your account at Ali's Clinic! We're excited to help you recover and return to your best performance.</p>

          <div style="background: white; border-left: 4px solid #06b6d4; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #7c3aed; margin-top: 0;">What's Next?</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Browse our clinical services</li>
              <li>Book your first appointment</li>
              <li>Track your progress in your dashboard</li>
              <li>Download booking confirmations &amp; invoices</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            <strong>Need help?</strong> Reply to this email or contact us at <a href="mailto:info@apexclinic.pk" style="color: #06b6d4; text-decoration: none;">info@apexclinic.pk</a>
          </p>

          <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            © 2026 Ali's Clinic. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // Booking confirmation email
  booking: (userName, serviceName, date, timeSlot, price, bookingId) => ({
    subject: `Your Appointment Confirmed: ${serviceName} 📅`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Confirmed ✓</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Your booking is locked in</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${userName}</strong>,</p>

          <p>Great news! Your appointment has been confirmed. Here are the details:</p>

          <div style="background: white; border: 1px solid #e0e0e0; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #7c3aed; margin-top: 0; font-size: 18px;">${serviceName}</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
              <div>
                <p style="color: #999; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: bold;">📅 Date</p>
                <p style="color: #333; font-size: 16px; margin: 5px 0 0 0; font-weight: bold;">${date}</p>
              </div>
              <div>
                <p style="color: #999; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: bold;">⏰ Time</p>
                <p style="color: #333; font-size: 16px; margin: 5px 0 0 0; font-weight: bold;">${timeSlot}</p>
              </div>
              <div>
                <p style="color: #999; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: bold;">💰 Price</p>
                <p style="color: #333; font-size: 16px; margin: 5px 0 0 0; font-weight: bold;">${price}</p>
              </div>
              <div>
                <p style="color: #999; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: bold;">🎫 Booking ID</p>
                <p style="color: #06b6d4; font-size: 12px; margin: 5px 0 0 0; font-family: monospace; font-weight: bold;">${bookingId}</p>
              </div>
            </div>
          </div>

          <div style="background: #d4f4dd; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #065f46;">
              <strong>✓ What to expect:</strong> Please arrive 10 minutes early. Bring any relevant medical documents or previous injury reports.
            </p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            Need to reschedule? Visit your dashboard to modify or cancel this appointment (cancellations within 24 hours may incur a fee).
          </p>

          <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            © 2026 Ali's Clinic. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // Booking cancellation email
  cancellation: (userName, serviceName, date, timeSlot, refundAmount) => ({
    subject: `Appointment Cancelled - Refund Initiated 🔄`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #f87171 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Cancelled</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Your booking has been cancelled</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${userName}</strong>,</p>

          <p>Your appointment has been cancelled as requested:</p>

          <div style="background: white; border: 1px solid #e0e0e0; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #7c3aed; margin-top: 0; font-size: 18px;">${serviceName}</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
              <div>
                <p style="color: #999; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: bold;">📅 Date</p>
                <p style="color: #333; font-size: 16px; margin: 5px 0 0 0; font-weight: bold;">${date}</p>
              </div>
              <div>
                <p style="color: #999; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: bold;">⏰ Time</p>
                <p style="color: #333; font-size: 16px; margin: 5px 0 0 0; font-weight: bold;">${timeSlot}</p>
              </div>
            </div>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>💰 Refund Status:</strong> ${refundAmount} will be refunded to your original payment method within 5-7 business days.
            </p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            We'd love to help you again! Feel free to book another appointment anytime from your dashboard.
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 15px;">
            Questions? Contact us at <a href="mailto:info@apexclinic.pk" style="color: #06b6d4; text-decoration: none;">info@apexclinic.pk</a>
          </p>

          <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            © 2026 Ali's Clinic. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // Password reset email
  passwordReset: (userName, resetLink) => ({
    subject: "Reset Your Password - Ali's Clinic 🔐",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Valid for 1 hour</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${userName}</strong>,</p>

          <p>We received a password reset request for your account. Click the button below to set a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 12px; color: #7f1d1d;">
              <strong>⚠️ Security:</strong> This link expires in 1 hour. If you didn't request this, ignore this email. Your password won't change unless you confirm.
            </p>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 20px;">Or copy this link: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${resetLink}</code></p>

          <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            © 2026 Ali's Clinic. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // Appointment reminder email
  reminder: (userName, serviceName, appointmentDate, appointmentTime) => ({
    subject: `Reminder: Your appointment at Ali's Clinic tomorrow 🏥`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Reminder</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Your session is coming up tomorrow</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Don't forget! You have an appointment with Ali's Clinic tomorrow.
          </p>

          <div style="background: white; border: 2px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">📋</span>
                    <div>
                      <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase;">Service</p>
                      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937;">${serviceName}</p>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">📅</span>
                    <div>
                      <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase;">Date</p>
                      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937;">${appointmentDate}</p>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">🕐</span>
                    <div>
                      <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase;">Time</p>
                      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937;">${appointmentTime}</p>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            <strong>Please arrive 10 minutes early</strong> to check in. If you need to cancel or reschedule, please log into your dashboard.
          </p>

          <p style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #b0f040 0%, #84cc16 100%); color: #040d1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
              View Your Dashboard
            </a>
          </p>

          <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            © 2026 Ali's Clinic. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),
};


// ── Send Email Function ──────────────────────────────────────────────────────
/**
 * Send an email using the configured transporter.
 * If email credentials are not configured, logs the email instead.
 * 
 * @param {string} to - Recipient email address
 * @param {object} template - Email template object with subject and html
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendEmail = async (to, template) => {
  // If email is disabled or not configured, return a failure state.
  if (!transporter || !process.env.EMAIL_ENABLED) {
    return { success: false, message: 'Email sending is not configured.' };
  }

  try {
    const info = await transporter.sendMail({
      from: `Ali's Clinic <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✓ Email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error(`✗ Email send failed for ${to}:`, error.message);
    return { success: false, message: error.message };
  }
};

// ── Exported Functions ───────────────────────────────────────────────────────
module.exports = {
  sendEmail,
  emailTemplates,
  sendRegistrationEmail: (userName, userEmail) =>
    sendEmail(userEmail, emailTemplates.registration(userName, userEmail)),

  sendBookingEmail: (userName, userEmail, serviceName, date, timeSlot, price, bookingId) =>
    sendEmail(userEmail, emailTemplates.booking(userName, userEmail, serviceName, date, timeSlot, price, bookingId)),

  sendCancellationEmail: (userName, userEmail, serviceName, date, timeSlot, refundAmount) =>
    sendEmail(userEmail, emailTemplates.cancellation(userName, userEmail, serviceName, date, timeSlot, refundAmount)),

  sendPasswordResetEmail: (userName, userEmail, resetLink) =>
    sendEmail(userEmail, emailTemplates.passwordReset(userName, resetLink)),

  sendReminderEmail: (userName, userEmail, serviceName, appointmentDate, appointmentTime) =>
    sendEmail(userEmail, emailTemplates.reminder(userName, serviceName, appointmentDate, appointmentTime)),
};
