const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendPasswordResetOtp = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "FinManage Password Reset OTP",

    text: `Your FinManage password reset OTP is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,

    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>FinManage Password Reset</h2>

        <p>Your password reset OTP is:</p>

        <h1 style="letter-spacing: 6px;">${otp}</h1>

        <p>This OTP expires in <strong>10 minutes</strong>.</p>

        <p>If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
};