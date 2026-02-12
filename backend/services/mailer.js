const axios = require('axios');

async function sendMail({ to, subject, text }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY not set');
  }

  return axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name: 'FitnessTracker',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    }
  );
}

module.exports = { sendMail };
