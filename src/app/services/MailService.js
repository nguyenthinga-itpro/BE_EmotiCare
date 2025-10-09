const nodemailer = require("nodemailer");

const sendVerificationMail = async (email, link) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey", // cố định là "apikey"
        pass: process.env.SENDGRID_API_KEY,
      },
    });

    const mailOptions = {
      from: `EmotiCare <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: "Verify your email for EmotiCare",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f7ff; padding: 30px; text-align: center;">
          <div style="background: #ffffff; border-radius: 12px; padding: 40px; max-width: 600px; margin: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Welcome to <span style="color: #4a90e2;">Emoticare 🎉</span></h2>
            <p style="color: #555; font-size: 16px; margin: 20px 0;">
              Thank you for registering! Please verify your email address to activate your account.
            </p>
            <a href="${link}" target="_blank" 
              style="display: inline-block; padding: 14px 28px; background: #4a90e2; color: white; 
              font-size: 16px; font-weight: bold; border-radius: 6px; text-decoration: none; 
              margin-top: 20px;">
              ✅ Verify Email
            </a>
            <p style="margin-top: 30px; font-size: 12px; color: #888;">
              If you did not request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending verification mail:", error.message);
    throw error;
  }
};

module.exports = { sendVerificationMail };
