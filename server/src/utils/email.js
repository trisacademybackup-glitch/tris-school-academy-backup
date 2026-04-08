const nodemailer = require("nodemailer");

// ── Brand colours (match CSS variables) ──────────────────────────────────────
const BRAND = {
  primary: "#0c6b5c", // hsl(170 77% 21%)
  primaryLight: "#0e8a76", // slightly lighter shade
  bg: "#f4f5f8", // hsl(220 20% 97%)
  text: "#131821", // hsl(220 25% 10%)
  muted: "#6b7280",
  white: "#ffffff",
  accent: "#0c6b5c",
};

const COMPANY_NAME = "Tris Academy";
const COMPANY_TAGLINE = "Your journey to confident driving starts here.";

// ── Transporter ───────────────────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ── Base layout ───────────────────────────────────────────────────────────────
const baseLayout = (content, previewText = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${COMPANY_NAME}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:'Segoe UI',Arial,sans-serif;">
  ${previewText ? `<div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BRAND.bg};min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;background-color:${BRAND.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryLight} 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:${BRAND.white};font-size:26px;font-weight:700;letter-spacing:-0.5px;">${COMPANY_NAME}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">${COMPANY_TAGLINE}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;">
                This email was sent by <strong>${COMPANY_NAME}</strong>.<br/>
                If you didn't request this, please ignore this email — your account is safe.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Button component ──────────────────────────────────────────────────────────
const ctaButton = (href, label) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:32px 0;">
  <tr>
    <td align="center">
      <a href="${href}" target="_blank"
         style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryLight} 100%);color:${BRAND.white};text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(12,107,92,0.35);">
        ${label}
      </a>
    </td>
  </tr>
</table>
`;

// ── Info box component ────────────────────────────────────────────────────────
const infoBox = (text, bgColor = "#f0fdf9", borderColor = BRAND.primary) => `
<div style="background-color:${bgColor};border-left:4px solid ${borderColor};border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
  <p style="margin:0;color:${BRAND.text};font-size:13px;line-height:1.6;">${text}</p>
</div>
`;

// ── URL fallback block ────────────────────────────────────────────────────────
const urlFallback = (url) => `
<p style="margin:16px 0 4px;color:${BRAND.muted};font-size:12px;">Or copy and paste this link into your browser:</p>
<p style="margin:0;word-break:break-all;color:${BRAND.primary};font-size:12px;font-family:monospace;">${url}</p>
`;

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

// 1. Forgot Password / Reset Link
const forgotPasswordTemplate = (name, resetUrl, expiresInMinutes = 60) => {
  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.text};font-size:22px;font-weight:700;">Reset Your Password</h2>
    <p style="margin:0 0 20px;color:${BRAND.muted};font-size:14px;">Hi ${name || "there"}, we received a request to reset your password.</p>

    <p style="margin:0 0 4px;color:${BRAND.text};font-size:14px;line-height:1.6;">
      Click the button below to create a new password. This link will expire in
      <strong>${expiresInMinutes} minutes</strong>.
    </p>

    ${ctaButton(resetUrl, "Reset My Password")}

    ${infoBox(`<strong>Security tip:</strong> If you didn't request a password reset, you can safely ignore this email. Your password will not change.`)}

    ${urlFallback(resetUrl)}
  `;
  return baseLayout(content, "Reset your Tris Academy password");
};

// 2. Password Changed Confirmation
const passwordChangedTemplate = (name) => {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background-color:#f0fdf9;border-radius:50%;margin-bottom:16px;">
        <span style="font-size:28px;">✅</span>
      </div>
      <h2 style="margin:0 0 8px;color:${BRAND.text};font-size:22px;font-weight:700;">Password Changed Successfully</h2>
      <p style="margin:0;color:${BRAND.muted};font-size:14px;">Hi ${name || "there"}, your password has been updated.</p>
    </div>

    ${infoBox(`Your ${COMPANY_NAME} account password was successfully changed. If this was you, no further action is needed.`, "#f0fdf9", BRAND.primary)}

    <p style="margin:20px 0 0;color:${BRAND.text};font-size:14px;line-height:1.6;">
      If you did <strong>not</strong> make this change, please contact us immediately or reset your password right away.
    </p>
  `;
  return baseLayout(content, "Your Tris Academy password was changed");
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

const sendForgotPasswordEmail = async ({ to, name, resetUrl }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Reset your ${COMPANY_NAME} password`,
    html: forgotPasswordTemplate(name, resetUrl),
    text: `Hi ${name},\n\nReset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.\n\n${COMPANY_NAME}`,
  });
};

const sendPasswordChangedEmail = async ({ to, name }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your ${COMPANY_NAME} password has been changed`,
    html: passwordChangedTemplate(name),
    text: `Hi ${name},\n\nYour password was successfully changed. If you didn't do this, contact us immediately.\n\n${COMPANY_NAME}`,
  });
};

module.exports = {
  sendForgotPasswordEmail,
  sendPasswordChangedEmail,
};
