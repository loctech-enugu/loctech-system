import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authConfig, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/backend/models/user.model";
import { errorResponse, successResponse } from "@/lib/server-helper";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user?.email) {
      return errorResponse("Unauthorized", 401);
    }

    const { current_password, password, password_confirmation } =
      await req.json();

    // ✅ Validate input
    if (!current_password || !password || !password_confirmation) {
      return errorResponse("All fields are required", 400);
    }

    if (password !== password_confirmation) {
      return errorResponse("Password confirmation does not match", 400);
    }

    await connectToDatabase();

    const user = await UserModel.findOne({ email: session.user.email }).select(
      "+passwordHash"
    );
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // 🔐 Verify current password
    const isMatch = await bcrypt.compare(current_password, user.passwordHash);
    if (!isMatch) {
      return errorResponse("Current password is incorrect", 400);
    }

    // 🧂 Hash and save new password
    const hashed = await hashPassword(password);
    user.passwordHash = hashed;
    await user.save();

    return successResponse(user, "Password updated successfully");
  } catch (error) {
    console.error("Error updating password:", error);
    return errorResponse("Failed to update password", 500);
  }
}
