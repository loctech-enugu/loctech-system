import {
  getAllUsers,
  createUser,
} from "@/backend/controllers/users.controller";
import { UserModel } from "@/backend/models/user.model";
import { authConfig } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { userLinks } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

// GET all users
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session) {
      return errorResponse("Please login", 401);
    }
    if (session.user.role === "staff") {
      return errorResponse("Access denied", 403);
    }
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") ?? undefined;

    const users = await getAllUsers(role);
    if (!users) {
      return errorResponse("Error fetching users", 500);
    }

    return successResponse(users, "Users fetched successfully");
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500);
  }
}

// POST - create new user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || session.user.role === "staff") {
      return errorResponse("Access denied", 403);
    }
    revalidatePath(userLinks.users);

    const body = await req.json();
    const checkUser = await UserModel.findOne({ email: body.email });
    if (checkUser) {
      return errorResponse("User with this email already exists", 400);
    }
    const user = await createUser(body);
    if (!user) {
      return errorResponse("Error creating user", 500);
    }

    return successResponse(user, "User created successfully", 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500);
  }
}
