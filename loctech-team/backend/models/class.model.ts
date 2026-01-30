import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const ScheduleSchema = new Schema(
  {
    daysOfWeek: {
      type: [Number],
      required: true,
      validate: {
        validator: (days: number[]) => {
          return days.every((day) => day >= 0 && day <= 6);
        },
        message: "Days of week must be between 0 (Sunday) and 6 (Saturday)",
      },
    },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true }, // e.g. "12:00"
    timezone: { type: String, default: "Africa/Lagos" },
  },
  { _id: false }
);

const ClassSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true }, // e.g. "Web Dev - Morning Batch"
    schedule: { type: ScheduleSchema, required: true },
    capacity: { type: Number }, // optional
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for performance
ClassSchema.index({ courseId: 1, status: 1 });
ClassSchema.index({ instructorId: 1, status: 1 });
ClassSchema.index({ courseId: 1, instructorId: 1 });

export type Class = InferSchemaType<typeof ClassSchema>;

export const ClassModel: Model<Class> =
  (mongoose.models.Class as Model<Class>) ||
  mongoose.model<Class>("Class", ClassSchema);
