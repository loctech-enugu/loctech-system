// models/Announcement.ts
import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User", // must be staff/admin
      required: true,
    },
    audience: {
      type: String,
      enum: ["all", "staff", "students"],
      default: "all",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
      // Optional: auto-hide after this date
    },
  },
  { timestamps: true }
);

// Index for efficient querying by audience and active status
AnnouncementSchema.index({ audience: 1, isActive: 1, createdAt: -1 });

export type Announcement = InferSchemaType<typeof AnnouncementSchema>;

export const AnnouncementModel: Model<Announcement> =
  (mongoose.models.Announcement as Model<Announcement>) ||
  mongoose.model<Announcement>("Announcement", AnnouncementSchema);
