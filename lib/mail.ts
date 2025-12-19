import nodemailer from "nodemailer";

const normalizeEnvValue = (value: string | undefined) => value?.trim();

const parsePort = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type EmailProvider = "gmail" | "mailtrap";

const emailProvider = (
  normalizeEnvValue(process.env.EMAIL_PROVIDER)?.toLowerCase() as EmailProvider | undefined
) ?? "gmail";

// Gmail SMTP configuration
const gmailHost = normalizeEnvValue(process.env.GMAIL_HOST) || "smtp.gmail.com";
const gmailPort = parsePort(process.env.GMAIL_PORT, 587);
const gmailUser = normalizeEnvValue(process.env.GMAIL_USER);
// Gmail App Passwords are often shown with spaces; strip them so auth works.
const gmailPass = normalizeEnvValue(process.env.GMAIL_APP_PASSWORD)?.replace(/\s+/g, "");

// Mailtrap SMTP configuration (useful for development/testing)
const mailtrapHost = normalizeEnvValue(process.env.MAILTRAP_HOST);
const mailtrapPort = parsePort(process.env.MAILTRAP_PORT, 2525);
const mailtrapUser = normalizeEnvValue(process.env.MAILTRAP_USER);
const mailtrapPass = normalizeEnvValue(process.env.MAILTRAP_PASS);

const transporter = (() => {
  const provider = emailProvider;

  if (provider === "mailtrap") {
    const missing = [];
    if (!mailtrapHost) missing.push("MAILTRAP_HOST");
    if (!mailtrapUser) missing.push("MAILTRAP_USER");
    if (!mailtrapPass) missing.push("MAILTRAP_PASS");

    if (missing.length) {
      console.error(
        `Mailtrap credentials are missing: ${missing.join(", ")}. OTP emails will not be sent.`
      );
      return null;
    }

    try {
      const transport = nodemailer.createTransport({
        host: mailtrapHost,
        port: mailtrapPort,
        secure: false,
        auth: {
          user: mailtrapUser,
          pass: mailtrapPass,
        },
      });

      console.log("Mailtrap SMTP transporter created", {
        host: mailtrapHost,
        port: mailtrapPort,
        user: mailtrapUser ? `${mailtrapUser.substring(0, 3)}***` : "missing",
      });

      return transport;
    } catch (error) {
      console.error("Failed to create Mailtrap transporter:", error);
      return null;
    }
  }

  // provider === "gmail" (default)
  const missing = [];
  if (!gmailUser) missing.push("GMAIL_USER");
  if (!gmailPass) missing.push("GMAIL_APP_PASSWORD");

  if (missing.length) {
    console.error(
      `Gmail credentials are missing: ${missing.join(", ")}. OTP emails will not be sent.`
    );
    return null;
  }

  const gmailPassValue = gmailPass as string;

  if (gmailPassValue.length !== 16) {
    console.warn(
      "GMAIL_APP_PASSWORD length does not look like a Gmail App Password (expected 16 characters after removing spaces).",
      { length: gmailPassValue.length }
    );
  }

  try {
    const transport = nodemailer.createTransport({
      host: gmailHost,
      port: gmailPort,
      secure: gmailPort === 465, // true for 465, false for other ports (587 uses STARTTLS)
      auth: {
        user: gmailUser,
        pass: gmailPassValue,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });

    // Log configuration (without sensitive data)
    console.log("Gmail SMTP transporter created", {
      host: gmailHost,
      port: gmailPort,
      secure: gmailPort === 465,
      user: gmailUser ? `${gmailUser.substring(0, 3)}***` : "missing",
    });

    return transport;
  } catch (error) {
    console.error("Failed to create Gmail transporter:", error);
    return null;
  }
})();

export type OtpEmailPayload = {
  to: string;
  code: string;
  expiresInMinutes: number;
};

export type PasswordResetEmailPayload = {
  to: string;
  code: string;
  expiresInMinutes: number;
};

export const sendOtpEmail = async ({
  to,
  code,
  expiresInMinutes,
}: OtpEmailPayload) => {
  if (!transporter) {
    throw new Error(
      "Email service is not configured. Set Gmail vars (GMAIL_USER/GMAIL_APP_PASSWORD) or set EMAIL_PROVIDER=mailtrap with MAILTRAP_HOST/MAILTRAP_USER/MAILTRAP_PASS."
    );
  }

  const from =
    normalizeEnvValue(process.env.GMAIL_FROM) ||
    gmailUser ||
    "HomeConnect <no-reply@homeconnect.com>";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="color: #1d4ed8;">Your verification code</h2>
      <p>Use the code below to finish creating your HomeConnect account:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 6px;">${code}</p>
      <p style="margin-top: 16px;">This code expires in ${expiresInMinutes} minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Your HomeConnect verification code is ${code}. It expires in ${expiresInMinutes} minutes.`;

  try {
    console.log(`Attempting to send OTP email to: ${to}`);
    console.log(`Email configuration:`, {
      from,
      provider: emailProvider,
      host: emailProvider === "mailtrap" ? mailtrapHost : gmailHost,
      port: emailProvider === "mailtrap" ? mailtrapPort : gmailPort,
    });
    
    // Verify connection before sending
    try {
      await transporter.verify();
      console.log("Gmail SMTP connection verified successfully");
    } catch (verifyError) {
      const verifyCode = (verifyError as any)?.code;
      const verifyMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      console.error("Gmail SMTP connection verification failed:", verifyError);

      // Gmail login failures show up as 535 / EAUTH.
      if (emailProvider === "gmail" && (verifyCode === "EAUTH" || /\b535\b/.test(verifyMessage))) {
        throw new Error(
          "Gmail authentication failed (535). Use a NEW Gmail App Password (not your normal password), and ensure it matches the same Gmail account as GMAIL_USER. After editing env vars, restart the dev server."
        );
      }

      throw new Error(
        `Cannot verify SMTP connection. Check provider credentials and network access. Error: ${verifyMessage}`
      );
    }
    
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Your HomeConnect verification code",
      text,
      html,
    });

    console.info("OTP email dispatched successfully", {
      messageId: info.messageId,
      envelope: info.envelope,
      to: info.envelope.to,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return info;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code;
    const errorResponse = (error as any)?.response;
    
    console.error("Failed to dispatch OTP email", {
      to,
      error: errorMessage,
      code: errorCode,
      response: errorResponse,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Provide more helpful error messages
    if (errorCode === "EAUTH") {
      throw new Error("Gmail authentication failed. Please check your GMAIL_USER and GMAIL_APP_PASSWORD. Make sure you're using an App Password, not your regular Gmail password.");
    } else if (errorCode === "ECONNECTION") {
      throw new Error("Cannot connect to Gmail SMTP server. Please check your GMAIL_HOST and GMAIL_PORT settings.");
    } else if (errorCode === "ETIMEDOUT") {
      throw new Error("Gmail SMTP connection timed out. Please check your network connection and Gmail settings.");
    }
    
    throw error;
  }
};

export const sendPasswordResetEmail = async ({
  to,
  code,
  expiresInMinutes,
}: PasswordResetEmailPayload) => {
  if (!transporter) {
    throw new Error(
      "Email service is not configured. Set Gmail vars (GMAIL_USER/GMAIL_APP_PASSWORD) or set EMAIL_PROVIDER=mailtrap with MAILTRAP_HOST/MAILTRAP_USER/MAILTRAP_PASS."
    );
  }

  const from =
    normalizeEnvValue(process.env.GMAIL_FROM) || gmailUser || "HomeConnect <no-reply@homeconnect.com>";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="color: #1d4ed8;">Reset your password</h2>
      <p>Use the code below to reset your HomeConnect account password:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 6px;">${code}</p>
      <p style="margin-top: 16px;">This code expires in ${expiresInMinutes} minutes.</p>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Your HomeConnect password reset code is ${code}. It expires in ${expiresInMinutes} minutes.`;

  try {
    console.log(`Attempting to send password reset email to: ${to}`);
    console.log(`Email configuration:`, {
      from,
      provider: emailProvider,
      host: emailProvider === "mailtrap" ? mailtrapHost : gmailHost,
      port: emailProvider === "mailtrap" ? mailtrapPort : gmailPort,
    });
    
    // Verify connection before sending
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      const verifyCode = (verifyError as any)?.code;
      const verifyMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      console.error("SMTP connection verification failed:", verifyError);

      if (emailProvider === "gmail" && (verifyCode === "EAUTH" || /\b535\b/.test(verifyMessage))) {
        throw new Error(
          "Gmail authentication failed (535). Use a NEW Gmail App Password (not your normal password), and ensure it matches the same Gmail account as GMAIL_USER. After editing env vars, restart the dev server."
        );
      }

      throw new Error(
        `Cannot verify SMTP connection. Check provider credentials and network access. Error: ${verifyMessage}`
      );
    }
    
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Reset your HomeConnect password",
      text,
      html,
    });

    console.info("Password reset email dispatched successfully", {
      messageId: info.messageId,
      envelope: info.envelope,
      to: info.envelope.to,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return info;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code;
    const errorResponse = (error as any)?.response;
    
    console.error("Failed to dispatch password reset email", {
      to,
      error: errorMessage,
      code: errorCode,
      response: errorResponse,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Provide more helpful error messages
    if (errorCode === "EAUTH") {
      throw new Error("Gmail authentication failed. Please check your GMAIL_USER and GMAIL_APP_PASSWORD. Make sure you're using an App Password, not your regular Gmail password.");
    } else if (errorCode === "ECONNECTION") {
      throw new Error("Cannot connect to Gmail SMTP server. Please check your GMAIL_HOST and GMAIL_PORT settings.");
    } else if (errorCode === "ETIMEDOUT") {
      throw new Error("Gmail SMTP connection timed out. Please check your network connection and Gmail settings.");
    }
    
    throw error;
  }
};
