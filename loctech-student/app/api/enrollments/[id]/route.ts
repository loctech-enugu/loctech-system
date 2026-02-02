import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { EnrollmentModel } from "@/backend/models/enrollment.model";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const enrollment = await EnrollmentModel.findById(id)
            .populate("classId", "name courseId schedule status")
            .populate({
                path: "classId",
                populate: {
                    path: "courseId",
                    select: "title courseRefId",
                },
            })
            .populate({
                path: "classId",
                populate: {
                    path: "instructorId",
                    select: "name email",
                },
            })
            .lean();

        if (!enrollment) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Enrollment not found",
                },
                { status: 404 }
            );
        }
        console.log({ enrollment });

        // Students can only access their own enrollments
        if (String(enrollment.studentId) !== session.user.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Forbidden",
                },
                { status: 403 }
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const classData = enrollment.classId as any;

        const formatted = {
            id: String(enrollment._id),
            studentId: String(enrollment.studentId),
            classId: String(enrollment.classId?._id || enrollment.classId),
            status: enrollment.status,
            pauseReason: enrollment.pauseReason,
            startDate: enrollment.enrolledAt
                ? (enrollment.enrolledAt as Date)?.toISOString?.()
                : null,
            class: classData
                ? {
                    id: String(classData._id),
                    name: classData.name,
                    schedule: classData.schedule,
                    status: classData.status,
                    courseId: String(classData.courseId?._id || classData.courseId),
                    course: classData.courseId
                        ? {
                            id: String(classData.courseId._id),
                            title: classData.courseId.title,
                            courseRefId: classData.courseId.courseRefId,
                        }
                        : null,
                    instructor: classData.instructorId
                        ? {
                            id: String(classData.instructorId._id),
                            name: classData.instructorId.name,
                            email: classData.instructorId.email,
                        }
                        : null,
                }
                : null,
            createdAt: (enrollment.createdAt as Date)?.toISOString?.() ?? "",
            updatedAt: (enrollment.updatedAt as Date)?.toISOString?.() ?? "",
        };

        return NextResponse.json({
            success: true,
            data: formatted,
        });
    } catch (error: any) {
        console.error("Error fetching enrollment:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to fetch enrollment",
            },
            {
                status: error.message?.includes("Unauthorized")
                    ? 401
                    : error.message?.includes("Forbidden")
                        ? 403
                        : error.message?.includes("not found")
                            ? 404
                            : 500,
            }
        );
    }
}
