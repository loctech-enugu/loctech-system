/**
 * Data Validation Script
 * 
 * This script validates that all migrations were successful and data integrity
 * is maintained.
 * 
 * Checks:
 * 1. All students have enrollments (not direct course links)
 * 2. All attendance records reference classes (not courses)
 * 3. All classes have instructors assigned
 * 4. All enrollments reference valid students and classes
 * 5. No orphaned records
 * 
 * Usage: npx tsx scripts/validate-migrations.ts
 */

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { StudentModel } from "../backend/models/students.model";
import { CourseModel } from "../backend/models/courses.model";
import { ClassModel } from "../backend/models/class.model";
import { EnrollmentModel } from "../backend/models/enrollment.model";
import { StudentAttendanceModel } from "../backend/models/students-attendance.model";
import { UserModel } from "../backend/models/user.model";

interface ValidationResults {
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    details?: any;
  }[];
  errors: string[];
  warnings: string[];
}

async function validateMigrations(): Promise<ValidationResults> {
  await connectToDatabase();

  const results: ValidationResults = {
    passed: true,
    checks: [],
    errors: [],
    warnings: [],
  };

  try {
    console.log("🔍 Starting Data Validation...\n");

    // Check 1: Students should not have direct course links
    console.log("✓ Checking students for direct course links...");
    const studentsWithCourses = await StudentModel.find({
      courses: { $exists: true, $ne: [] },
    }).lean();

    if (studentsWithCourses.length > 0) {
      results.checks.push({
        name: "Students without course links",
        passed: false,
        message: `Found ${studentsWithCourses.length} students with direct course links`,
        details: studentsWithCourses.map((s) => ({
          id: s._id,
          name: s.name,
        })),
      });
      results.errors.push(`Students should not have direct course links`);
      results.passed = false;
    } else {
      results.checks.push({
        name: "Students without course links",
        passed: true,
        message: "All students correctly use enrollments",
      });
    }

    // Check 2: All students should have enrollments
    console.log("✓ Checking student enrollments...");
    const allStudents = await StudentModel.find({}).lean();
    const allEnrollments = await EnrollmentModel.find({}).lean();
    const enrolledStudentIds = new Set(
      allEnrollments.map((e) => String(e.studentId))
    );

    const studentsWithoutEnrollments = allStudents.filter(
      (s) => !enrolledStudentIds.has(String(s._id))
    );

    if (studentsWithoutEnrollments.length > 0) {
      results.checks.push({
        name: "Students with enrollments",
        passed: false,
        message: `Found ${studentsWithoutEnrollments.length} students without enrollments`,
        details: studentsWithoutEnrollments.map((s) => ({
          id: s._id,
          name: s.name,
          email: s.email,
        })),
      });
      results.warnings.push(`Some students don't have enrollments (may be intentional)`);
    } else {
      results.checks.push({
        name: "Students with enrollments",
        passed: true,
        message: "All students have enrollments",
      });
    }

    // Check 3: Attendance records should reference classes, not courses
    console.log("✓ Checking attendance records...");
    const attendanceWithCourses = await StudentAttendanceModel.find({
      course: { $exists: true, $ne: null },
    }).lean();

    const attendanceWithoutClasses = await StudentAttendanceModel.find({
      class: { $exists: false },
    }).lean();

    if (attendanceWithCourses.length > 0 || attendanceWithoutClasses.length > 0) {
      results.checks.push({
        name: "Attendance records structure",
        passed: false,
        message: `Found ${attendanceWithCourses.length} records with course links, ${attendanceWithoutClasses.length} without class links`,
      });
      results.errors.push(`Attendance records should reference classes, not courses`);
      results.passed = false;
    } else {
      results.checks.push({
        name: "Attendance records structure",
        passed: true,
        message: "All attendance records reference classes",
      });
    }

    // Check 4: All classes should have instructors
    console.log("✓ Checking class instructors...");
    const classesWithoutInstructors = await ClassModel.find({
      instructorId: { $exists: false },
    }).lean();

    if (classesWithoutInstructors.length > 0) {
      results.checks.push({
        name: "Classes with instructors",
        passed: false,
        message: `Found ${classesWithoutInstructors.length} classes without instructors`,
        details: classesWithoutInstructors.map((c) => ({
          id: c._id,
          name: c.name,
          courseId: c.courseId,
        })),
      });
      results.warnings.push(`Some classes don't have instructors assigned`);
    } else {
      results.checks.push({
        name: "Classes with instructors",
        passed: true,
        message: "All classes have instructors",
      });
    }

    // Check 5: All enrollments reference valid students and classes
    console.log("✓ Checking enrollment references...");
    const allEnrollments2 = await EnrollmentModel.find({}).lean();
    const invalidEnrollments = [];

    for (const enrollment of allEnrollments2) {
      const student = await StudentModel.findById(enrollment.studentId);
      const classItem = await ClassModel.findById(enrollment.classId);

      if (!student || !classItem) {
        invalidEnrollments.push({
          enrollmentId: enrollment._id,
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          studentExists: !!student,
          classExists: !!classItem,
        });
      }
    }

    if (invalidEnrollments.length > 0) {
      results.checks.push({
        name: "Enrollment references",
        passed: false,
        message: `Found ${invalidEnrollments.length} enrollments with invalid references`,
        details: invalidEnrollments,
      });
      results.errors.push(`Some enrollments reference non-existent students or classes`);
      results.passed = false;
    } else {
      results.checks.push({
        name: "Enrollment references",
        passed: true,
        message: "All enrollments have valid references",
      });
    }

    // Check 6: Courses should not have direct student links
    console.log("✓ Checking courses for direct student links...");
    const coursesWithStudents = await CourseModel.find({
      students: { $exists: true, $ne: [] },
    }).lean();

    if (coursesWithStudents.length > 0) {
      results.checks.push({
        name: "Courses without direct student links",
        passed: false,
        message: `Found ${coursesWithStudents.length} courses with direct student links`,
        details: coursesWithStudents.map((c) => ({
          id: c._id,
          title: c.title,
        })),
      });
      results.warnings.push(`Some courses still have direct student links (may be legacy data)`);
    } else {
      results.checks.push({
        name: "Courses without direct student links",
        passed: true,
        message: "All courses correctly use class-based enrollments",
      });
    }

    // Check 7: Verify instructor role assignments
    console.log("✓ Checking instructor roles...");
    const instructors = await UserModel.find({ role: "instructor" }).lean();
    const classes = await ClassModel.find({}).lean();
    const instructorIds = new Set(instructors.map((i) => String(i._id)));
    const classInstructorIds = new Set(
      classes.map((c) => c.instructorId && String(c.instructorId))
    );

    const invalidInstructors = Array.from(classInstructorIds).filter(
      (id) => id && !instructorIds.has(id)
    );

    if (invalidInstructors.length > 0) {
      results.checks.push({
        name: "Instructor role assignments",
        passed: false,
        message: `Found ${invalidInstructors.length} classes with users who don't have instructor role`,
        details: invalidInstructors,
      });
      results.warnings.push(`Some classes have instructors without instructor role`);
    } else {
      results.checks.push({
        name: "Instructor role assignments",
        passed: true,
        message: "All class instructors have instructor role",
      });
    }

    console.log("\n✅ Validation completed!\n");

  } catch (error: any) {
    console.error("❌ Validation failed:", error);
    results.errors.push(`Validation failed: ${error.message}`);
    results.passed = false;
  }

  return results;
}

// Run validation
if (require.main === module) {
  validateMigrations()
    .then((results) => {
      console.log("📊 Validation Results:\n");

      results.checks.forEach((check) => {
        const icon = check.passed ? "✅" : "❌";
        console.log(`${icon} ${check.name}: ${check.message}`);
        if (check.details && check.details.length > 0) {
          console.log(`   Details: ${JSON.stringify(check.details.slice(0, 3), null, 2)}`);
          if (check.details.length > 3) {
            console.log(`   ... and ${check.details.length - 3} more`);
          }
        }
      });

      if (results.errors.length > 0) {
        console.log("\n❌ Errors:");
        results.errors.forEach((err) => console.log(`   - ${err}`));
      }

      if (results.warnings.length > 0) {
        console.log("\n⚠️  Warnings:");
        results.warnings.forEach((warn) => console.log(`   - ${warn}`));
      }

      if (results.passed) {
        console.log("\n🎉 All validations passed!");
        process.exit(0);
      } else {
        console.log("\n⚠️  Some validations failed. Please review the errors above.");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ Validation script failed:", error);
      process.exit(1);
    });
}

export { validateMigrations };
