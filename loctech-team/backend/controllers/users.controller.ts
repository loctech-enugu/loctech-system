import { connectToDatabase } from "@/lib/db";
import { UserModel } from "../models/user.model";
import { User } from "@/types";
import { hashPassword } from "@/lib/auth";
import { render } from "@react-email/components";
import WelcomeEmail from "@/emails/welcome";
import EmailService from "../services/email.service";
import mongoose from "mongoose";

// Get all users
export const getAllUsers = async (
  role?: string | undefined
): Promise<User[] | null> => {
  try {
    await connectToDatabase();
    // eslint-disable-next-line
    const filter: Record<string, any> = {};
    if (role) {
      filter.role = role;
    }
    const users = await UserModel.find(filter).sort("-createdAt");

    const formatted = users.map((user) => ({
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone ?? "",
      isActive: user.isActive,
      title: user.title ?? undefined,
      bankDetails: user.bankDetails ? user.bankDetails : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
    return formatted;
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    await connectToDatabase();
    const user = await UserModel.findById(id);
    if (!user) return null;

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      title: user.title ?? undefined,
      phone: user.phone ?? "",
      bankDetails: user.bankDetails ? user.bankDetails : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return null;
  }
};

// Create new user
export const createUser = async (data: Partial<User>): Promise<User | null> => {
  let session: mongoose.ClientSession | null = null;

  try {
    await connectToDatabase();
    session = await mongoose.startSession();
    session.startTransaction();

    // 1. Generate password if not provided
    let password = data.password as string | null;
    if (!password && data.name) {
      const normalizedName = data.name.toLowerCase().replace(/\s+/g, "");
      password = `${normalizedName}@loctech`;
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password as string);

    // 3. Create user (inside transaction)
    const user = await UserModel.create(
      [
        {
          ...data,
          passwordHash,
        },
      ],
      { session }
    );
    const createdUser = user[0];

    // 4. Prepare email data
    const mailData = {
      name: data.name ?? "",
      email: data.email ?? "",
      plainPassword: password ?? "",
    };

    const html = await render(WelcomeEmail(mailData));

    // 5. Send email (outside DB but *before* commit)
    const result = await EmailService.send({
      sender: {
        name: "Loctech IT Training Institute",
        address: "enquiries@loctechng.com",
      },
      recipients: [
        {
          name: mailData.name,
          address: mailData.email,
        },
      ],
      subject: "Welcome to Loctech Team",
      message: html,
    });

    if (!result.accepted || result.accepted.length === 0) {
      throw new Error("Failed to send welcome email");
    }

    // 6. Commit transaction only if all succeeded
    await session.commitTransaction();

    return {
      id: String(createdUser._id),
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
      isActive: createdUser.isActive,
      title: createdUser.title ?? undefined,
      phone: createdUser.phone ?? "",
      bankDetails: createdUser.bankDetails
        ? createdUser.bankDetails
        : undefined,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    };
  } catch (error) {
    console.error("Error creating user (rolling back):", error);
    if (session) {
      await session.abortTransaction();
    }
    return null;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

// Update user by ID
export const updateUser = async (
  id: string,
  data: Partial<User>
): Promise<User | null> => {
  try {
    await connectToDatabase();
    const user = await UserModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!user) return null;

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      phone: user.phone ?? "",
      bankDetails: user.bankDetails ? user.bankDetails : undefined,
      title: user.title ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return null;
  }
};

// Delete user by ID
export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    await connectToDatabase();
    const result = await UserModel.findByIdAndUpdate(
      id,
      { isActive: false },
      {
        new: true,
        runValidators: true,
      }
    );
    return !!result;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return false;
  }
};
