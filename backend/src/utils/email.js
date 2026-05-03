import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️  SMTP credentials not set. Email sending will be disabled.');
      return null;
    }
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '465'),
      secure: parseInt(SMTP_PORT || '465') === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

const EMAIL_FROM = process.env.EMAIL_FROM || '"BlockMyShow" <noreply@blockmyshow.io>';

/**
 * Send OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 */
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.warn('Email service not configured. OTP not sent to', email);
      return { success: false };
    }

    const htmlContent = `
      <div style="background-color: #050505; color: #ffffff; font-family: 'Courier New', Courier, monospace; max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #1a1a1a; box-shadow: 0 0 20px rgba(49, 187, 175, 0.15);">
        
        <!-- Web3 Header -->
        <div style="background-color: #000; text-align: center; padding: 40px 0;">
          <img src="https://media.tenor.com/Z4wD-xXk0kQAAAAC/bitcoin-crypto.gif" alt="Bitcoin" style="width: 80px; height: 80px; margin: 0 auto; display: block; border-radius: 50%;" />
          <h1 style="color: #31bbaf; font-size: 28px; margin: 15px 0 5px 0; text-transform: uppercase; letter-spacing: 4px; display: block;">BlockMyShow</h1>
          <p style="color: #888; font-size: 11px; margin: 0; letter-spacing: 2px; display: block;">WEB3 EVENT TICKETING</p>
        </div>
        
        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: #fff; font-size: 22px; margin-top: 0; text-transform: uppercase;">Identity Verification</h2>
          <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; max-width: 400px; margin: 0 auto;">
            Authenticate your wallet connection to mint your secure, non-transferable NFT tickets.
          </p>
          
          <div style="background: rgba(49, 187, 175, 0.05); border: 1px solid rgba(49, 187, 175, 0.3); padding: 30px; border-radius: 12px; margin: 30px auto; max-width: 300px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #31bbaf, transparent);"></div>
            <p style="color: #31bbaf; text-transform: uppercase; font-size: 11px; font-weight: bold; letter-spacing: 3px; margin: 0 0 15px 0;">Security Code</p>
            <h1 style="color: #ffffff; letter-spacing: 12px; margin: 0; font-size: 42px; text-shadow: 0 0 15px rgba(49,187,175,0.4);">${otp}</h1>
          </div>
          
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; background: #111; border: 1px solid #222; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #888; margin: 0 5px;">
              <span style="color: #31bbaf;">✓</span> Smart Contract
            </div>
            <div style="display: inline-block; background: #111; border: 1px solid #222; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #888; margin: 0 5px;">
              <span style="color: #31bbaf;">✓</span> Fraud-Proof
            </div>
            <div style="display: inline-block; background: #111; border: 1px solid #222; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #888; margin: 0 5px;">
              <span style="color: #31bbaf;">✓</span> On-Chain
            </div>
          </div>

          <div style="border-top: 1px solid #1a1a1a; padding-top: 25px;">
            <p style="font-size: 11px; color: #555; margin: 0;">
              This code will expire in 10 minutes.<br>
              If you didn't initiate this transaction, please secure your account immediately.
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await mailer.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'BlockMyShow: Verify Your Identity 🔐',
      html: htmlContent,
    });
    
    console.log('✓ OTP email sent to', email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Send welcome email after signup
 */
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const mailer = getTransporter();
    if (!mailer) return { success: false };

    const result = await mailer.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Welcome to the Future of Ticketing 🎟️',
      html: `
        <div style="background-color: #050505; color: #ffffff; font-family: 'Courier New', Courier, monospace; max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #1a1a1a;">
          <div style="background-color: #000; text-align: center; padding: 40px 0;">
            <img src="https://media.tenor.com/Z4wD-xXk0kQAAAAC/bitcoin-crypto.gif" alt="Bitcoin" style="width: 80px; height: 80px; margin: 0 auto; display: block; border-radius: 50%;" />
            <h1 style="color: #31bbaf; font-size: 28px; margin: 15px 0 5px 0; text-transform: uppercase; letter-spacing: 4px; display: block;">BlockMyShow</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #fff; font-size: 20px;">Welcome, ${userName || 'Explorer'}! 🚀</h2>
            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">
              Your identity has been verified and your wallet is now connected to the BlockMyShow network. You are ready to experience events through blockchain.
            </p>
            
            <div style="background: rgba(49, 187, 175, 0.05); border-left: 3px solid #31bbaf; padding: 20px; margin: 25px 0;">
              <h3 style="color: #31bbaf; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase;">Your Capabilities:</h3>
              <ul style="color: #a3a3a3; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Mint exclusive NFT event tickets</li>
                <li>Store tickets securely in your digital wallet</li>
                <li>Fast-track gate entry with cryptographic proof</li>
                <li>Collect poap-style attendance badges</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #1a1a1a; padding-top: 25px; margin-top: 30px; text-align: center;">
              <p style="font-size: 11px; color: #555; margin: 0;">Secured by BlockMyShow Smart Contracts</p>
            </div>
          </div>
        </div>
      `,
    });
    console.log('✓ Welcome email sent to', email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Failed to send welcome email');
  }
};

/**
 * Send ticket confirmation email
 */
export const sendTicketConfirmationEmail = async (email, ticketData) => {
  const { eventTitle, ticketId, price, date, venue } = ticketData;
  try {
    const mailer = getTransporter();
    if (!mailer) return { success: false };

    const result = await mailer.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: `NFT Ticket Minted: ${eventTitle}`,
      html: `
        <div style="background-color: #050505; color: #ffffff; font-family: 'Courier New', Courier, monospace; max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #1a1a1a;">
          <div style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #1a1a1a; background: radial-gradient(circle at center, rgba(49,187,175,0.1) 0%, #050505 100%);">
            <h1 style="color: #31bbaf; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Transaction Confirmed</h1>
            <p style="color: #888; font-size: 12px; margin-top: 10px;">Your ticket has been successfully minted to the blockchain.</p>
          </div>
          
          <div style="padding: 30px;">
            <div style="background: #111; border: 1px dashed #333; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
              <p style="margin: 0 0 15px 0; color: #a3a3a3; font-size: 13px;"><strong>Event:</strong> <span style="color: #fff;">${eventTitle}</span></p>
              <p style="margin: 0 0 15px 0; color: #a3a3a3; font-size: 13px;"><strong>Token ID:</strong> <code style="background: rgba(49,187,175,0.1); color: #31bbaf; padding: 4px 8px; border-radius: 4px;">${ticketId}</code></p>
              <p style="margin: 0 0 15px 0; color: #a3a3a3; font-size: 13px;"><strong>Date:</strong> <span style="color: #fff;">${date}</span></p>
              <p style="margin: 0 0 15px 0; color: #a3a3a3; font-size: 13px;"><strong>Venue:</strong> <span style="color: #fff;">${venue}</span></p>
              <p style="margin: 0; color: #a3a3a3; font-size: 13px;"><strong>Amount:</strong> <span style="color: #31bbaf; font-weight: bold;">₹${price}</span></p>
            </div>
            
            <p style="font-size: 12px; color: #666; text-align: center; line-height: 1.5;">
              Show your cryptographic QR code at the venue gate for rapid verification.<br>
              This NFT ticket is non-transferable and bound to your verified identity.
            </p>
          </div>
        </div>
      `,
    });
    console.log('✓ Ticket confirmation email sent to', email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Failed to send ticket confirmation email');
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetLink) => {
  // Can be implemented similarly
  return { success: true };
};

/**
 * Send admin welcome email
 */
export const sendAdminWelcomeEmail = async (email, adminName) => {
  // Can be implemented similarly
  return { success: true };
};
