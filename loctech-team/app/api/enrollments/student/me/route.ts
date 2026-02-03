import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { EnrollmentModel } from "@/backend/models/enrollment.model";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }


    await connectToDatabase();

    const enrollments = await EnrollmentModel.find({
      studentId: session.user.id,
    })
      .populate("classId", "name schedule courseId")
      .populate("studentId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedEnrollments = enrollments.map((enrollment: any) => ({
      id: String(enrollment._id),
      studentId: String(enrollment.studentId?._id || enrollment.studentId),
      classId: String(enrollment.classId?._id || enrollment.classId),
      status: enrollment.status,
      pauseReason: enrollment.pauseReason,
      startDate: (enrollment.startDate as Date)?.toISOString?.() ?? "",
      endDate: enrollment.endDate
        ? (enrollment.endDate as Date)?.toISOString?.()
        : null,
      student: enrollment.studentId
        ? {
          id: String(enrollment.studentId._id),
          name: enrollment.studentId.name,
          email: enrollment.studentId.email,
        }
        : null,
      class: enrollment.classId
        ? {
          id: String(enrollment.classId._id),
          name: enrollment.classId.name,
          schedule: enrollment.classId.schedule,
          courseId: String(enrollment.classId.courseId || ""),
        }
        : null,
      createdAt: (enrollment.createdAt as Date)?.toISOString?.() ?? "",
      updatedAt: (enrollment.updatedAt as Date)?.toISOString?.() ?? "",
    }));

    return NextResponse.json({
      success: true,
      data: formattedEnrollments,
    });
  } catch (error: unknown) {
    console.error("Error fetching student enrollments:", error, request.url);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch enrollments";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
