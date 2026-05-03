const BREVO_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email'

const getSender = () => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured')
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || 'BlockMyShow'

  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL is not configured')
  }

  return {
    name: senderName,
    email: senderEmail
  }
}

const sendBrevoEmail = async ({ email, subject, htmlContent }) => {
  const sender = getSender()

  const response = await fetch(BREVO_EMAIL_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender,
      to: [
        {
          email
        }
      ],
      subject,
      htmlContent
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Brevo email failed with status ${response.status}`)
  }
}

const sendOtpEmail = async (email, otp) => {
  await sendBrevoEmail({
    email,
    subject: 'Your BlockMyShow verification code',
    htmlContent: `<p>Your BlockMyShow OTP is <strong>${otp}</strong>.</p><p>This code expires soon.</p>`
  })
}

const sendWalletEmail = async (email, privateKey, walletAddress) => {
  await sendBrevoEmail({
    email,
    subject: 'Welcome to BlockMyShow - Wallet Created',
    htmlContent: `
      <h2>Your Wallet Has Been Created</h2>
      <p><strong>Wallet Address:</strong></p>
      <p>${walletAddress}</p>
      <p><strong>Private Key:</strong></p>
      <p>${privateKey}</p>
      <p>Please keep this private key secure. Anyone with this key can access your wallet.</p>
    `
  })
}

module.exports = {
  sendOtpEmail,
  sendWalletEmail
}
