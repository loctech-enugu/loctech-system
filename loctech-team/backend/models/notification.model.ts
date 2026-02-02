import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["absence_streak", "enrollment_paused", "exam_reminder"],
      required: true,
    },
    absenceStreak: { type: Number, default: 0 }, // consecutive absences (for absence_streak type)
    notifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    }, // admin/staff who sent (optional for system-generated)
    emailSent: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
    isResolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    message: { type: String }, // Custom message for the notification
  },
  { timestamps: true }
);

// Indexes for performance
NotificationSchema.index({ studentId: 1, classId: 1 });
NotificationSchema.index({ classId: 1, type: 1 });
NotificationSchema.index({ sentAt: -1 });

export type Notification = InferSchemaType<typeof NotificationSchema>;

export const NotificationModel: Model<Notification> =
  (mongoose.models.Notification as Model<Notification>) ||
  mongoose.model<Notification>("Notification", NotificationSchema);
