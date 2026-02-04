/**
 * Migration Script: Instructor Role Assignment
 * 
 * This script identifies users who should have the instructor role and assigns it.
 * 
 * Steps:
 * 1. Find users assigned to courses as instructors
 * 2. Update their role to "instructor" if they're currently "staff"
 * 3. Create instructor assignments in classes
 * 
 * Usage: npx tsx scripts/migrate-instructor-role.ts
 */

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { UserModel } from "../backend/models/user.model";
import { CourseModel } from "../backend/models/courses.model";
import { ClassModel } from "../backend/models/class.model";

interface MigrationStats {
  usersProcessed: number;
  rolesUpdated: number;
  classesUpdated: number;
  errors: string[];
}

async function migrateInstructorRole(): Promise<MigrationStats> {
  await connectToDatabase();

  const stats: MigrationStats = {
    usersProcessed: 0,
    rolesUpdated: 0,
    classesUpdated: 0,
    errors: [],
  };

  try {
    console.log("🔄 Starting Instructor Role Migration...\n");

    // Find all courses with instructors
    const courses = await CourseModel.find({
      $or: [
        { instructor: { $exists: true, $ne: null } },
        { instructors: { $exists: true, $ne: [] } },
      ],
    }).lean();

    console.log(`📚 Found ${courses.length} courses with instructors\n`);

    const instructorUserIds = new Set<string>();

    // Collect all instructor user IDs
    for (const course of courses) {
      if (course.instructors && Array.isArray(course.instructors)) {
        course.instructors.forEach((id: any) => {
          instructorUserIds.add(String(id));
        });
      }
    }

    console.log(`👥 Found ${instructorUserIds.size} unique instructor users\n`);

    // Update user roles
    for (const userId of instructorUserIds) {
      try {
        stats.usersProcessed++;

        const user = await UserModel.findById(userId);
        if (!user) {
          console.log(`   ⚠️  User ${userId} not found`);
          continue;
        }

        // Only update if user is currently "staff"
        if (user.role === "staff") {
          user.role = "instructor";
          await user.save();
          stats.rolesUpdated++;
          console.log(`   ✓ Updated ${user.name} (${user.email}) to instructor role`);
        } else if (user.role === "instructor") {
          console.log(`   ✓ ${user.name} already has instructor role`);
        } else {
          console.log(`   ⏭️  Skipping ${user.name} - role is ${user.role}`);
        }

      } catch (error: any) {
        const errorMsg = `Error processing user ${userId}: ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    // Update classes to ensure they have instructors assigned
    const classes = await ClassModel.find({}).lean();
    console.log(`\n📖 Processing ${classes.length} classes...\n`);

    for (const classItem of classes) {
      try {
        if (!classItem.instructorId) {
          // Try to find instructor from the course
          const course = await CourseModel.findById(classItem.courseId).lean();
          if (course) {
            let instructorId = null;
            if (course.instructors && (course.instructors as any[]).length > 0) {
              instructorId = (course.instructors as any[])[0];
            }

            if (instructorId) {
              await ClassModel.findByIdAndUpdate(classItem._id, {
                instructorId: instructorId,
              });
              stats.classesUpdated++;
              console.log(`   ✓ Assigned instructor to class "${classItem.name}"`);
            }
          }
        }
      } catch (error: any) {
        const errorMsg = `Error processing class ${classItem._id}: ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    console.log("\n✅ Migration completed!\n");
    console.log("📊 Statistics:");
    console.log(`   Users processed: ${stats.usersProcessed}`);
    console.log(`   Roles updated: ${stats.rolesUpdated}`);
    console.log(`   Classes updated: ${stats.classesUpdated}`);
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
  migrateInstructorRole()
    .then(() => {
      console.log("\n🎉 Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateInstructorRole };
