const nodemailer = require("nodemailer");

// ============================================================
// CREATE EMAIL TRANSPORTER
// ============================================================

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",

  port: Number(process.env.EMAIL_PORT) || 587,

  secure:
    String(process.env.EMAIL_SECURE).toLowerCase() === "true",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ============================================================
// VERIFY EMAIL CONFIGURATION
// ============================================================

const verifyEmailTransporter = async () => {
  try {
    await transporter.verify();

    console.log("Email service connected successfully");
  } catch (error) {
    console.error("EMAIL SERVICE ERROR:", error.message);
  }
};

// ============================================================
// SEND PASSWORD RESET EMAIL
// ============================================================

const sendPasswordResetEmail = async ({
  email,
  name,
  resetUrl,
}) => {
  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER is not configured");
  }

  if (!process.env.EMAIL_PASSWORD) {
    throw new Error("EMAIL_PASSWORD is not configured");
  }

  const mailOptions = {
    from:
      process.env.EMAIL_FROM ||
      `TalentIQ <${process.env.EMAIL_USER}>`,

    to: email,

    subject: "Reset your TalentIQ password",

    text: `
Hello ${name || "TalentIQ user"},

We received a request to reset your TalentIQ password.

Click the link below to reset your password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
TalentIQ Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Reset your TalentIQ password</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:600px;
      margin:40px auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(20,40,80,0.08);
    "
  >

    <!-- HEADER -->

    <div
      style="
        padding:30px;
        background:#0c2d63;
        color:#ffffff;
      "
    >

      <h1
        style="
          margin:0;
          font-size:28px;
        "
      >
        Talent<span style="color:#4f8cff;">IQ</span>
      </h1>

      <p
        style="
          margin:8px 0 0;
          color:#cbd9f5;
          font-size:14px;
        "
      >
        AI-powered career intelligence
      </p>

    </div>

    <!-- CONTENT -->

    <div
      style="
        padding:40px 32px;
        color:#172033;
      "
    >

      <h2
        style="
          margin:0 0 15px;
          font-size:24px;
        "
      >
        Reset your password
      </h2>

      <p
        style="
          margin:0 0 18px;
          color:#66758c;
          line-height:1.7;
        "
      >
        Hello ${name || "there"},
      </p>

      <p
        style="
          margin:0 0 25px;
          color:#66758c;
          line-height:1.7;
        "
      >
        We received a request to reset the password
        associated with your TalentIQ account.
      </p>

      <div style="text-align:center; margin:30px 0;">

        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            padding:15px 30px;
            background:#2864e8;
            color:#ffffff;
            text-decoration:none;
            border-radius:10px;
            font-weight:bold;
          "
        >
          Reset Password
        </a>

      </div>

      <p
        style="
          margin:25px 0 10px;
          color:#7c899e;
          font-size:13px;
          line-height:1.6;
        "
      >
        This password reset link will expire in
        <strong>15 minutes</strong>.
      </p>

      <p
        style="
          margin:0;
          color:#7c899e;
          font-size:13px;
          line-height:1.6;
        "
      >
        If you did not request this password reset,
        you can safely ignore this email.
      </p>

    </div>

    <!-- FOOTER -->

    <div
      style="
        padding:20px 30px;
        border-top:1px solid #edf0f5;
        text-align:center;
        color:#98a2b3;
        font-size:12px;
      "
    >
      © 2026 TalentIQ. All rights reserved.
    </div>

  </div>

</body>
</html>
`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  transporter,
  verifyEmailTransporter,
  sendPasswordResetEmail,
};