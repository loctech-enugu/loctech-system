import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const StudentSchema = new Schema(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    highestQualification: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: false },

    // Origin / Identity
    stateOfOrigin: { type: String, required: true, trim: true },
    nationality: { type: String, required: true, trim: true },

    // Next of Kin
    nextOfKin: {
      name: { type: String, required: true, trim: true },
      relationship: { type: String, required: true, trim: true },
      contact: { type: String, required: true, trim: true },
    },

    // Course Relationship
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }], // many-to-many relationship

    // Other Info
    occupation: { type: String, required: true, trim: true },
    heardFrom: {
      type: String,
      required: true,
      enum: [
        "Google",
        "Facebook",
        "Twitter",
        "Others",
        "Loctech Website",
        "Radio",
        "Billboard",
        "Instagram",
        "Flyers",
        "Friends",
        "Other",
      ],
    },

    // Status (for admin tracking)
    status: {
      type: String,
      enum: ["active", "graduated", "suspended", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export type Student = InferSchemaType<typeof StudentSchema>;

// if (mongoose.models.Student && mongoose.models) delete mongoose.models.Student;

export const StudentModel: Model<Student> =
  (mongoose.models.Student as Model<Student>) ||
  mongoose.model<Student>("Student", StudentSchema);
