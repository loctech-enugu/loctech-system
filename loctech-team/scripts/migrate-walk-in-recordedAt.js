/**
 * Migration: Remove recordedAt from walk-in attendance, use signInTime only.
 * Run from loctech-team: node scripts/migrate-walk-in-recordedAt.js
 * Requires MONGODB_URI in .env.local
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set. Add to .env.local or pass as env var.");
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(uri);
  const coll = mongoose.connection.db.collection("walkinattendances");

  const withRecordedAt = await coll.countDocuments({ recordedAt: { $exists: true } });
  if (withRecordedAt === 0) {
    console.log("No documents with recordedAt found. Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${withRecordedAt} documents with recordedAt. Migrating...`);

  const result = await coll.updateMany(
    { recordedAt: { $exists: true } },
    [
      {
        $set: {
          signInTime: { $ifNull: ["$signInTime", "$recordedAt"] },
          recordedAt: "$$REMOVE",
        },
      },
    ]
  );

  console.log(`Updated ${result.modifiedCount} documents.`);
  console.log("Migration complete. recordedAt removed, signInTime set.");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
