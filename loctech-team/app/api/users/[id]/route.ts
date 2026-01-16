import {
  getUserById,
  updateUser,
  deleteUser,
} from "@/backend/controllers/users.controller";
import { authConfig } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { userLinks } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

// GET user by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return errorResponse("Please login", 401);
    }
    if (session.user.role !== "admin") {
      return errorResponse("Access denied", 403);
    }
    const { id } = await params;

    const user = await getUserById(id);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse(user, "User fetched successfully");
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500);
  }
}

// PUT - update user
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || session.user.role !== "super_admin") {
      return errorResponse("Access denied", 403);
    }
    revalidatePath(userLinks.users);

    const { id } = await params;
    const body = await req.json();
    const user = await updateUser(id, body);
    if (!user) {
      return errorResponse("Error updating user", 500);
    }

    return successResponse(user, "User updated successfully");
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500);
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "super_admin")
    ) {
      return errorResponse("Access denied", 403);
    }

    const { id } = await params;
    const deleted = await deleteUser(id);
    if (!deleted) {
      return errorResponse("Error deleting user", 500);
    }
    revalidatePath(userLinks.users);

    return successResponse(null, "User deleted successfully");
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500);
  }
}
