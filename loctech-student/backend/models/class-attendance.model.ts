import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const ClassAttendanceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true }, // class session date
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
    recordedAt: { type: Date, default: Date.now },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // instructor/admin
    method: {
      type: String,
      enum: ["barcode", "pin", "manual"],
      required: true,
    },
    pin: { type: String, trim: true }, // if used PIN
  },
  { timestamps: true }
);

// Ensure one attendance record per student per class per date
ClassAttendanceSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });

// Indexes for performance
ClassAttendanceSchema.index({ classId: 1, date: 1 });
ClassAttendanceSchema.index({ studentId: 1, date: -1 });

export type ClassAttendance = InferSchemaType<typeof ClassAttendanceSchema>;

export const ClassAttendanceModel: Model<ClassAttendance> =
  (mongoose.models.ClassAttendance as Model<ClassAttendance>) ||
  mongoose.model<ClassAttendance>("ClassAttendance", ClassAttendanceSchema);
