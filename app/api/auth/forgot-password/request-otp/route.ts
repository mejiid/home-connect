import { NextResponse } from "next/server";
import crypto from "node:crypto";

import db from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";

const OTP_EXPIRY_MINUTES = 10;

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (otp: string) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Please provide a valid email" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = db
      .prepare('SELECT id FROM "user" WHERE lower(email) = lower(?)')
      .get(normalizedEmail) as { id: string } | undefined;

    if (!existingUser) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: "If an account exists with this email, a password reset code has been sent",
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      });
    }

    // Check if user has a credential account (password-based)
    const account = db
      .prepare('SELECT id FROM "account" WHERE userId = ? AND providerId = ?')
      .get(existingUser.id, "credential") as { id: string } | undefined;

    if (!account) {
      // User exists but doesn't have a password account (social login only)
      return NextResponse.json({
        message: "If an account exists with this email, a password reset code has been sent",
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      });
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);
    const identifier = `password-reset:${normalizedEmail}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const payload = JSON.stringify({ code: hashedOtp, attempts: 0 });

    const deleteStatement = db.prepare(
      'DELETE FROM "verification" WHERE identifier = ?'
    );
    const insertStatement = db.prepare(
      'INSERT INTO "verification" (id, identifier, value, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      deleteStatement.run(identifier);
      insertStatement.run(
        crypto.randomUUID(),
        identifier,
        payload,
        expiresAt.toISOString(),
        now.toISOString(),
        now.toISOString()
      );
    });

    transaction();

    try {
      await sendPasswordResetEmail({
        to: normalizedEmail,
        code: otp,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Re-throw to be caught by outer catch block
      throw emailError;
    }

    return NextResponse.json({
      message: "If an account exists with this email, a password reset code has been sent",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send password reset code";

    console.error("Failed to send password reset OTP", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return more specific error message to help with debugging
    return NextResponse.json(
      { 
        message,
        error: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

