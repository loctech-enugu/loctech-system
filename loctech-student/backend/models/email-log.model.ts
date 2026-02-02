import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const EmailLogSchema = new Schema(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "EmailTemplate",
      index: true,
    },
    recipientEmail: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "delivered", "bounced"],
      default: "pending",
      index: true,
    },
    errorMessage: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for performance
EmailLogSchema.index({ recipientEmail: 1, createdAt: -1 });
EmailLogSchema.index({ status: 1, createdAt: -1 });

export type EmailLog = InferSchemaType<typeof EmailLogSchema>;

export const EmailLogModel: Model<EmailLog> =
  (mongoose.models.EmailLog as Model<EmailLog>) ||
  mongoose.model<EmailLog>("EmailLog", EmailLogSchema);
