import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const EnrollmentSchema = new Schema(
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
    status: {
      type: String,
      enum: ["active", "paused", "completed", "withdrawn"],
      default: "active",
      index: true,
    },
    pauseReason: { type: String, trim: true },
    enrolledAt: { type: Date, default: Date.now },
    pausedAt: { type: Date },
    resumedAt: { type: Date },
  },
  { timestamps: true }
);

// Ensure one enrollment per student per class
EnrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });

// Indexes for performance
EnrollmentSchema.index({ classId: 1, status: 1 });
EnrollmentSchema.index({ studentId: 1, status: 1 });

export type Enrollment = InferSchemaType<typeof EnrollmentSchema>;

export const EnrollmentModel: Model<Enrollment> =
  (mongoose.models.Enrollment as Model<Enrollment>) ||
  mongoose.model<Enrollment>("Enrollment", EnrollmentSchema);
