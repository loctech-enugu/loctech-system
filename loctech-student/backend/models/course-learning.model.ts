import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const CourseLearningSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    order: { type: Number, default: 0, index: true },
    contentHtml: { type: String, default: "" },
    starterHtml: { type: String, default: "" },
    starterCss: { type: String, default: "" },
    starterJs: { type: String, default: "" },
    estimatedMinutes: { type: Number, default: 15 },
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

CourseLearningSchema.index({ courseId: 1, order: 1 });

export type CourseLearning = InferSchemaType<typeof CourseLearningSchema>;

export const CourseLearningModel: Model<CourseLearning> =
  (mongoose.models.CourseLearning as Model<CourseLearning>) ||
  mongoose.model<CourseLearning>("CourseLearning", CourseLearningSchema);
