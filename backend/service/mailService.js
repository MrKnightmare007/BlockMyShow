const nodemailer = require('nodemailer');

// Initialize transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Cyberpunk Brutalist Email Template
 */
const cyberpunkTemplate = (title, content) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        background-color: #050505;
        color: #ffffff;
        font-family: 'Courier New', Courier, monospace;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        border: 4px solid #31bbaf;
        background: #111111;
        box-shadow: 8px 8px 0px #000;
        overflow: hidden;
        position: relative;
      }
      .header {
        background: #31bbaf;
        color: #000;
        padding: 20px;
        text-align: center;
        text-transform: uppercase;
        font-weight: bold;
        letter-spacing: 4px;
        border-bottom: 4px solid #000;
      }
      .content {
        padding: 40px;
        line-height: 1.6;
        border-bottom: 2px solid #333;
        position: relative;
        z-index: 2;
        color: #ffffff;
      }
      .content p {
        color: #ffffff;
        margin-bottom: 15px;
      }
      .footer {
        padding: 20px;
        text-align: center;
        font-size: 11px;
        color: #aaaaaa;
        background: #0a0a0a;
        letter-spacing: 1px;
      }
      .otp-code {
        font-size: 42px;
        color: #31bbaf;
        text-align: center;
        margin: 30px 0;
        letter-spacing: 8px;
        text-shadow: 0 0 10px rgba(49, 187, 175, 0.5);
        border: 2px dashed #31bbaf;
        padding: 20px;
        background: rgba(49, 187, 175, 0.05);
        font-weight: bold;
      }
      .highlight {
        color: #31bbaf;
        font-weight: bold;
      }
      .warning {
        color: #ef4444;
        font-size: 12px;
        margin-top: 20px;
        border-top: 1px solid #333;
        padding-top: 10px;
      }
      .grid {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
          linear-gradient(rgba(49, 187, 175, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(49, 187, 175, 0.05) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
        z-index: 1;
      }
      .brutal-box {
        border: 2px solid #31bbaf;
        padding: 15px;
        background: #000;
        margin: 15px 0;
        word-break: break-all;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="grid"></div>
      <div class="header">
        ${title}
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        BLOCKMYSHOW SECURE PROTOCOL v2.0.26<br/>
        &copy; 2026 BLOCKMYSHOW SYSTEM
      </div>
    </div>
  </body>
  </html>
`;

const sendOtpEmail = async (email, otp) => {
  const content = `
    <p style="font-weight: bold; color: #31bbaf;">[ ATTENTION PROTOCOL INITIATED ]</p>
    <p>A request has been made to access the <span class="highlight">BlockMyShow</span> network from this address.</p>
    <div class="otp-code">${otp}</div>
    <p>Input this verification string to proceed. This code will expire shortly.</p>
    <div class="warning">
      If you did not initiate this request, immediately disregard this transmission.
    </div>
  `;

  await transporter.sendMail({
    from: `"BlockMyShow" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Verification Required | BlockMyShow',
    html: cyberpunkTemplate('SECURITY VERIFICATION', content),
  });
};

const sendWalletEmail = async (email, privateKey, walletAddress) => {
  const content = `
    <p style="font-weight: bold; color: #31bbaf;">[ NODE INITIALIZATION SUCCESSFUL ]</p>
    <p>A new identity node has been established on the blockchain for your account.</p>
    
    <div style="margin-top: 25px;">
      <p style="margin-bottom: 5px; text-transform: uppercase; font-size: 12px; color: #888;">Public Address:</p>
      <div class="brutal-box" style="color: #31bbaf;">${walletAddress}</div>
    </div>

    <div style="margin-top: 25px;">
      <p style="margin-bottom: 5px; text-transform: uppercase; font-size: 12px; color: #ef4444; font-weight: bold;">Private Key (CRITICAL):</p>
      <div class="brutal-box" style="border-color: #ef4444; color: #ef4444;">${privateKey}</div>
    </div>

    <div class="warning">
      WARNING: The private key grants absolute control over your digital assets. 
      NEVER share this key. Store it in an encrypted offline vault.
    </div>
  `;

  await transporter.sendMail({
    from: `"BlockMyShow" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Identity Node Established | BlockMyShow',
    html: cyberpunkTemplate('NODE CREATED', content),
  });
};

module.exports = {
  sendOtpEmail,
  sendWalletEmail
};
