import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

/**
 * Walk-in attendance: signInTime / signOutTime only.
 * Do NOT use recordedAt - use signInTime for sign-in timestamp.
 */
const WalkInAttendanceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    signInTime: { type: Date, required: true, default: Date.now },
    signOutTime: { type: Date },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    method: {
      type: String,
      enum: ["staff_assisted", "barcode"],
      default: "staff_assisted",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true, strict: true, collection: "walkinattendances" }
);

WalkInAttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
WalkInAttendanceSchema.index({ date: -1 });
WalkInAttendanceSchema.index({ signOutTime: 1 });

export type WalkInAttendance = InferSchemaType<typeof WalkInAttendanceSchema>;

export const WalkInAttendanceModel: Model<WalkInAttendance> =
  (mongoose.models.WalkInAttendance as Model<WalkInAttendance>) ||
  mongoose.model<WalkInAttendance>("WalkInAttendance", WalkInAttendanceSchema);
