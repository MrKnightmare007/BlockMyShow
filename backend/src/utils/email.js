import { Resend } from 'resend';

let resend = null;

function getResendInstance() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not set in environment variables. Email sending will be disabled.');
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@blockmyshow.io';

/**
 * Send OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 */
export const sendOTPEmail = async (email, otp) => {
  try {
    const resendClient = getResendInstance();
    if (!resendClient) {
      console.warn('Email service not configured. OTP not sent to', email);
      return { success: false };
    }

    const result = await resendClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your BlockMyShow OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1a1a1a; margin: 0;">BlockMyShow</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Email Verification</p>
          </div>
          
          <p style="font-size: 14px; color: #333;">Your One-Time Password (OTP) is:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #ff6b00; letter-spacing: 3px; margin: 0; font-size: 40px;">${otp}</h1>
          </div>
          
          <p style="font-size: 13px; color: #666;">This code will expire in 10 minutes.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">If you didn't request this OTP, please ignore this email. Your account security is important to us.</p>
        </div>
      `,
    });
    console.log('✓ OTP email sent to', email);
    return result;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Send welcome email after signup
 * @param {string} email - User email
 * @param {string} userName - User name
 */
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const resendClient = getResendInstance();
    if (!resendClient) {
      console.warn('Email service not configured. Welcome email not sent to', email);
      return { success: false };
    }

    const result = await resendClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Welcome to BlockMyShow!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1a1a1a; margin: 0;">BlockMyShow</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Digital Ticketing Platform</p>
          </div>
          
          <h2 style="color: #1a1a1a;">Welcome, ${userName || 'User'}!</h2>
          
          <p style="font-size: 14px; color: #333; line-height: 1.6;">Your account has been successfully created. You can now browse and book tickets for your favorite events.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a1a1a;">You can now:</p>
            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
              <li>Browse upcoming events</li>
              <li>Book tickets with secure payment</li>
              <li>Receive NFT tickets in your wallet</li>
              <li>Manage your digital tickets</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">Happy booking! If you have any questions, feel free to contact our support team.</p>
        </div>
      `,
    });
    console.log('✓ Welcome email sent to', email);
    return result;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Failed to send welcome email');
  }
};

/**
 * Send ticket confirmation email
 * @param {string} email - Buyer email
 * @param {object} ticketData - Ticket information {eventTitle, ticketId, price, date, venue}
 */
export const sendTicketConfirmationEmail = async (email, ticketData) => {
  const { eventTitle, ticketId, price, date, venue } = ticketData;
  
  try {
    const resendClient = getResendInstance();
    if (!resendClient) {
      console.warn('Email service not configured. Ticket confirmation not sent to', email);
      return { success: false };
    }

    const result = await resendClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Ticket Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1a1a1a; margin: 0;">BlockMyShow</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Ticket Confirmation</p>
          </div>
          
          <h2 style="color: #ff6b00;">Ticket Booked Successfully! 🎉</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Event:</strong> ${eventTitle}</p>
            <p style="margin: 0 0 10px 0;"><strong>Ticket ID:</strong> <code style="background: #e8e8e8; padding: 4px 8px; border-radius: 4px;">${ticketId}</code></p>
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0 0 10px 0;"><strong>Venue:</strong> ${venue}</p>
            <p style="margin: 0;"><strong>Amount:</strong> ₹${price}</p>
          </div>
          
          <div style="background: #fffbf0; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333; font-size: 13px;">Your NFT ticket has been minted and is stored in your blockchain wallet. You can view it in the BlockMyShow app under "My Tickets".</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">Please keep this confirmation email for your records. Show your ticket QR code at the event entrance for verification.</p>
        </div>
      `,
    });
    console.log('✓ Ticket confirmation email sent to', email);
    return result;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Failed to send ticket confirmation email');
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetLink - Password reset link
 */
export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const resendClient = getResendInstance();
    if (!resendClient) {
      console.warn('Email service not configured. Password reset not sent to', email);
      return { success: false };
    }

    const result = await resendClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Reset Your BlockMyShow Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1a1a1a; margin: 0;">BlockMyShow</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Password Reset</p>
          </div>
          
          <h2 style="color: #1a1a1a;">Reset Your Password</h2>
          
          <p style="font-size: 14px; color: #333; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #ff6b00; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          
          <p style="font-size: 13px; color: #666;">Or copy this link: <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${resetLink}</code></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    console.log('✓ Password reset email sent to', email);
    return result;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send admin welcome email
 * @param {string} email - Admin email
 * @param {string} adminName - Admin name
 */
export const sendAdminWelcomeEmail = async (email, adminName) => {
  try {
    const resendClient = getResendInstance();
    if (!resendClient) {
      console.warn('Email service not configured. Admin welcome not sent to', email);
      return { success: false };
    }

    const result = await resendClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Welcome to BlockMyShow Admin Panel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1a1a1a; margin: 0;">BlockMyShow</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Admin Panel</p>
          </div>
          
          <h2 style="color: #1a1a1a;">Welcome, ${adminName || 'Admin'}!</h2>
          
          <p style="font-size: 14px; color: #333; line-height: 1.6;">Your admin account has been created successfully. You now have access to the BlockMyShow administration panel.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a1a1a;">Your admin permissions include:</p>
            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
              <li>Create and manage events</li>
              <li>Scan and verify tickets</li>
              <li>View event analytics</li>
              <li>Manage user accounts</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">For security purposes, please change your password on first login. If you have any questions, contact the system administrator.</p>
        </div>
      `,
    });
    console.log('✓ Admin welcome email sent to', email);
    return result;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Failed to send admin welcome email');
  }
};
