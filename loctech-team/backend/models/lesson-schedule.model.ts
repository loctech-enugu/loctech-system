// models/LessonSchedule.ts
import mongoose, { Schema, model, Document } from "mongoose";

export interface IStudentAck {
  studentId: Schema.Types.ObjectId;
  dateAcknowledged: Date;
  remarks?: string;
  attendance?: "present" | "absent" | "late";
  instructorAck?: IInstructorAck;
}

export interface IInstructorAck {
  instructorId: Schema.Types.ObjectId;
  dateAcknowledged: Date;
  remarks?: string;
}

export interface IAttachment {
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  storageProvider?: string;
}

// Main doc interface
export interface ILessonSchedule extends Document {
  courseId: Schema.Types.ObjectId;
  instructorId: Schema.Types.ObjectId;
  date: Date;
  moduleTitle: string;
  objectives: string[]; // or single string
  type: "Lesson" | "Assignment" | "Project";
  description?: string;
  attachments?: IAttachment[];
  studentAcks: IStudentAck[];
  instructorAck?: IInstructorAck;
  visibility: "public" | "enrolled" | "staff";
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    filename: String,
    size: Number,
    mimeType: String,
    storageProvider: String,
  },
  { _id: true }
);

const InstructorAckSchema = new Schema<IInstructorAck>(
  {
    instructorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateAcknowledged: { type: Date, required: true, default: () => new Date() },
    remarks: String,
  },
  { _id: false }
);

const StudentAckSchema = new Schema<IStudentAck>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    dateAcknowledged: { type: Date, required: true, default: () => new Date() },
    remarks: String,
    attendance: {
      type: String,
      enum: ["present", "absent", "late"],
      default: "present",
    },
    instructorAck: { type: InstructorAckSchema },
  },
  { _id: true }
);

const LessonScheduleSchema = new Schema<ILessonSchedule>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    moduleTitle: { type: String, required: true },
    objectives: { type: [String], default: [] },
    type: {
      type: String,
      enum: ["Lesson", "Assignment", "Project"],
      required: true,
      index: true,
    },
    description: String,
    attachments: { type: [AttachmentSchema], default: [] },
    studentAcks: { type: [StudentAckSchema], default: [] },
    visibility: {
      type: String,
      enum: ["public", "enrolled", "staff"],
      default: "enrolled",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
LessonScheduleSchema.index({ courseId: 1, date: 1 }); // calendar lookups
LessonScheduleSchema.index({ courseId: 1, type: 1 });
LessonScheduleSchema.index({ "studentAcks.studentId": 1 }); // query ack by student
LessonScheduleSchema.index({ instructorId: 1, date: 1 });

// Consider partial index for active schedules if you keep archived flag:
// LessonScheduleSchema.index({ courseId: 1, date: 1 }, { partialFilterExpression: { archived: { $ne: true } } });

export const LessonSchedule =
  mongoose.models.LessonSchedule ||
  model<ILessonSchedule>("LessonSchedule", LessonScheduleSchema);
