/**
 * Migration Script: Course-to-Class Conversion
 * 
 * This script migrates the existing course-student relationships to the new
 * Course -> Class -> Enrollment structure.
 * 
 * Steps:
 * 1. For each course with students, create a default class
 * 2. Assign instructor (if exists) to the class
 * 3. Create enrollments for all students in that course
 * 4. Migrate attendance records to class-based
 * 
 * Usage: npx tsx scripts/migrate-course-to-class.ts
 */

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { CourseModel } from "../backend/models/courses.model";
import { ClassModel } from "../backend/models/class.model";
import { EnrollmentModel } from "../backend/models/enrollment.model";
import { StudentModel } from "../backend/models/students.model";
import { StudentAttendanceModel } from "../backend/models/students-attendance.model";

interface MigrationStats {
  coursesProcessed: number;
  classesCreated: number;
  enrollmentsCreated: number;
  attendanceRecordsMigrated: number;
  errors: string[];
}

async function migrateCourseToClass(): Promise<MigrationStats> {
  await connectToDatabase();
  
  const stats: MigrationStats = {
    coursesProcessed: 0,
    classesCreated: 0,
    enrollmentsCreated: 0,
    attendanceRecordsMigrated: 0,
    errors: [],
  };

  try {
    console.log("🔄 Starting Course-to-Class Migration...\n");

    // Get all courses
    const courses = await CourseModel.find({}).lean();
    console.log(`📚 Found ${courses.length} courses to process\n`);

    for (const course of courses) {
      try {
        stats.coursesProcessed++;

        // Get students for this course (from old structure)
        // Check both old 'students' array and new structure
        const courseWithStudents = await CourseModel.findById(course._id)
          .populate("students")
          .lean();

        const studentIds = (courseWithStudents?.students as any[]) || [];
        
        if (studentIds.length === 0) {
          console.log(`⏭️  Skipping course "${course.title}" - no students`);
          continue;
        }

        console.log(`\n📖 Processing course: "${course.title}" (${studentIds.length} students)`);

        // Get instructor (from old single instructor or first from instructors array)
        let instructorId = null;
        if (course.instructor) {
          instructorId = course.instructor;
        } else if (course.instructors && (course.instructors as any[]).length > 0) {
          instructorId = (course.instructors as any[])[0];
        }

        // Create default class for this course
        const className = `${course.title} - Default Class`;
        const existingClass = await ClassModel.findOne({
          courseId: course._id,
          name: className,
        });

        let classId;
        if (existingClass) {
          console.log(`   ✓ Class already exists: "${className}"`);
          classId = existingClass._id;
        } else {
          const newClass = await ClassModel.create({
            courseId: course._id,
            instructorId: instructorId || undefined,
            name: className,
            schedule: "TBD", // Default schedule
            status: "active",
          });
          classId = newClass._id;
          stats.classesCreated++;
          console.log(`   ✓ Created class: "${className}"`);
        }

        // Create enrollments for all students
        for (const studentRef of studentIds) {
          const studentId = typeof studentRef === "object" ? studentRef._id : studentRef;
          
          // Check if enrollment already exists
          const existingEnrollment = await EnrollmentModel.findOne({
            studentId: studentId,
            classId: classId,
          });

          if (!existingEnrollment) {
            await EnrollmentModel.create({
              studentId: studentId,
              classId: classId,
              status: "active",
              startDate: new Date(),
            });
            stats.enrollmentsCreated++;
          }
        }
        console.log(`   ✓ Created/verified ${studentIds.length} enrollments`);

        // Migrate attendance records from course to class
        const attendanceRecords = await StudentAttendanceModel.find({
          course: course._id,
        });

        for (const attendance of attendanceRecords) {
          // Update attendance record to reference class instead of course
          attendance.class = classId as any;
          await attendance.save();
          stats.attendanceRecordsMigrated++;
        }

        if (attendanceRecords.length > 0) {
          console.log(`   ✓ Migrated ${attendanceRecords.length} attendance records`);
        }

      } catch (error: any) {
        const errorMsg = `Error processing course "${course.title}": ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    console.log("\n✅ Migration completed!\n");
    console.log("📊 Statistics:");
    console.log(`   Courses processed: ${stats.coursesProcessed}`);
    console.log(`   Classes created: ${stats.classesCreated}`);
    console.log(`   Enrollments created: ${stats.enrollmentsCreated}`);
    console.log(`   Attendance records migrated: ${stats.attendanceRecordsMigrated}`);
    console.log(`   Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log("\n⚠️  Errors encountered:");
      stats.errors.forEach((err) => console.log(`   - ${err}`));
    }

  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    stats.errors.push(`Migration failed: ${error.message}`);
  }

  return stats;
}

// Run migration
if (require.main === module) {
  migrateCourseToClass()
    .then(() => {
      console.log("\n🎉 Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateCourseToClass };
