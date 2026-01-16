import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const SessionSchema = new Schema(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    secret: { type: String, required: true },
    session: { type: String, required: true },
    code: { type: String, required: true },
  },
  { timestamps: true }
);

export type Session = InferSchemaType<typeof SessionSchema>;

export const SessionModel: Model<Session> =
  (mongoose.models.Session as Model<Session>) ||
  mongoose.model<Session>("Session", SessionSchema);
