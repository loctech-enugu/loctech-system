import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const StudentLessonProgressSchema = new Schema(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: "CourseLearning", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    htmlCode: { type: String, default: "" },
    cssCode: { type: String, default: "" },
    jsCode: { type: String, default: "" },
    isCompleted: { type: Boolean, default: false },
    lastRunAt: { type: Date },
  },
  { timestamps: true }
);

StudentLessonProgressSchema.index({ lessonId: 1, studentId: 1 }, { unique: true });

export type StudentLessonProgress = InferSchemaType<typeof StudentLessonProgressSchema>;

export const StudentLessonProgressModel: Model<StudentLessonProgress> =
  (mongoose.models.StudentLessonProgress as Model<StudentLessonProgress>) ||
  mongoose.model<StudentLessonProgress>("StudentLessonProgress", StudentLessonProgressSchema);
