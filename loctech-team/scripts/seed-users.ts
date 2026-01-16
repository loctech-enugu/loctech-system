import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/backend/models/user.model";
import { hashPassword } from "@/lib/auth";

export const demoUsers = [
  // {
  //   email: "paschalanagha@gmail.com",
  //   name: "John Doe",
  //   password: "Demo1234",
  //   phone: "081000000000",
  //   role: "admin",
  //   title: "Lead Web Development Instructor",
  // },
  // {
  //   email: "jane.smith@loctech.com",
  //   name: "Jane Smith",
  //   password: "Demo1234",
  //   phone: "081000000000",
  //   role: "staff",
  //   title: "Frontend Instructor (React & Next.js)",
  // },
  // {
  //   email: "michael.lee@loctech.com",
  //   name: "Michael Lee",
  //   password: "Demo1234",
  //   role: "staff",
  //   title: "Backend Instructor (Node.js & Databases)",
  //   phone: "081000000000",
  // },
  // {
  //   email: "emily.jones@loctech.com",
  //   name: "Emily Jones",
  //   password: "Demo1234",
  //   role: "staff",
  //   phone: "081000000000",
  //   title: "DevOps & Cloud Instructor",
  // },
  {
    email: "superadmin@loctech.com",
    name: "Super Admin",
    password: "admin@loctechng2025",
    role: "super_admin",
    phone: "081000000000",
    // No title required for super_admin
  },
];

async function seedUsers() {
  await connectToDatabase();

  for (const userData of demoUsers) {
    const { email, password } = userData;

    const existing = await UserModel.findOne({ email });
    if (!existing) {
      const passwordHash = await hashPassword(password);
      await UserModel.create({ ...userData, passwordHash });
      console.log("Admin created:", email);
    }
  }
}

export default seedUsers;
