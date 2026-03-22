import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const AssignmentGradeSchema = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    score: { type: Number, required: true },
    feedback: { type: String, trim: true },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gradedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AssignmentGradeSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export type AssignmentGrade = InferSchemaType<typeof AssignmentGradeSchema>;

export const AssignmentGradeModel: Model<AssignmentGrade> =
  (mongoose.models.AssignmentGrade as Model<AssignmentGrade>) ||
  mongoose.model<AssignmentGrade>("AssignmentGrade", AssignmentGradeSchema);
