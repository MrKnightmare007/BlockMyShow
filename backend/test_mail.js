require('dotenv').config();
const { sendOtpEmail } = require('./service/mailService');

async function testEmail() {
  try {
    console.log('Attempting to send test email to dasso.anubhab@gmail.com...');
    await sendOtpEmail('dasso.anubhab@gmail.com', '123456');
    console.log('SUCCESS: Email sent successfully.');
  } catch (err) {
    console.error('FAILURE: Could not send email.');
    console.error(err);
  }
}

testEmail();
