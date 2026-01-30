import { NextRequest, NextResponse } from "next/server";
import {
  getAllQuestions,
  createQuestion,
  bulkCreateQuestions,
} from "@/backend/controllers/questions.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const difficulty = searchParams.get("difficulty");
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const tags = searchParams.get("tags");

    const filters: any = {};
    if (categoryId) filters.categoryId = categoryId;
    if (difficulty) filters.difficulty = difficulty;
    if (type) filters.type = type;
    if (isActive !== null) filters.isActive = isActive === "true";
    if (search) filters.search = search;
    if (tags) filters.tags = tags.split(",");

    const questions = await getAllQuestions(filters);

    return NextResponse.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch questions",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if bulk create
    if (Array.isArray(body)) {
      const result = await bulkCreateQuestions(body);
      return NextResponse.json({
        success: true,
        data: result,
        message: "Questions created successfully",
      });
    }

    // Single question
    const question = await createQuestion(body);

    return NextResponse.json({
      success: true,
      data: question,
      message: "Question created successfully",
    });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create question",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}
