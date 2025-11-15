import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import db from "@/lib/db";

const MAX_ATTEMPTS = 5;

const hashOtp = (otp: string) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const response = (status: number, message: string) =>
  NextResponse.json({ message }, { status });

export async function POST(request: Request) {
  try {
    const { email, password, code } = (await request.json()) as {
      email?: string;
      password?: string;
      code?: string;
    };

    if (!email || !password || !code) {
      return response(
        400,
        "Email, password, and verification code are required"
      );
    }

    // Validate password
    if (password.length < 8) {
      return response(400, "Password must be at least 8 characters long");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const identifier = `password-reset:${normalizedEmail}`;

    const record = db
      .prepare(
        'SELECT id, value, expiresAt FROM "verification" WHERE identifier = ?'
      )
      .get(identifier) as
      | { id: string; value: string; expiresAt: string }
      | undefined;

    if (!record) {
      return response(400, "No password reset request found for this email");
    }

    const now = new Date();
    const expiresAt = new Date(record.expiresAt);

    if (now > expiresAt) {
      db.prepare('DELETE FROM "verification" WHERE id = ?').run(record.id);
      return response(400, "Verification code has expired. Request a new code");
    }

    let stored;
    try {
      stored = JSON.parse(record.value) as { code: string; attempts?: number };
    } catch (error) {
      console.error("Failed to parse stored OTP payload", error);
      db.prepare('DELETE FROM "verification" WHERE id = ?').run(record.id);
      return response(
        500,
        "Verification store is corrupted. Request a new code"
      );
    }

    const attempts = stored.attempts ?? 0;
    if (attempts >= MAX_ATTEMPTS) {
      db.prepare('DELETE FROM "verification" WHERE id = ?').run(record.id);
      return response(400, "Too many incorrect attempts. Request a new code");
    }

    const hashedOtp = hashOtp(code.trim());

    if (hashedOtp !== stored.code) {
      const updatePayload = JSON.stringify({
        code: stored.code,
        attempts: attempts + 1,
      });

      db.prepare(
        'UPDATE "verification" SET value = ?, updatedAt = ? WHERE id = ?'
      ).run(updatePayload, now.toISOString(), record.id);

      return response(400, "Incorrect verification code");
    }

    // Find user
    const user = db
      .prepare('SELECT id FROM "user" WHERE lower(email) = lower(?)')
      .get(normalizedEmail) as { id: string } | undefined;

    if (!user) {
      db.prepare('DELETE FROM "verification" WHERE id = ?').run(record.id);
      return response(404, "User not found");
    }

    // Find credential account
    const account = db
      .prepare('SELECT id FROM "account" WHERE userId = ? AND providerId = ?')
      .get(user.id, "credential") as { id: string } | undefined;

    if (!account) {
      db.prepare('DELETE FROM "verification" WHERE id = ?').run(record.id);
      return response(400, "This account does not use password authentication");
    }

    // Update password
    const hashedPassword = await hashPassword(password);
    const updateAccount = db.prepare(
      'UPDATE "account" SET password = ?, updatedAt = ? WHERE id = ?'
    );
    const deleteVerification = db.prepare(
      'DELETE FROM "verification" WHERE id = ?'
    );

    const transaction = db.transaction(() => {
      updateAccount.run(hashedPassword, now.toISOString(), account.id);
      deleteVerification.run(record.id);
    });

    transaction();

    return NextResponse.json({
      message: "Password reset successfully",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Failed to reset password", error);
    return response(500, "Failed to reset password. Please try again");
  }
}

