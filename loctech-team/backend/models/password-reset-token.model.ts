import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const PasswordResetTokenSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ["user", "student"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Do not use a TTL index on expiresAt: MongoDB TTL uses the mongod clock, which can
// differ from the app server clock and delete valid tokens early (e.g. ~1 hour skew).
// Expiry is enforced in PasswordResetService; cleanupExpiredTokens can run on a schedule.

export type PasswordResetToken = InferSchemaType<
  typeof PasswordResetTokenSchema
>;

export const PasswordResetTokenModel: Model<PasswordResetToken> =
  (mongoose.models.PasswordResetToken as Model<PasswordResetToken>) ||
  mongoose.model<PasswordResetToken>(
    "PasswordResetToken",
    PasswordResetTokenSchema
  );
