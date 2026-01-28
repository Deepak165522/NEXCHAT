const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,              // 🔥 IMPORTANT
  secure: true,           // 🔥 true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password only
  },
  connectionTimeout: 10000,
});


transporter.verify(function (error, success) {
  if (error) {
    console.error('Gmail Service connection failed:', error);
  } else {
    console.log('Service configured properly and ready to send emails.',success);
  }
});



const sendOtpToEmail = async (email, otp) => {
    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 NEXCHAT APP  Verification</h2>
      
      <p>Hi there,</p>
      
      <p>Your one-time password (OTP) to verify your NEXCHAT APP  account is:</p>
      
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>

      <p>If you didn’t request this OTP, please ignore this email.</p>

      <p style="margin-top: 20px;">Thanks & Regards,<br/>NEXCHAT APP  Security Team</p>

      <hr style="margin: 30px 0;" />

      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

  await transporter.sendMail({
  from: `NEXCHAT APP <${process.env.EMAIL_USER}>`,
  to: email,
  subject: 'Your NEXCHAT APP Code',
  text: `Your NEXCHAT APP verification code is: ${otp}`,
    html,
});

};

module.exports = sendOtpToEmail ;




