const BREVO_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email'

const sendOtpEmail = async (email, otp) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured')
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || 'BlockMyShow'

  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL is not configured')
  }

  const response = await fetch(BREVO_EMAIL_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email
        }
      ],
      subject: 'Your BlockMyShow verification code',
      htmlContent: `<p>Your BlockMyShow OTP is <strong>${otp}</strong>.</p><p>This code expires soon.</p>`
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Brevo email failed with status ${response.status}`)
  }
}

module.exports = {
  sendOtpEmail
}
