import { NextRequest, NextResponse } from "next/server";
import {
  getAllCategories,
  createCategory,
} from "@/backend/controllers/categories.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    // eslint-disable-next-line
    const filters: any = {};
    if (isActive !== null) filters.isActive = isActive === "true";

    const categories = await getAllCategories(filters);

    return NextResponse.json({
      success: true,
      data: categories,
    });
    // eslint-disable-next-line
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category = await createCategory(body);

    return NextResponse.json({
      success: true,
      data: category,
      message: "Category created successfully",
    });
    // eslint-disable-next-line
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create category",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("already exists")
            ? 400
            : 500,
      }
    );
  }
}
