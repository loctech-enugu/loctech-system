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

// Index for automatic deletion of expired tokens
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetToken = InferSchemaType<
  typeof PasswordResetTokenSchema
>;

export const PasswordResetTokenModel: Model<PasswordResetToken> =
  (mongoose.models.PasswordResetToken as Model<PasswordResetToken>) ||
  mongoose.model<PasswordResetToken>(
    "PasswordResetToken",
    PasswordResetTokenSchema
  );
