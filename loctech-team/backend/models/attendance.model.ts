import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const AttendanceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    validated: { type: Boolean, default: false, index: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    time: { type: Date, default: Date.now, index: true }, // server-side timestamp
    // Excuse handling
    isExcused: { type: Boolean, default: false },
    excusedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin/staff who excused

    // Late tracking
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Ensure one record per user per session
AttendanceSchema.index({ user: 1, session: 1 }, { unique: true });

// Optional: if you really want per-user+time unique, uncomment below
// AttendanceSchema.index({ user: 1, time: 1 }, { unique: true });

export type Attendance = InferSchemaType<typeof AttendanceSchema>;

export const AttendanceModel: Model<Attendance> =
  (mongoose.models.Attendance as Model<Attendance>) ||
  mongoose.model<Attendance>("Attendance", AttendanceSchema);
