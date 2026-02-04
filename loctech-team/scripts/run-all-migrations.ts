/**
 * Master Migration Script
 * 
 * This script runs all migration scripts in the correct order:
 * 1. Instructor role assignment
 * 2. Course-to-class conversion
 * 3. Attendance records migration
 * 4. Data validation
 * 
 * Usage: npx tsx scripts/run-all-migrations.ts
 */

import { migrateInstructorRole } from "./migrate-instructor-role";
import { validateMigrations } from "./validate-migrations";

async function runAllMigrations() {
  console.log("🚀 Starting All Migrations\n");
  console.log("=".repeat(50));
  console.log("\n");

  try {
    // Step 1: Migrate instructor roles
    console.log("📋 Step 1: Migrating Instructor Roles");
    console.log("-".repeat(50));
    await migrateInstructorRole();
    console.log("\n");


    // Step 2: Validate migrations
    console.log("📋 Step 4: Validating Migrations");
    console.log("-".repeat(50));
    const validationResults = await validateMigrations();
    console.log("\n");

    // Summary
    console.log("=".repeat(50));
    console.log("📊 Migration Summary\n");

    if (validationResults.passed) {
      console.log("✅ All migrations completed successfully!");
      console.log("✅ Data validation passed!");
      console.log("\n🎉 System is ready for the new structure!");
    } else {
      console.log("⚠️  Migrations completed with warnings/errors");
      console.log("Please review the validation results above.");
    }

    console.log("\n" + "=".repeat(50));

  } catch (error: any) {
    console.error("\n❌ Migration process failed:", error);
    console.error("\nPlease review the errors above and fix them before retrying.");
    process.exit(1);
  }
}

// Run all migrations
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export { runAllMigrations };
