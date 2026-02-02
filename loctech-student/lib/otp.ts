// otp.ts
import crypto from "crypto";

export type OtpOptions = {
  /** number of digits for numeric OTP (default 6). */
  length?: number;
  /** OTP lifetime in seconds (default 300 = 5 minutes). */
  ttlSeconds?: number;
  /** If true, returns an alphanumeric token instead of numeric (default false). */
  alphaNumeric?: boolean;
};

export type GeneratedOtp = {
  /** Plain OTP value (send this to user via SMS/email). Keep secure. */
  otp: string;
  /** ISO timestamp when OTP expires. */
  expiresAt: string;
  /** Creation timestamp ISO. */
  createdAt: string;
  /** Random salt used for hashing (hex). Store with hash in DB. */
  salt: string;
  /** HMAC-SHA256 hash of otp + salt (hex). Store this in DB. */
  hash: string;
};

/**
 * Generate an OTP string (numeric or alphanumeric).
 */
function generateOtpString(length: number, alphaNumeric = false): string {
  if (!alphaNumeric) {
    // generate numeric OTP with secure random
    // produce a string of digits of requested length
    let otp = "";
    // use crypto.randomInt to avoid modulo bias per digit
    for (let i = 0; i < length; i++) {
      otp += crypto.randomInt(0, 10).toString();
    }
    return otp;
  } else {
    // alphanumeric (upper+lower+digits), secure random from bytes
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto.randomBytes(length);
    let otp = "";
    for (let i = 0; i < length; i++) {
      const idx = bytes[i] % alphabet.length;
      otp += alphabet.charAt(idx);
    }
    return otp;
  }
}

/**
 * Create HMAC-SHA256 hash of the OTP using a salt (random key).
 * Returns hex encoded hash.
 */
function hashOtp(otp: string, salt: string) {
  // Use HMAC with the salt as key for tamper-evidence
  return crypto.createHmac("sha256", salt).update(otp).digest("hex");
}

/**
 * Securely compare two hex strings using timingSafeEqual.
 * Returns false if lengths mismatch or if comparison fails.
 */
function secureCompareHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/**
 * Create an OTP bundle: plain OTP (to send), salt, hash and expiry.
 *
 * NOTE: Save only `hash` and `salt` to your DB, not the plain `otp`.
 * Use `verifyOtp` to validate an incoming OTP.
 */
export function createOtp(options: OtpOptions = {}): GeneratedOtp {
  const length = options.length && options.length > 0 ? options.length : 6;
  const ttlSeconds =
    options.ttlSeconds && options.ttlSeconds > 0 ? options.ttlSeconds : 300;
  const alphaNumeric = !!options.alphaNumeric;

  const otp = generateOtpString(length, alphaNumeric);
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashOtp(otp, salt);

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ttlSeconds * 1000);

  return {
    otp,
    salt,
    hash,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Verify a provided OTP against stored hash+salt and expiry timestamp.
 *
 * @param providedOtp - OTP submitted by user (string)
 * @param storedHash - hex string stored in DB
 * @param storedSalt - hex string stored in DB
 * @param expiresAtIso - ISO expiry timestamp stored in DB
 * @returns boolean (true if valid and not expired)
 */
export function verifyOtp(
  providedOtp: string,
  storedHash: string,
  storedSalt: string,
  expiresAtIso: string
): { valid: boolean; reason?: "expired" | "invalid" | "ok" } {
  // check expiry
  const now = new Date();
  const expiresAt = new Date(expiresAtIso);
  if (isNaN(expiresAt.getTime()) || now > expiresAt) {
    return { valid: false, reason: "expired" };
  }

  const computed = hashOtp(providedOtp, storedSalt);

  if (!secureCompareHex(computed, storedHash)) {
    return { valid: false, reason: "invalid" };
  }

  return { valid: true, reason: "ok" };
}
