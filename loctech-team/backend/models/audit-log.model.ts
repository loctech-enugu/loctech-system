import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String },
    userName: { type: String },
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
      ],
      index: true,
    },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ resource: 1, action: 1 });

export type AuditLog = InferSchemaType<typeof AuditLogSchema>;

export const AuditLogModel: Model<AuditLog> =
  (mongoose.models.AuditLog as Model<AuditLog>) ||
  mongoose.model<AuditLog>("AuditLog", AuditLogSchema);
