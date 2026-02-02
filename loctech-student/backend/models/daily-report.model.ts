import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const DailyReportSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // staff submitting report

    // Ensure one report per user per day
    date: {
      type: Date,
      required: true,
      index: true,
      default: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // normalize to start of day
        return now;
      },
    },

    // Report content
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    tasksCompleted: [{ type: String, trim: true }], // optional array of tasks
    blockers: { type: String, trim: true }, // what stopped progress
    planForTomorrow: { type: String, trim: true }, // optional

    // Status + review
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin/supervisor

    // Flags
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Prevent multiple reports for the same user on the same day
DailyReportSchema.index({ user: 1, date: 1 }, { unique: true });

export type DailyReport = InferSchemaType<typeof DailyReportSchema>;

export const DailyReportModel: Model<DailyReport> =
  (mongoose.models.DailyReport as Model<DailyReport>) ||
  mongoose.model<DailyReport>("DailyReport", DailyReportSchema);
