import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

/**
 * Inquiry / lead pipeline.
 * - Public submits: name, email, phone, courseOfInterest, heardAboutUs, message
 * - Team manages: customerCareId, lead, feedback, followUp, status, adminNote
 * Legacy status values (new, contacted, converted, closed) may still exist in DB;
 * normalize in controller when reading/filtering.
 */
const InquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true },
    courseOfInterest: { type: String, trim: true },
    heardAboutUs: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    /** Staff member handling this lead (customer care) */
    customerCareId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    lead: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "warm",
    },
    feedback: { type: String, trim: true },
    followUp: {
      type: String,
      enum: ["called", "text_whatsapp", "call_back"],
    },
    /** pending | registered | not_interested (+ legacy values in DB) */
    status: {
      type: String,
      default: "pending",
      index: true,
    },
    adminNote: { type: String, trim: true },
    respondedAt: { type: Date },
    respondedBy: { type: Schema.Types.ObjectId, ref: "User" },
    convertedToStudentId: { type: Schema.Types.ObjectId, ref: "Student" },
    autoReplySent: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "inquiries" }
);

InquirySchema.index({ createdAt: -1 });
InquirySchema.index({ status: 1, createdAt: -1 });

export type Inquiry = InferSchemaType<typeof InquirySchema>;

export const InquiryModel: Model<Inquiry> =
  (mongoose.models.Inquiry as Model<Inquiry>) ||
  mongoose.model<Inquiry>("Inquiry", InquirySchema);
