import crypto from "crypto";

const QR_BASE_SECRET = process.env.QR_BASE_SECRET as string;

if (!QR_BASE_SECRET) {
  throw new Error("Missing QR_BASE_SECRET environment variable");
}

// Generates a secret that rotates daily based on UTC date
export function getDailySecret(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const dayKey = `${y}-${m}-${d}`;
  return crypto
    .createHmac("sha256", QR_BASE_SECRET)
    .update(dayKey)
    .digest("hex");
}

// Create a short-lived session token for QR content
export function createQrSessionToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Validate a provided secret equals today's or yesterday's (grace for timezone)
export function isValidDailySecret(secret: string): boolean {
  const today = getDailySecret(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = getDailySecret(yesterdayDate);
  return secret === today || secret === yesterday;
}
