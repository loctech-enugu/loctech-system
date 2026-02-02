import { PasswordResetController } from "@/backend/controllers/password-reset.controller";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return PasswordResetController.forgotPassword(req);
}
