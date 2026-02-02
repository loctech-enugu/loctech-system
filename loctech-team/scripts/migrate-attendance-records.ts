/**
 * Migration Script: Attendance Records (Course to Class)
 * 
 * This script migrates existing StudentAttendance records from course-based
 * to class-based structure.
 * 
 * Steps:
 * 1. Find all attendance records with course reference
 * 2. For each record, find or create the appropriate class
 * 3. Update attendance record to reference class instead of course
 * 
 * Usage: npx tsx scripts/migrate-attendance-records.ts
 */

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { StudentAttendanceModel } from "../backend/models/students-attendance.model";
import { ClassModel } from "../backend/models/class.model";
import { CourseModel } from "../backend/models/courses.model";
import { EnrollmentModel } from "../backend/models/enrollment.model";

interface MigrationStats {
  recordsProcessed: number;
  recordsMigrated: number;
  recordsSkipped: number;
  errors: string[];
}

async function migrateAttendanceRecords(): Promise<MigrationStats> {
  await connectToDatabase();
  
  const stats: MigrationStats = {
    recordsProcessed: 0,
    recordsMigrated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    console.log("🔄 Starting Attendance Records Migration...\n");

    // Find all attendance records that still reference courses
    const attendanceRecords = await StudentAttendanceModel.find({
      course: { $exists: true, $ne: null },
      class: { $exists: false },
    })
      .populate("course")
      .populate("student")
      .lean();

    console.log(`📋 Found ${attendanceRecords.length} attendance records to migrate\n`);

    for (const record of attendanceRecords) {
      try {
        stats.recordsProcessed++;

        const courseId = (record.course as any)?._id || record.course;
        const studentId = (record.student as any)?._id || record.student;

        if (!courseId || !studentId) {
          console.log(`⏭️  Skipping record ${record._id} - missing course or student`);
          stats.recordsSkipped++;
          continue;
        }

        // Find the class for this student and course
        // First, find enrollments for this student
        const enrollments = await EnrollmentModel.find({
          studentId: studentId,
        })
          .populate({
            path: "classId",
            match: { courseId: courseId },
          })
          .lean();

        const enrollment = enrollments.find(
          (e) => e.classId && (e.classId as any).courseId?.toString() === courseId.toString()
        );

        if (!enrollment || !enrollment.classId) {
          // Try to find or create a default class
          const defaultClass = await ClassModel.findOne({
            courseId: courseId,
            name: { $regex: /default/i },
          });

          if (defaultClass) {
            // Update the attendance record
            await StudentAttendanceModel.findByIdAndUpdate(record._id, {
              $unset: { course: "" },
              class: defaultClass._id,
            });
            stats.recordsMigrated++;
            console.log(`   ✓ Migrated record ${record._id} to class ${defaultClass.name}`);
          } else {
            console.log(`   ⚠️  No class found for course ${courseId}, record ${record._id}`);
            stats.recordsSkipped++;
          }
        } else {
          // Update the attendance record
          await StudentAttendanceModel.findByIdAndUpdate(record._id, {
            $unset: { course: "" },
            class: (enrollment.classId as any)._id,
          });
          stats.recordsMigrated++;
          console.log(`   ✓ Migrated record ${record._id}`);
        }

      } catch (error: any) {
        const errorMsg = `Error processing record ${record._id}: ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    console.log("\n✅ Migration completed!\n");
    console.log("📊 Statistics:");
    console.log(`   Records processed: ${stats.recordsProcessed}`);
    console.log(`   Records migrated: ${stats.recordsMigrated}`);
    console.log(`   Records skipped: ${stats.recordsSkipped}`);
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
  migrateAttendanceRecords()
    .then(() => {
      console.log("\n🎉 Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateAttendanceRecords };
