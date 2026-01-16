import { successResponse } from "@/lib/server-helper";
import { revalidatePath } from "next/cache";

export async function GET() {
  revalidatePath("admin/qr");
  successResponse({ ok: true });
}
