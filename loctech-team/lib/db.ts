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
  if (!mongoose.models.Student) import("@/backend/models/students.model");
  if (!mongoose.models.Course) import("@/backend/models/courses.model");
  if (!mongoose.models.User) import("@/backend/models/user.model");
  if (!mongoose.models.Session) import("@/backend/models/session.model");
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
