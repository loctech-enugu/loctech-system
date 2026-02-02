import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const ViolationSchema = new Schema(
  {
    type: { type: String, required: true }, // "tab-switch", "exit-fullscreen", etc.
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const UserExamSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    attemptNumber: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "EXPIRED", "CANCELLED"],
      default: "NOT_STARTED",
      index: true,
    },
    startTime: { type: Date },
    endTime: { type: Date },
    submittedAt: { type: Date },
    score: { type: Number },
    percentage: { type: Number },
    timeSpent: { type: Number }, // minutes
    violations: { type: [ViolationSchema], default: [] },
    violationCount: { type: Number, default: 0 },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }], // randomized question set
  },
  { timestamps: true }
);

// Ensure one exam attempt per student per exam per attempt number
UserExamSchema.index({ userId: 1, examId: 1, attemptNumber: 1 }, { unique: true });

// Indexes for performance
UserExamSchema.index({ examId: 1, status: 1 });
UserExamSchema.index({ userId: 1, status: 1 });

export type UserExam = InferSchemaType<typeof UserExamSchema>;

export const UserExamModel: Model<UserExam> =
  (mongoose.models.UserExam as Model<UserExam>) ||
  mongoose.model<UserExam>("UserExam", UserExamSchema);
