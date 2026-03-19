import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { EnrollmentModel } from "../models/enrollment.model";
import { ClassAttendanceModel } from "../models/class-attendance.model";
import { AssignmentModel } from "../models/assignment.model";
import { AssignmentGradeModel } from "../models/assignment-grade.model";
import { GradeConfigModel } from "../models/grade-config.model";
import { UserExamModel } from "../models/user-exam.model";
import { ExamModel } from "../models/exam.model";
import { ClassModel } from "../models/class.model";

/**
 * Get grade config for a class (or global default)
 */
async function getGradeConfig(classId: string) {
  let config = await GradeConfigModel.findOne({ classId }).lean();
  if (!config) {
    config = await GradeConfigModel.findOne({ isGlobal: true }).lean();
  }
  return config ?? {
    attendanceWeight: 20,
    assignmentWeight: 30,
    examWeight: 50,
    attendanceThreshold: 70,
    passingScore: 60,
  };
}

/**
 * Calculate attendance percentage for a student in a class
 */
export const getAttendancePercentage = async (
  studentId: string,
  classId: string
): Promise<number> => {
  await connectToDatabase();

  const [total, present] = await Promise.all([
    ClassAttendanceModel.countDocuments({ studentId, classId }),
    ClassAttendanceModel.countDocuments({
      studentId,
      classId,
      status: "present",
    }),
  ]);

  if (total === 0) return 100;
  return (present / total) * 100;
};

/**
 * Calculate assignment average for a student in a class
 */
export const getAssignmentAverage = async (
  studentId: string,
  classId: string
): Promise<{ average: number; totalGraded: number }> => {
  await connectToDatabase();

  const assignments = await AssignmentModel.find({ classId }).select("_id maxScore").lean();
  const grades = await AssignmentGradeModel.find({
    studentId,
    assignmentId: { $in: assignments.map((a) => a._id) },
  }).lean();

  if (grades.length === 0) return { average: 100, totalGraded: 0 };

  let totalEarned = 0;
  let totalMax = 0;
  for (const g of grades) {
    const assign = assignments.find((a) => String(a._id) === String(g.assignmentId));
    if (assign) {
      totalEarned += g.score;
      totalMax += assign.maxScore;
    }
  }

  if (totalMax === 0) return { average: 100, totalGraded: grades.length };
  return {
    average: (totalEarned / totalMax) * 100,
    totalGraded: grades.length,
  };
};

/**
 * Calculate exam average for a student in a class
 */
export const getExamAverage = async (
  studentId: string,
  classId: string
): Promise<{ average: number; totalAttempts: number }> => {
  await connectToDatabase();

  const examIds = await ExamModel.find({ classIds: classId }).distinct("_id");
  if (examIds.length === 0) return { average: 0, totalAttempts: 0 };

  const userExams = await UserExamModel.find({
    userId: studentId,
    status: "COMPLETED",
    examId: { $in: examIds },
  }).lean();

  if (userExams.length === 0) return { average: 0, totalAttempts: 0 };

  const totalPercentage = userExams.reduce((sum, ue) => sum + (ue.percentage ?? 0), 0);
  return {
    average: totalPercentage / userExams.length,
    totalAttempts: userExams.length,
  };
};

/**
 * Get overall grade for a student in a class
 */
export const getStudentClassGrade = async (
  studentId: string,
  classId: string
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const config = await getGradeConfig(classId) as {
    attendanceWeight: number;
    assignmentWeight: number;
    examWeight: number;
    attendanceThreshold: number;
    passingScore: number;
  };

  const [attendancePct, assignmentResult, examResult] = await Promise.all([
    getAttendancePercentage(studentId, classId),
    getAssignmentAverage(studentId, classId),
    getExamAverage(studentId, classId),
  ]);

  const assignmentPct = assignmentResult.totalGraded > 0 ? assignmentResult.average : 100;
  const examPct = examResult.totalAttempts > 0 ? examResult.average : 0;

  const overall =
    (attendancePct * config.attendanceWeight) / 100 +
    (assignmentPct * config.assignmentWeight) / 100 +
    (examPct * config.examWeight) / 100;

  return {
    attendancePercentage: attendancePct,
    assignmentAverage: assignmentResult.average,
    assignmentGradedCount: assignmentResult.totalGraded,
    examAverage: examResult.average,
    examAttempts: examResult.totalAttempts,
    overallGrade: Math.round(overall * 100) / 100,
    isPassing: overall >= config.passingScore,
    config: {
      attendanceWeight: config.attendanceWeight,
      assignmentWeight: config.assignmentWeight,
      examWeight: config.examWeight,
      passingScore: config.passingScore,
    },
  };
};

/**
 * Get grades for all students in a class (instructor/admin)
 */
export const getClassGrades = async (classId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const classDoc = await ClassModel.findById(classId).lean();
  if (!classDoc) throw new Error("Class not found");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    (session.user.role !== "instructor" ||
      String(classDoc.instructorId) !== session.user.id)
  ) {
    throw new Error("Forbidden");
  }

  const enrollments = await EnrollmentModel.find({
    classId,
    status: "active",
  })
    .populate("studentId", "name email")
    .lean();

  const grades = await Promise.all(
    enrollments.map(async (e) => {
      const enrollment = e as { studentId: { _id: string; name?: string; email?: string } | string };
      const studentRef = enrollment.studentId;
      const studentId = typeof studentRef === "string" ? studentRef : String(studentRef._id);
      const studentName = typeof studentRef === "object" ? studentRef.name : undefined;
      const studentEmail = typeof studentRef === "object" ? studentRef.email : undefined;
      const grade = await getStudentClassGrade(studentId, classId);
      return {
        studentId,
        studentName,
        studentEmail,
        ...grade,
      };
    })
  );

  return grades;
};
