import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const GradeConfigSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", index: true },
    attendanceWeight: { type: Number, default: 20, min: 0, max: 100 },
    assignmentWeight: { type: Number, default: 30, min: 0, max: 100 },
    examWeight: { type: Number, default: 50, min: 0, max: 100 },
    attendanceThreshold: { type: Number, default: 70, min: 0, max: 100 },
    passingScore: { type: Number, default: 60, min: 0, max: 100 },
    isGlobal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

GradeConfigSchema.index({ classId: 1 }, { unique: true, sparse: true });
GradeConfigSchema.index({ isGlobal: 1 });

export type GradeConfig = InferSchemaType<typeof GradeConfigSchema>;

export const GradeConfigModel: Model<GradeConfig> =
  (mongoose.models.GradeConfig as Model<GradeConfig>) ||
  mongoose.model<GradeConfig>("GradeConfig", GradeConfigSchema);
