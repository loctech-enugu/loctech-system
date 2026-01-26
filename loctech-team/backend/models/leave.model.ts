// models/LeaveRequest.ts
import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const LeaveRequestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // typically an admin or manager
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent overlapping requests per user (optional but recommended)
LeaveRequestSchema.index({ user: 1, startDate: 1, endDate: 1 });

export type LeaveRequest = InferSchemaType<typeof LeaveRequestSchema>;

export const LeaveRequestModel: Model<LeaveRequest> =
  (mongoose.models.LeaveRequest as Model<LeaveRequest>) ||
  mongoose.model<LeaveRequest>("LeaveRequest", LeaveRequestSchema);
