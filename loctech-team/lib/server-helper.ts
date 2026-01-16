import { ApiResponse } from "@/types";
import { NextRequest } from "next/server";

/**
 * Extracts and returns the request body in a normalized way.
 * - For JSON: returns the parsed object.
 * - For form data: returns an object with key-value pairs.
 * - For plain text: returns the string.
 * Returns null if parsing fails or body is empty.
 */
export async function extractBodyAsJson(
  request: NextRequest
): Promise<unknown | null> {
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      return body && Object.keys(body).length > 0 ? body : null;
    }
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      const result: Record<string, unknown> = {};
      for (const [key, value] of form.entries()) {
        result[key] = value;
      }
      return Object.keys(result).length > 0 ? result : null;
    }
    // Fallback: treat entire body as plain text
    const text = await request.text();
    return text && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}
import { NextResponse } from "next/server";

export function successResponse<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, message, data },
    { status }
  );
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json<ApiResponse>(
    { success: false, message, error: message },
    { status }
  );
}
