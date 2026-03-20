/**
 * Drops the MongoDB `inquiries` collection so the Inquiry model can be used fresh
 * with the current schema (indexes recreated on next app write).
 *
 * ⚠️  DESTRUCTIVE: all inquiry documents are permanently deleted.
 *
 * Usage (from loctech-team):
 *   npx tsx scripts/invalidate-inquiries-collection.ts --yes
 *
 * Requires MONGODB_URI in .env.local
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });

const COLLECTION = "inquiries";

async function main() {
  const yes = process.argv.includes("--yes");
  if (!yes) {
    console.error(
      "\nRefusing to run: this drops ALL inquiry data.\n" +
        "Re-run with: npx tsx scripts/invalidate-inquiries-collection.ts --yes\n"
    );
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set. Add it to .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database handle missing after connect");
  }

  const cols = await db.listCollections({ name: COLLECTION }).toArray();
  if (cols.length === 0) {
    console.log(`Collection "${COLLECTION}" does not exist. Nothing to drop.`);
    await mongoose.disconnect();
    return;
  }

  await db.dropCollection(COLLECTION);
  console.log(
    `✅ Dropped collection "${COLLECTION}". New inquiries will use the current schema.`
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
