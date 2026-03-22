import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const AssignmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    maxScore: { type: Number, required: true, default: 100 },
    dueDate: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ classId: 1, dueDate: -1 });

export type Assignment = InferSchemaType<typeof AssignmentSchema>;

export const AssignmentModel: Model<Assignment> =
  (mongoose.models.Assignment as Model<Assignment>) ||
  mongoose.model<Assignment>("Assignment", AssignmentSchema);
