import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: `"Nodemailer Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Nodemailer connection test',
      text: 'If you see this, Nodemailer on Render works!'
    });
    console.log('✅ Sent:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending email:', err);
  }
}

test();
