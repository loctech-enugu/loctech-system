import { SessionModel } from "@/backend/models/session.model";
import { connectToDatabase } from "@/lib/db";
import { createQrSessionToken, getDailySecret } from "@/lib/qr";

function getUtcDateKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const getTodaySession = async () => {
  try {
    await connectToDatabase();
    const dateKey = getUtcDateKey();
    const secret = getDailySecret();
    const session = createQrSessionToken();

    // Use upsert to create or update the session for today
    const sessionDoc = await SessionModel.findOneAndUpdate(
      { dateKey },
      { $setOnInsert: { secret, session } },
      { upsert: true, new: true }
    );

    console.log("sessionDoc", sessionDoc);

    return {
      date: sessionDoc.dateKey,
      secret: sessionDoc.secret,
      session: sessionDoc.session,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};
