import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/backend/models/user.model";
import { hashPassword } from "@/lib/auth";

async function seedmain() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@loctechng.com";
  const name = process.env.SEED_ADMIN_NAME || "Admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin@loctechng2025";
  await connectToDatabase();
  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }
  const passwordHash = await hashPassword(password);
  await UserModel.create({ email, name, passwordHash, role: "admin" });
  console.log("Admin created:", email);
}

// main()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error(err);
//     process.exit(1);
//   });

export default seedmain;
