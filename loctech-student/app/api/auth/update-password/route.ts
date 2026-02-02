import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authConfig, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { StudentModel } from "@/backend/models/students.model";

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

    const user = await StudentModel.findOne({ email: session.user.email });
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Get passwordHash if it exists
    const userWithPassword = await StudentModel.findOne({ email: session.user.email })
      .select("+passwordHash")
      .lean();
    if (!userWithPassword || !userWithPassword.passwordHash) {
      return errorResponse("Password not set for this account", 400);
    }
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // 🔐 Verify current password
    const isMatch = await bcrypt.compare(current_password, userWithPassword.passwordHash);
    if (!isMatch) {
      return errorResponse("Current password is incorrect", 400);
    }

    // 🧂 Hash and save new password
    const hashed = await hashPassword(password);
    await StudentModel.updateOne(
      { email: session.user.email },
      { passwordHash: hashed }
    );

    const updatedUser = await StudentModel.findOne({ email: session.user.email })
      .select("-passwordHash")
      .lean();

    return successResponse(updatedUser, "Password updated successfully");
  } catch (error) {
    console.error("Error updating password:", error);
    return errorResponse("Failed to update password", 500);
  }
}
