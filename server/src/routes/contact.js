// Email sending route for contact form
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Modern styled HTML email template
function buildEmailTemplate({ name, email, message }) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 32px; border-radius: 12px; max-width: 480px; margin: auto;">
      <h2 style="color: #2563eb; margin-bottom: 16px;">New Contact Message</h2>
      <div style="background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px #e0e7ef;">
        <p style="font-size: 16px; color: #222; margin-bottom: 12px;"><strong>Name:</strong> ${name}</p>
        <p style="font-size: 16px; color: #222; margin-bottom: 12px;"><strong>Email:</strong> ${email}</p>
        <p style="font-size: 16px; color: #222; margin-bottom: 0;"><strong>Message:</strong><br>${message}</p>
      </div>
      <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">Reliable Medical Contact Form</p>
    </div> 
  `;
}

router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Configure transporter (use environment variables in production)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Reliable Medical <${process.env.EMAIL_USER}>`,
    to: ["info@reliablemedical.co.ke", "reliablemedeq@gmail.com"],
    subject: "New Contact Form Submission",
    html: buildEmailTemplate({ name, email, message }),
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message." });
  }
});

module.exports = router;
