import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const InquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true },
    courseOfInterest: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new",
      index: true,
    },
    respondedAt: { type: Date },
    respondedBy: { type: Schema.Types.ObjectId, ref: "User" },
    convertedToStudentId: { type: Schema.Types.ObjectId, ref: "Student" },
    autoReplySent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

InquirySchema.index({ createdAt: -1 });
InquirySchema.index({ status: 1 });

export type Inquiry = InferSchemaType<typeof InquirySchema>;

export const InquiryModel: Model<Inquiry> =
  (mongoose.models.Inquiry as Model<Inquiry>) ||
  mongoose.model<Inquiry>("Inquiry", InquirySchema);
