import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const CourseSchema = new Schema(
  {
    // Core identifiers
    courseRefId: { type: String, required: true, unique: true, trim: true }, // e.g. CSC101
    title: { type: String, required: true, trim: true },
    description: { type: String },

    // Relationships
    instructors: [{ type: Schema.Types.ObjectId, ref: "User" }], // Multiple instructors can teach a course

    // New extended fields (API-driven)
    amount: { type: Number, default: 0 }, // Price or fee
    img: { type: String, trim: true }, // Cover image URL
    category: { type: String, trim: true },
    duration: { type: String, trim: true }, // e.g. "6 weeks"
    mode: { type: String, trim: true }, // e.g. "online", "offline", "hybrid"
    level: { type: String, trim: true }, // e.g. "beginner", "intermediate"
    learning: [{ type: String, trim: true }], // Learning objectives/outcomes
    requirement: [{ type: String, trim: true }], // Prerequisites
    overview: { type: String },
    videoUrl: { type: String, trim: true },
    curriculumUrl: { type: String, trim: true },
    featured: { type: Boolean, default: false },
    slug: { type: String, unique: true, trim: true },

    // Status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type Course = InferSchemaType<typeof CourseSchema>;

export const CourseModel: Model<Course> =
  (mongoose.models.Course as Model<Course>) ||
  mongoose.model<Course>("Course", CourseSchema);
