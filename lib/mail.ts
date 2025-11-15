import nodemailer from "nodemailer";

// Gmail SMTP configuration
const host = process.env.GMAIL_HOST || "smtp.gmail.com";
const port = Number(process.env.GMAIL_PORT ?? 587);
const user = process.env.GMAIL_USER; // Your Gmail address
const pass = process.env.GMAIL_APP_PASSWORD; // Gmail App Password (not regular password)

const transporter = (() => {
  if (!user || !pass) {
    const missing = [];
    if (!user) missing.push("GMAIL_USER");
    if (!pass) missing.push("GMAIL_APP_PASSWORD");
    
    console.error(
      `Gmail credentials are missing: ${missing.join(", ")}. OTP emails will not be sent.`
    );
    return null;
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports (587 uses STARTTLS)
      auth: { 
        user, 
        pass 
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });
    
    // Log configuration (without sensitive data)
    console.log("Gmail SMTP transporter created", {
      host,
      port,
      secure: port === 465,
      user: user ? `${user.substring(0, 3)}***` : "missing",
    });
    
    return transport;
  } catch (error) {
    console.error("Failed to create email transporter:", error);
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
    const missing = [];
    if (!process.env.GMAIL_USER) missing.push("GMAIL_USER");
    if (!process.env.GMAIL_APP_PASSWORD) missing.push("GMAIL_APP_PASSWORD");
    
    throw new Error(
      `Email service is not configured. Missing environment variables: ${missing.join(", ")}. Please set these in your .env file.`
    );
  }

  const from =
    process.env.GMAIL_FROM || process.env.GMAIL_USER || "HomeConnect <no-reply@homeconnect.com>";

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
      host: process.env.GMAIL_HOST || "smtp.gmail.com",
      port: process.env.GMAIL_PORT || 587,
    });
    
    // Verify connection before sending
    try {
      await transporter.verify();
      console.log("Gmail SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("Gmail SMTP connection verification failed:", verifyError);
      throw new Error(
        `Cannot connect to Gmail SMTP server. Please check your Gmail credentials. Error: ${
          verifyError instanceof Error ? verifyError.message : String(verifyError)
        }`
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
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined;
    const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as { response?: string }).response : undefined;
    
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
    const missing = [];
    if (!process.env.GMAIL_USER) missing.push("GMAIL_USER");
    if (!process.env.GMAIL_APP_PASSWORD) missing.push("GMAIL_APP_PASSWORD");
    
    throw new Error(
      `Email service is not configured. Missing environment variables: ${missing.join(", ")}. Please set these in your .env file.`
    );
  }

  const from =
    process.env.GMAIL_FROM || process.env.GMAIL_USER || "HomeConnect <no-reply@homeconnect.com>";

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
      host: process.env.GMAIL_HOST || "smtp.gmail.com",
      port: process.env.GMAIL_PORT || 587,
    });
    
    // Verify connection before sending
    try {
      await transporter.verify();
      console.log("Gmail SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("Gmail SMTP connection verification failed:", verifyError);
      throw new Error(
        `Cannot connect to Gmail SMTP server. Please check your Gmail credentials. Error: ${
          verifyError instanceof Error ? verifyError.message : String(verifyError)
        }`
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
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined;
    const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as { response?: string }).response : undefined;
    
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
