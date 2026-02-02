import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const EmailTemplateSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true }, // HTML template
    type: {
      type: String,
      enum: [
        "registration",
        "exam_published",
        "exam_submission",
        "result_published",
        "admin_registration",
        "exam_reminder",
        "system",
        "absence_notification",
      ],
      required: true,
      index: true,
    },
    variables: [{ type: String, trim: true }], // available template variables
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type EmailTemplate = InferSchemaType<typeof EmailTemplateSchema>;

export const EmailTemplateModel: Model<EmailTemplate> =
  (mongoose.models.EmailTemplate as Model<EmailTemplate>) ||
  mongoose.model<EmailTemplate>("EmailTemplate", EmailTemplateSchema);
