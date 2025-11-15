import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import db from "@/lib/db";
import { DEFAULT_ROLE } from "@/lib/roles";

const MAX_ATTEMPTS = 5;

const hashOtp = (otp: string) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const response = (status: number, message: string) =>
  NextResponse.json({ message }, { status });

export async function POST(request: Request) {
  try {
    const { email, password, name, code } = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      code?: string;
    };

    if (!email || !password || !code) {
      return response(
        400,
        "Email, password, and verification code are required"
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const identifier = `signup:${normalizedEmail}`;

    const record = db
      .prepare(
        'SELECT id, value, expiresAt FROM "verification" WHERE identifier = ?'
      )
      .get(identifier) as
      | { id: string; value: string; expiresAt: string }
      | undefined;

    if (!record) {
      return response(400, "No verification request found for this email");
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

    const existingUser = db
      .prepare('SELECT id FROM "user" WHERE lower(email) = lower(?)')
      .get(normalizedEmail) as { id: string } | undefined;

    if (existingUser) {
      db.prepare('DELETE FROM "verification" WHERE id = ?').run(record.id);
      return response(409, "An account already exists for this email");
    }

    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const timestamp = now.toISOString();
    const hashedPassword = await hashPassword(password);

    const createUser = db.prepare(
      'INSERT INTO "user" (id, name, email, emailVerified, image, createdAt, updatedAt, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const linkAccount = db.prepare(
      'INSERT INTO "account" (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const deleteVerification = db.prepare(
      'DELETE FROM "verification" WHERE id = ?'
    );

    const transaction = db.transaction(() => {
      createUser.run(
        userId,
        name?.trim() || normalizedEmail.split("@")[0],
        normalizedEmail,
        1,
        null,
        timestamp,
        timestamp,
        DEFAULT_ROLE
      );

      linkAccount.run(
        accountId,
        userId,
        "credential",
        userId,
        hashedPassword,
        timestamp,
        timestamp
      );

      deleteVerification.run(record.id);
    });

    transaction();

    return NextResponse.json({
      message: "Account created successfully",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Failed to verify OTP", error);
    return response(500, "Failed to complete sign up. Please try again");
  }
}
