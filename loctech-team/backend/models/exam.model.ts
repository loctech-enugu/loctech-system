import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const ExamSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    duration: { type: Number, required: true }, // minutes
    totalQuestions: { type: Number, default: 0 },
    questionsPerStudent: { type: Number, default: 0 }, // 0 for all questions
    shuffleQuestions: { type: Boolean, default: false },
    passingScore: { type: Number, default: 0 }, // percentage 0-100
    maxAttempts: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    scheduledStart: { type: Date },
    expirationDate: { type: Date },
    showCorrectAnswers: { type: Boolean, default: false },
    showDetailedFeedback: { type: Boolean, default: false },
    autoPublishResults: { type: Boolean, default: false },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    courseId: { type: Schema.Types.ObjectId, ref: "Course" }, // optional course link
    classIds: [{ type: Schema.Types.ObjectId, ref: "Class" }], // optional class assignments
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Attendance eligibility (optional)
    requireMinimumAttendance: { type: Boolean, default: false },
    minimumAttendancePercentage: { type: Number, default: 0, min: 0, max: 100 }, // 0-100%
  },
  { timestamps: true }
);

// Indexes for performance
ExamSchema.index({ status: 1, scheduledStart: 1 });
ExamSchema.index({ courseId: 1 });
ExamSchema.index({ classIds: 1 });

export type Exam = InferSchemaType<typeof ExamSchema>;

export const ExamModel: Model<Exam> =
  (mongoose.models.Exam as Model<Exam>) ||
  mongoose.model<Exam>("Exam", ExamSchema);
