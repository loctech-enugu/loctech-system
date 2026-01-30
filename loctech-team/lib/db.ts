import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

interface GlobalWithMongooseCache {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const globalWithMongoose = global as typeof global & GlobalWithMongooseCache;

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = { conn: null, promise: null };
}

export function registerModels() {
  // Core models
  if (!mongoose.models.Student) import("@/backend/models/students.model");
  if (!mongoose.models.Course) import("@/backend/models/courses.model");
  if (!mongoose.models.User) import("@/backend/models/user.model");
  if (!mongoose.models.Session) import("@/backend/models/session.model");

  // Academic structure models
  if (!mongoose.models.Class) import("@/backend/models/class.model");
  if (!mongoose.models.Enrollment) import("@/backend/models/enrollment.model");
  if (!mongoose.models.Notification) import("@/backend/models/notification.model");
  if (!mongoose.models.ClassAttendance) import("@/backend/models/class-attendance.model");

  // Attendance models
  if (!mongoose.models.StudentAttendance) import("@/backend/models/students-attendance.model");
  if (!mongoose.models.Attendance) import("@/backend/models/attendance.model");

  // CBT models
  if (!mongoose.models.Exam) import("@/backend/models/exam.model");
  if (!mongoose.models.Question) import("@/backend/models/question.model");
  if (!mongoose.models.Category) import("@/backend/models/category.model");
  if (!mongoose.models.UserExam) import("@/backend/models/user-exam.model");
  if (!mongoose.models.UserAnswer) import("@/backend/models/user-answer.model");
  if (!mongoose.models.EmailTemplate) import("@/backend/models/email-template.model");
  if (!mongoose.models.EmailLog) import("@/backend/models/email-log.model");

  // Other models
  if (!mongoose.models.Announcement) import("@/backend/models/annoucement.model");
  if (!mongoose.models.DailyReport) import("@/backend/models/daily-report.model");
  if (!mongoose.models.Leave) import("@/backend/models/leave.model");
  if (!mongoose.models.LessonSchedule) import("@/backend/models/lesson-schedule.model");
  if (!mongoose.models.PasswordResetToken) import("@/backend/models/password-reset-token.model");
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const cache = globalWithMongoose.mongooseCache!;
  registerModels(); // 👈 automatically register models after connecting
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }
  cache.conn = await cache.promise;

  registerModels(); // 👈 automatically register models after connecting
  return cache.conn;
}
