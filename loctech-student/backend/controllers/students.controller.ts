import { render } from "@react-email/render";
import { authConfig, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { EnrollmentModel } from "../models/enrollment.model";
import { StudentModel } from "../models/students.model";
import { Student } from "@/types";
import { SlackService } from "../services/slack.service";
import { ResendService } from "../services/resend.service";
import { buildStudentRegistrationBlock } from "@/lib/slack-blocks";
import StudentWelcomeEmail from "@/emails/student-welcome";

/**
 * Format student for client
 */
/* eslint-disable */
export const formatStudent = (student: Record<string, any>): Student => ({
  id: String(student._id),
  name: student.name,
  email: student.email,
  address: student.address,
  dateOfBirth: student.dateOfBirth
    ? new Date(student.dateOfBirth).toISOString()
    : "",
  highestQualification: student.highestQualification,
  phone: student.phone,
  stateOfOrigin: student.stateOfOrigin,
  nationality: student.nationality,
  occupation: student.occupation,
  heardFrom: student.heardFrom,
  status: student.status,

  nextOfKin: {
    name: student.nextOfKin?.name || "",
    relationship: student.nextOfKin?.relationship || "",
    contact: student.nextOfKin?.contact || "",
  },

  courses: [], // Deprecated - students enroll via classes

  createdAt: student.createdAt
    ? new Date(student.createdAt).toISOString()
    : undefined,
  updatedAt: student.updatedAt
    ? new Date(student.updatedAt).toISOString()
    : undefined,
  hasPassword: student.passwordHash ? true : false,
});
/**
 * GET STUDENT'S OWN ENROLLMENTS
 */
export const getMyEnrollments = async () => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const enrollments = await EnrollmentModel.find({
    studentId: session.user.id,
  })
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
    .sort("-createdAt")
    .lean();

  return enrollments.map((enrollment: any) => ({
    id: String(enrollment._id),
    studentId: String(enrollment.studentId),
    classId: String(enrollment.classId?._id || enrollment.classId),
    status: enrollment.status,
    pauseReason: enrollment.pauseReason,
    startDate: enrollment.startDate
      ? (enrollment.startDate as Date)?.toISOString?.()
      : null,
    endDate: enrollment.endDate
      ? (enrollment.endDate as Date)?.toISOString?.()
      : null,
    class: enrollment.classId
      ? {
        id: String(enrollment.classId._id),
        name: enrollment.classId.name,
        schedule: enrollment.classId.schedule,
        status: enrollment.classId.status,
        courseId: String(enrollment.classId.courseId?._id || enrollment.classId.courseId),
        course: enrollment.classId.courseId
          ? {
            id: String(enrollment.classId.courseId._id),
            title: enrollment.classId.courseId.title,
            courseRefId: enrollment.classId.courseId.courseRefId,
          }
          : null,
        instructor: enrollment.classId.instructorId
          ? {
            id: String(enrollment.classId.instructorId._id),
            name: enrollment.classId.instructorId.name,
            email: enrollment.classId.instructorId.email,
          }
          : null,
      }
      : null,
    createdAt: (enrollment.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (enrollment.updatedAt as Date)?.toISOString?.() ?? "",
  }));
};

/**
 * GET STUDENT PROFILE
 */
export const getMyProfile = async (userId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Students can only view their own profile
  if (session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  const student = await StudentModel.findById(userId)
    .select("-passwordHash")
    .lean();

  if (!student) {
    throw new Error("Student not found");
  }

  return {
    id: String(student._id),
    name: student.name,
    email: student.email,
    phone: student.phone,
    address: student.address,
    dateOfBirth: (student.dateOfBirth as Date)?.toISOString?.() ?? "",
    highestQualification: student.highestQualification,
    stateOfOrigin: student.stateOfOrigin,
    nationality: student.nationality,
    occupation: student.occupation,
    heardFrom: student.heardFrom,
    status: student.status,
    nextOfKin: student.nextOfKin,
    createdAt: (student.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (student.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * UPDATE STUDENT PROFILE
 */
export const updateMyProfile = async (
  userId: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    nextOfKin: {
      name: string;
      relationship: string;
      contact: string;
    };
  }>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Students can only update their own profile
  if (session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  const updateData: Record<string, any> = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.phone) updateData.phone = data.phone;
  if (data.address) updateData.address = data.address;
  if (data.nextOfKin) updateData.nextOfKin = data.nextOfKin;

  const student = await StudentModel.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  )
    .select("-passwordHash")
    .lean();

  if (!student) {
    throw new Error("Student not found");
  }

  return {
    id: String(student._id),
    name: student.name,
    email: student.email,
    phone: student.phone,
    address: student.address,
    dateOfBirth: (student.dateOfBirth as Date)?.toISOString?.() ?? "",
    highestQualification: student.highestQualification,
    stateOfOrigin: student.stateOfOrigin,
    nationality: student.nationality,
    occupation: student.occupation,
    heardFrom: student.heardFrom,
    status: student.status,
    nextOfKin: student.nextOfKin,
    createdAt: (student.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (student.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * Create student
 */
export const createStudent = async (
  data: Partial<Student>
): Promise<Student | null> => {
  await connectToDatabase();

  let password: string | null = null;
  // 1. Generate password if not provided
  if (!password && data.name) {
    const normalizedName = data.name.toLowerCase().replace(/\s+/g, "");
    password = `${normalizedName}@loctech`;
  }

  const normalizedEmail = data.email?.toLowerCase().replace(/\s+/g, "");

  // Check if student already exists
  const existingStudent = await StudentModel.findOne({ email: normalizedEmail });
  if (existingStudent) {
    return formatStudent(existingStudent.toObject());
  }

  // Hash password
  const passwordHash = await hashPassword(password as string);
  const newStudent = await StudentModel.create({
    ...data,
    passwordHash,
    email: normalizedEmail,
    status: "pending",
  });

  await SlackService.sendChannelMessage(
    "#student-mgt",
    buildStudentRegistrationBlock(
      newStudent.name,
      newStudent.email,
      newStudent.phone,
      0 // No courses - enrollments are via classes
    )
  );

  // Send welcome email with login details to student
  const fromDomain = process.env.RESEND_DOMAIN ?? "";
  const studentPortalUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3001";
  const loginUrl = `${studentPortalUrl.replace(/\/$/, "")}/auth/login`;

  if (fromDomain && normalizedEmail) {
    try {
      const html = await render(
        StudentWelcomeEmail({
          name: newStudent.name ?? "Student",
          email: normalizedEmail,
          plainPassword: password as string,
          loginUrl,
        })
      );

      await ResendService.sendEmail({
        from: `Loctech Training Institute <hello@${fromDomain}>`,
        to: normalizedEmail,
        subject: "Welcome to Loctech – Your Student Portal Login Details",
        html,
      });
    } catch (emailError) {
      console.error("Failed to send student welcome email:", emailError);
      // Don't fail registration if email fails
    }
  }

  return formatStudent(newStudent.toObject());
};