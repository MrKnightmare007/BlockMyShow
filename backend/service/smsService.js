const twilio = require('twilio')

const getTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials are not configured')
  }

  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

const sendOtpSms = async (phoneNumber, otp) => {
  if (!process.env.TWILIO_PHONE_NUMBER) {
    throw new Error('TWILIO_PHONE_NUMBER is not configured')
  }

  const client = getTwilioClient()

  try {
    const message = await client.messages.create({
      body: `Your ProofPass verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    })

    return {
      success: true,
      messageSid: message.sid
    }
  } catch (err) {
    throw new Error(`Failed to send SMS: ${err.message}`)
  }
}

module.exports = {
  sendOtpSms
}
