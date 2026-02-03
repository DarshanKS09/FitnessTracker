const nodemailer = require('nodemailer');

let transporter;

const initTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to ethereal for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Ethereal account created', testAccount.user);
  }
};

const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) await initTransporter();
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || 'no-reply@fitapp.local',
    to,
    subject,
    text,
    html,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  }
  return info;
};

module.exports = { sendMail };