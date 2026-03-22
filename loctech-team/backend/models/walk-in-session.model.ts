import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

/**
 * Walk-in session - used for barcode sign-in.
 * Expires when a new session is created (not daily reset).
 * Creating a new session invalidates all previous sessions.
 */
const WalkInSessionSchema = new Schema(
  {
    barcode: { type: String, required: true, unique: true, index: true },
    secret: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

WalkInSessionSchema.index({ expiresAt: 1 });

export type WalkInSession = InferSchemaType<typeof WalkInSessionSchema>;

export const WalkInSessionModel: Model<WalkInSession> =
  (mongoose.models.WalkInSession as Model<WalkInSession>) ||
  mongoose.model<WalkInSession>("WalkInSession", WalkInSessionSchema);
