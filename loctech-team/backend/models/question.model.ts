import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const QuestionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["mcq", "true_false", "essay", "fill_blank", "matching"],
      required: true,
    },
    question: { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }], // for MCQ
    correctAnswer: { type: Schema.Types.Mixed, required: true }, // string or string[]
    explanation: { type: String, trim: true },
    points: { type: Number, required: true, default: 1 },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    tags: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Indexes for performance
QuestionSchema.index({ categoryId: 1, isActive: 1 });
QuestionSchema.index({ difficulty: 1, isActive: 1 });
QuestionSchema.index({ tags: 1 });

export type Question = InferSchemaType<typeof QuestionSchema>;

export const QuestionModel: Model<Question> =
  (mongoose.models.Question as Model<Question>) ||
  mongoose.model<Question>("Question", QuestionSchema);
