import { ObjectId } from "mongodb";

export type ScheduleType = "Lesson" | "Assignment" | "Project";

export interface Attachment {
  _id?: ObjectId | string;
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  storageProvider?: "s3" | "cdn" | "gridfs";
}

export interface StudentAck {
  studentId: ObjectId | string;
  dateAcknowledged: Date;
  remarks?: string;
  attendance?: "present" | "absent" | "late";
}

export interface InstructorAck {
  instructorId: ObjectId | string;
  dateAcknowledged: Date;
  remarks?: string;
  instructorAck?: InstructorAck;
}

export interface LessonSchedule {
  _id?: ObjectId | string;
  courseId: ObjectId | string;
  instructorId: ObjectId | string;
  date: Date; // day/time
  moduleTitle: string;
  objectives: string[]; // or single string if preferred
  type: ScheduleType;
  description?: string;
  attachments?: Attachment[];
  studentAcks?: StudentAck[]; // embeds many small acks
  createdAt?: Date;
  updatedAt?: Date;
  visibility?: "public" | "enrolled" | "staff";
}
