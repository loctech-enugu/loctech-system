import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log(req);

  await connectToDatabase();
  try {
    // eslint-disable-next-line
  } catch (error) {}

  return NextResponse.json({
    message: "Sorry, Feature not available yet",
    success: false,
    status: 400,
  });
}
