import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const StudentAttendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    staff: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },

    // Attendance Status
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
    },

    // Optional: exact times for sign in / out
    signInTime: { type: Date },
    signOutTime: { type: Date },

    // e.g. "Arrived 15 mins late due to transport issues"
    notes: { type: String },
  },
  { timestamps: true }
);

export type StudentAttendance = InferSchemaType<typeof StudentAttendanceSchema>;

export const StudentAttendanceModel: Model<StudentAttendance> =
  (mongoose.models.StudentAttendance as Model<StudentAttendance>) ||
  mongoose.model<StudentAttendance>(
    "StudentAttendance",
    StudentAttendanceSchema
  );
