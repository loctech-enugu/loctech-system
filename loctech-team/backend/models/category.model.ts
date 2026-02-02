import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export type Category = InferSchemaType<typeof CategorySchema>;

export const CategoryModel: Model<Category> =
  (mongoose.models.Category as Model<Category>) ||
  mongoose.model<Category>("Category", CategorySchema);
