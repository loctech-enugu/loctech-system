import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig, hashPassword } from "@/lib/auth";
import { StudentModel } from "../models/students.model";
import { Student } from "@/types";
import { CourseModel } from "../models/courses.model";
import { revalidatePath } from "next/cache";
import { SlackService } from "../services/slack.service";
import { buildStudentRegistrationBlock } from "@/lib/slack-blocks";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";
import { extractFirstName } from "@/lib/utils";

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
    courses: [],
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

  courses:
    student.courses?.map((c: Record<string, any>) => ({
      id: String(c._id),
      title: c.title || c.name || "",
      category: c.category || "",
    })) || [],

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

  const students = await StudentModel.find({})
    .populate("courses", "title category")
    .lean();

  return students.map(formatStudent);
};

/**
 * Get single student
 */
export const getStudentById = async (id: string): Promise<Student | null> => {
  await connectToDatabase();

  const student = await StudentModel.findById(id)
    .populate("courses", "name code")
    .lean();

  return student ? formatStudent(student) : null;
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

  // 2. Hash password
  const passwordHash = await hashPassword(password as string);
  const newStudent = await StudentModel.create({ ...data, passwordHash, email: normalizedEmail });
  const populated = await newStudent.populate("courses", "name code");

  // 🔁 Update each course to include this student
  if (data.courses && data.courses.length > 0) {
    await CourseModel.updateMany(
      { _id: { $in: data.courses } },
      { $addToSet: { students: newStudent._id } }
    );
  }
  await SlackService.sendChannelMessage(
    "#student-mgt",
    buildStudentRegistrationBlock(
      newStudent.name,
      newStudent.email,
      newStudent.phone,
      newStudent.courses.length
    )
  );

  return formatStudent(populated.toObject());
};

/**
 * Update student and sync courses
 */
export const updateStudent = async (
  id: string,
  data: Partial<Student> & {
    courses: string[];
  }
): Promise<Student | null> => {
  await connectToDatabase();

  // Get existing student to compare old courses
  const existing = await StudentModel.findById(id).lean();
  if (!existing) throw new Error("Student not found");

  const updated = await StudentModel.findByIdAndUpdate(id, data, {
    new: true,
  })
    .populate("courses", "name code")
    .lean();

  if (!updated) return null;

  // 🔁 If courses are updated, sync both sides
  if (data.courses) {
    const oldCourseIds = (existing.courses || []).map((c: any) => String(c));
    const newCourseIds = data.courses.map((c: any) => String(c));

    const addedCourses = newCourseIds.filter(
      (id) => !oldCourseIds.includes(id)
    );
    const removedCourses = oldCourseIds.filter(
      (id) => !newCourseIds.includes(id)
    );

    // Add student to new courses
    if (addedCourses.length > 0) {
      await CourseModel.updateMany(
        { _id: { $in: addedCourses } },
        { $addToSet: { students: updated._id } }
      );
    }

    // Remove student from old courses
    if (removedCourses.length > 0) {
      await CourseModel.updateMany(
        { _id: { $in: removedCourses } },
        { $pull: { students: updated._id } }
      );
    }
  }
  revalidatePath("/dashboard/courses");

  return formatStudent(updated);
};

/**
 * Delete student and cleanup
 */
export const deleteStudent = async (id: string): Promise<boolean> => {
  await connectToDatabase();

  const student = await StudentModel.findById(id);
  if (!student) return false;

  // 🔁 Remove this student from all courses
  if (student.courses && student.courses.length > 0) {
    await CourseModel.updateMany(
      { _id: { $in: student.courses } },
      { $pull: { students: student._id } }
    );
  }

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
