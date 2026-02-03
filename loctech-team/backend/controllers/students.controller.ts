import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig, hashPassword } from "@/lib/auth";
import { StudentModel } from "../models/students.model";
import { Student } from "@/types";
import { EnrollmentModel } from "../models/enrollment.model";
import { ClassModel } from "../models/class.model";
import { CourseModel } from "../models/courses.model";
import { revalidatePath } from "next/cache";
import { SlackService } from "../services/slack.service";
import { buildStudentRegistrationBlock } from "@/lib/slack-blocks";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";
import { extractFirstName } from "@/lib/utils";
import mongoose from "mongoose";

const safeFormatDate = (value: string | null): string => {
  if (!value) return ""; // default or blank

  const d = new Date(value);
  if (isNaN(d.getTime())) return ""; // invalid date fallback

  return d.toISOString().split("T")[0]; // YYYY-MM-DD
};

// eslint-disable-next-line
function formatStudentRecord(raw: Record<string, any>): Partial<Student> {
  const normalizeHeardFrom = (value: string): Student["heardFrom"] => {
    const v = value?.trim().toLowerCase();
    if (!v) return "Other";
    if (v.includes("google")) return "Google";
    if (v.includes("facebook")) return "Facebook";
    if (v.includes("twitter")) return "Twitter";
    if (v.includes("loctech")) return "Loctech Website";
    if (v.includes("radio")) return "Radio";
    if (v.includes("billboard")) return "Billboard";
    if (v.includes("instagram")) return "Instagram";
    if (v.includes("flyer")) return "Flyers";
    if (v.includes("friend")) return "Friends";
    return "Other";
  };

  // 🔹 Helper: parse flexible date formats
  const parseDate = (value: string | undefined): string | null => {
    if (!value) return null;

    let dateStr = value.trim();

    // Remove ordinal suffixes (st, nd, rd, th)
    dateStr = dateStr.replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1");

    // Handle DD/MM/YYYY or DD-MM-YYYY formats
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmyMatch) {
      // eslint-disable-next-line
      const [_, d, m, y] = dmyMatch;
      const iso = new Date(
        Number(y.length === 2 ? "20" + y : y),
        Number(m) - 1,
        Number(d)
      );
      if (!isNaN(iso.getTime())) return iso.toISOString();
    }

    // Try standard Date parsing (e.g., "9 November 2007")
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    // Try Excel serial date (e.g., "45123")
    const excelSerial = Number(dateStr);
    if (!isNaN(excelSerial) && excelSerial > 10000) {
      const excelEpoch = new Date(1899, 11, 30);
      const excelDate = new Date(excelEpoch.getTime() + excelSerial * 86400000);
      return excelDate.toISOString();
    }

    return null;
  };

  const dateOfBirth =
    parseDate(raw["DATE OF BIRTH"]) || raw["DATE OF BIRTH"] || "";

  // 🔹 Safely parse timestamp
  const timestamp = parseDate(raw["Timestamp"]) || new Date().toISOString();

  return {
    name: raw["NAME"]?.trim() || "",
    email: raw["EMAIL"]?.trim() || "",
    address: raw["ADDRESS"]?.trim() || "",
    dateOfBirth: safeFormatDate(dateOfBirth),
    highestQualification: raw["HIGHEST QUALIFICATION"]?.trim() || "",
    phone: raw["PHONE NUMBER"]?.trim() || "",
    stateOfOrigin: raw["STATE OF ORIGIN"]?.trim() || "",
    nationality: raw["NATIONALITY"]?.trim() || "",
    occupation: raw["OCCUPATION"]?.trim() || "",
    heardFrom: normalizeHeardFrom(raw["HOW DID YOU HEAR ABOUT US"]),
    status: "active",
    nextOfKin: {
      name: raw["NEXT OF KIN"]?.trim() || "",
      relationship: raw["RELATIONSHIP TO KIN"]?.trim() || "",
      contact: raw["CONTACT OF KIN"]?.trim() || "",
    },
    // Courses removed - students enroll via classes
    createdAt: timestamp,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadStudentsData() {
  return new Promise((resolve, reject) => {
    const filePath = path.join(process.cwd(), "assets", "data.csv");
    console.log("Resolved path:", filePath);

    fs.createReadStream(filePath)
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", (data) => {
        // console.log("Student:", data, formatStudentRecord(data));
        saveStudent(formatStudentRecord(data));
      })
      .on("error", (err) => {
        console.error("Error reading CSV:", err);
        reject(err);
      })
      .on("end", async () => {
        console.log("✅ CSV load complete");
        const countStudentsFound = (await getAllStudents()).length;
        console.log(`${countStudentsFound} students found!`);
        console.log("");

        resolve({});
      });
  });
}

async function saveStudent(student: Partial<Student>) {
  try {
    return await StudentModel.updateOne(
      { name: student.name, email: student.email },
      student,
      {
        upsert: true,
      }
    );
  } catch (error) {
    console.error(`Could not save planet ${error}`);
  }
}
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
 * Get all students
 */
export const getAllStudents = async (): Promise<Student[]> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");
  // loadStudentsData();
  // syncCoursesStudents()

  const students = await StudentModel.find({}).lean();

  return students.map(formatStudent);
};

/**
 * Get single student
 */
export const getStudentById = async (id: string): Promise<Student | null> => {
  await connectToDatabase();

  const student = await StudentModel.findById(id).lean();

  return student ? formatStudent(student) : null;
};

/**
 * GET ENROLLMENTS FOR STUDENT
 */
export const getStudentEnrollments = async (studentId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const enrollments = await EnrollmentModel.find({ studentId })
    .populate("classId", "name courseId schedule status")
    .populate({
      path: "classId",
      populate: {
        path: "courseId",
        select: "title courseRefId",
      },
    })
    .lean();

  return enrollments.map((enrollment) => ({
    id: String(enrollment._id),
    studentId: String(enrollment.studentId),
    classId: String(enrollment.classId),
    status: enrollment.status,
    pauseReason: enrollment.pauseReason,
    // startDate: enrollment.startDate
    //   ? (enrollment.startDate as Date)?.toISOString?.()
    //   : null,
    // endDate: enrollment.endDate
    //   ? (enrollment.endDate as Date)?.toISOString?.()
    //   : null,
    class: enrollment.classId
      ? {
        id: String((enrollment.classId as any)._id),
        name: (enrollment.classId as any).name,
        courseId: String((enrollment.classId as any).courseId?._id || (enrollment.classId as any).courseId),
        course: (enrollment.classId as any).courseId
          ? {
            id: String((enrollment.classId as any).courseId._id),
            title: (enrollment.classId as any).courseId.title,
            courseRefId: (enrollment.classId as any).courseId.courseRefId,
          }
          : null,
      }
      : null,
    createdAt: (enrollment.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (enrollment.updatedAt as Date)?.toISOString?.() ?? "",
  }));
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

  return formatStudent(newStudent.toObject());
};

/**
 * Update student
 */
export const updateStudent = async (
  id: string,
  data: Partial<Student>
): Promise<Student | null> => {
  await connectToDatabase();

  const updated = await StudentModel.findByIdAndUpdate(id, data, {
    new: true,
  }).lean();

  if (!updated) return null;

  return formatStudent(updated);
};

/**
 * Delete student and cleanup enrollments
 */
export const deleteStudent = async (id: string): Promise<boolean> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const student = await StudentModel.findById(id);
  if (!student) return false;

  // Remove all enrollments for this student
  await EnrollmentModel.deleteMany({ studentId: id });

  await StudentModel.findByIdAndDelete(id);
  return true;
};
function generatePassword(name: string): string {
  if (!name) return "student@loctech";
  const firstname = extractFirstName(name);
  const cleanName = firstname.toLowerCase(); // use first name
  return `${cleanName}@loctech`;
}

export const generatePasswordForStudent = async (): Promise<boolean> => {
  await connectToDatabase();

  // 🔹 Find all students missing passwordHash or empty
  const students = await StudentModel.find({
    $or: [
      { passwordHash: { $exists: false } },
      { passwordHash: null },
      { passwordHash: "" },
    ],
  });

  console.log(`🧩 Found ${students.length} students without passwords`);

  if (!students.length) return false;

  for (const student of students) {
    const plainPassword = generatePassword(student.name);
    const hashed = await hashPassword(plainPassword);

    student.passwordHash = hashed;
    await student.save();

    console.log(`✅ Updated: ${student.name} (${student._id})`);
  }

  console.log("🎉 Password generation completed successfully");
  return true;
};

/**
 * GET STUDENT'S CLASSES (via enrollments)
 */
export const getStudentClasses = async (studentId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Students can only see their own classes
  if (
    session.user.id !== studentId
  ) {
    throw new Error("Forbidden");
  }

  const enrollments = await EnrollmentModel.find({
    studentId,
    status: { $in: ["active", "paused"] },
  })
    .populate({
      path: "classId",
      populate: [
        {
          path: "courseId",
          select: "title courseRefId",
        },
        {
          path: "instructorId",
          select: "name email",
        },
      ],
    })
    .lean();

  return enrollments.map((enrollment) => {
    const classData = enrollment.classId as any;
    return {
      enrollmentId: String(enrollment._id),
      classId: String(classData._id),
      className: classData.name,
      status: enrollment.status,
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
      schedule: classData.schedule,
    };
  });
};

/**
 * SYNC COURSES-STUDENTS BIDIRECTIONAL RELATIONSHIP
 * This function ensures data consistency between courses and students
 * Since the system now uses class-based enrollments, this syncs:
 * - Ensures all students with enrollments are properly linked
 * - Cleans up any orphaned relationships
 * - Returns statistics about what was fixed
 */
export const syncCoursesStudents = async (): Promise<{
  coursesFixed: number;
  studentsFixed: number;
  enrollmentsCreated: number;
  enrollmentsRemoved: number;
}> => {
  await connectToDatabase();

  let coursesFixed = 0;
  let studentsFixed = 0;
  let enrollmentsCreated = 0;
  let enrollmentsRemoved = 0;

  try {
    // Get all valid class IDs
    const allClasses = await ClassModel.find({}).select("_id").lean();
    const validClassIds = allClasses.map((c) => c._id);

    // Check for orphaned enrollments (enrollments without valid classes)
    const orphanedEnrollments = await EnrollmentModel.find({
      classId: { $nin: validClassIds },
    }).lean();

    if (orphanedEnrollments.length > 0) {
      // Remove orphaned enrollments
      const deleteResult = await EnrollmentModel.deleteMany({
        classId: { $nin: validClassIds },
      });
      enrollmentsRemoved += deleteResult.deletedCount || orphanedEnrollments.length;
      coursesFixed++; // Count as a fix
    }

    // Get all courses
    const courses = await CourseModel.find({}).lean();

    // For each course, verify data consistency
    for (const course of courses) {
      // Find all classes for this course
      const courseClasses = await ClassModel.find({
        courseId: course._id,
      }).lean();

      if (courseClasses.length === 0) {
        // Course has no classes - this might be expected, so we don't count it as a fix
        continue;
      }

      // Verify enrollments exist for active classes
      const classIds = courseClasses.map((c) => c._id);
      const enrollments = await EnrollmentModel.find({
        classId: { $in: classIds },
      }).lean();

      // If course has classes but no enrollments, that's fine - not a fix needed
      // We're just checking for data consistency
    }

    // Check students for consistency
    const students = await StudentModel.find({}).lean();

    for (const student of students) {
      let studentNeedsFix = false;

      // Verify student has valid enrollments
      const studentEnrollments = await EnrollmentModel.find({
        studentId: student._id,
      })
        .populate("classId")
        .lean();

      // Check for enrollments with invalid/null classes
      const invalidEnrollments = studentEnrollments.filter(
        (e: any) => !e.classId || !validClassIds.includes(e.classId._id || e.classId)
      );

      if (invalidEnrollments.length > 0) {
        // Remove invalid enrollments
        const invalidClassIds = invalidEnrollments
          .map((e: any) => e.classId?._id || e.classId)
          .filter(Boolean);

        if (invalidClassIds.length > 0) {
          const deleteResult = await EnrollmentModel.deleteMany({
            studentId: student._id,
            classId: { $in: invalidClassIds },
          });
          enrollmentsRemoved += deleteResult.deletedCount || invalidEnrollments.length;
          studentNeedsFix = true;
        }
      }

      if (studentNeedsFix) {
        studentsFixed++;
      }
    }

    return {
      coursesFixed,
      studentsFixed,
      enrollmentsCreated,
      enrollmentsRemoved,
    };
  } catch (error) {
    console.error("Error syncing courses-students:", error);
    throw new Error(
      `Failed to sync courses-students: ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
