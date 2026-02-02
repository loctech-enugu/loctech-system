import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const BankDetailsSchema = new Schema(
  {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountHolder: { type: String, trim: true },
    branchCode: { type: String, trim: true, default: "N/A" },
    swiftCode: { type: String, trim: true, default: "N/A" },
    routingNumber: { type: String, trim: true, default: "N/A" },
    iban: { type: String, trim: true, default: "N/A" },
    ifscCode: { type: String, trim: true, default: "N/A" },
    isActive: { type: Boolean, default: true },
  },
  { _id: false } // prevent creating _id for the nested subdocument
);

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }, // ✅ required phone
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "staff", "super_admin", "instructor"],
      default: "staff",
      index: true,
    },
    title: {
      type: String,
      required: function () {
        return this.role !== "super_admin";
      },
      trim: true,
    },
    isActive: { type: Boolean, default: true },
    bankDetails: { type: BankDetailsSchema, required: false }, // ✅ optional
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema>;

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) ||
  mongoose.model<User>("User", UserSchema);
