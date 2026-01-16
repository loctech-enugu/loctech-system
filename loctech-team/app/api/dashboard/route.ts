import { getDashboardStats } from "@/backend/controllers/dashboard.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

export async function GET() {
  try {
    const data = await getDashboardStats();
    return successResponse(data);
  } catch (error) {
    console.error(error);
    return errorResponse("Failed to fetch analytics", 500);
  }
}
