import nodemailer from 'nodemailer';
import config from '../config/config.js';

// Create Nodemailer transport using Gmail OAuth2
const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: config.GOOGLE_USER,
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    refreshToken: config.GOOGLE_REFRESH_TOKEN
  }
});

/**
  Send an email using configured Nodemailer transport
  @param {string} to - Recipient email address
  @param {string} subject - Email subject line
  @param {string} text - Plain text version
  @param {string} html - HTML body content
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transport.sendMail({
      from: `YT-Auth <${config.GOOGLE_USER}>`, // Dynamically uses your config address
      to,
      subject,
      text,
      html
    });

    console.log('Email sent successfully. MessageID:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email via Nodemailer:', error);
    throw error; // Throw so controller can handle or log it
  }
};

export default sendEmail;