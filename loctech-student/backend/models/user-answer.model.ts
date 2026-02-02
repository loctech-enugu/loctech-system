import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const UserAnswerSchema = new Schema(
  {
    userExamId: {
      type: Schema.Types.ObjectId,
      ref: "UserExam",
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },
    answer: { type: Schema.Types.Mixed, required: true }, // string or string[]
    isCorrect: { type: Boolean, required: true },
    pointsEarned: { type: Number, required: true, default: 0 },
    timeSpent: { type: Number, required: true, default: 0 }, // seconds
  },
  { timestamps: true }
);

// Ensure one answer per question per exam attempt
UserAnswerSchema.index({ userExamId: 1, questionId: 1 }, { unique: true });

export type UserAnswer = InferSchemaType<typeof UserAnswerSchema>;

export const UserAnswerModel: Model<UserAnswer> =
  (mongoose.models.UserAnswer as Model<UserAnswer>) ||
  mongoose.model<UserAnswer>("UserAnswer", UserAnswerSchema);
