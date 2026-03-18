const nodemailer = require('nodemailer');

let transporter;

const hasEmailConfig = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const getEmailTransporter = () => {
  if (!hasEmailConfig()) {
    throw new Error('Email delivery is not configured. Set EMAIL_USER and EMAIL_PASS.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
};

const getFromAddress = () => process.env.EMAIL_FROM || `"HireMe" <${process.env.EMAIL_USER}>`;

const sendEmail = async ({ to, subject, html }) => {
  const emailTransporter = getEmailTransporter();
  return emailTransporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
  });
};

module.exports = {
  hasEmailConfig,
  getEmailTransporter,
  getFromAddress,
  sendEmail,
};
