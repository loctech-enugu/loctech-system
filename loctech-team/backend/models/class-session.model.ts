import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ClassSessionSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    dateKey: { type: String, required: true }, // Format: YYYY-MM-DD
    pin: { type: String, required: true }, // 6-digit PIN
    barcode: { type: String, required: true }, // Barcode data
    secret: { type: String, required: true }, // Secret for barcode validation
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Unique constraint: one session per class per day
ClassSessionSchema.index({ classId: 1, dateKey: 1 }, { unique: true });

export type ClassSession = InferSchemaType<typeof ClassSessionSchema>;

export const ClassSessionModel: Model<ClassSession> =
  (mongoose.models.ClassSession as Model<ClassSession>) ||
  mongoose.model<ClassSession>("ClassSession", ClassSessionSchema);
