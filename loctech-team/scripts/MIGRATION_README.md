# Migration Scripts Documentation

This directory contains migration scripts to transition from the old course-based structure to the new Course → Class → Enrollment structure.

## Overview

The migration process consists of four main steps:

1. **Instructor Role Assignment** - Assigns instructor role to users who teach courses
2. **Course-to-Class Conversion** - Creates classes from existing courses and enrollments
3. **Attendance Records Migration** - Updates attendance records to reference classes instead of courses
4. **Data Validation** - Validates that all migrations were successful

## Prerequisites

- MongoDB database connection configured
- Environment variables set (MONGODB_URI, etc.)
- All models registered in `lib/db.ts`

## Running Migrations

### Option 1: Run All Migrations (Recommended)

Run all migrations in the correct order:

```bash
npx tsx scripts/run-all-migrations.ts
```

This will:
1. Migrate instructor roles
2. Convert courses to classes
3. Migrate attendance records
4. Validate the results

### Option 2: Run Individual Migrations

If you need to run migrations individually:

#### 1. Migrate Instructor Roles

```bash
npx tsx scripts/migrate-instructor-role.ts
```

This script:
- Finds users assigned to courses as instructors
- Updates their role from "staff" to "instructor"
- Ensures classes have instructors assigned

#### 2. Migrate Courses to Classes

```bash
npx tsx scripts/migrate-course-to-class.ts
```

This script:
- Creates default classes for each course with students
- Assigns instructors to classes
- Creates enrollments for all students
- Migrates attendance records to class-based

#### 3. Migrate Attendance Records

```bash
npx tsx scripts/migrate-attendance-records.ts
```

This script:
- Finds attendance records still referencing courses
- Updates them to reference classes instead
- Handles edge cases and missing data

#### 4. Validate Migrations

```bash
npx tsx scripts/validate-migrations.ts
```

This script validates:
- Students don't have direct course links
- All students have enrollments
- Attendance records reference classes (not courses)
- All classes have instructors
- All enrollments have valid references
- Courses don't have direct student links
- Instructor roles are correctly assigned

## What Gets Migrated

### Before Migration

```
Course
  ├── students: [Student1, Student2, ...]
  └── instructor: User

Student
  └── courses: [Course1, Course2, ...]

StudentAttendance
  └── course: Course
```

### After Migration

```
Course
  └── instructors: [User1, User2, ...]

Class
  ├── courseId: Course
  ├── instructorId: User
  └── name: "Course Name - Default Class"

Enrollment
  ├── studentId: Student
  ├── classId: Class
  └── status: "active"

StudentAttendance
  └── class: Class
```

## Important Notes

⚠️ **Backup Your Database First!**

Before running migrations, make sure to:
1. Backup your MongoDB database
2. Test migrations on a staging environment first
3. Review the migration output carefully

## Troubleshooting

### Migration Fails

If a migration fails:
1. Check the error messages in the console
2. Review the validation script output
3. Fix any data inconsistencies
4. Re-run the specific migration script

### Validation Errors

If validation fails:
- Review the detailed error messages
- Some warnings may be acceptable (e.g., students without enrollments if they're inactive)
- Fix critical errors before proceeding

### Rollback

If you need to rollback:
1. Restore from your database backup
2. The migration scripts are non-destructive (they don't delete old data)
3. Old course-student relationships remain until manually cleaned

## Post-Migration Cleanup

After successful migration, you may want to:

1. **Remove old course-student links** (optional):
   ```javascript
   // Run in MongoDB shell or migration script
   db.courses.updateMany({}, { $unset: { students: "" } });
   db.students.updateMany({}, { $unset: { courses: "" } });
   ```

2. **Remove old instructor field** (optional):
   ```javascript
   db.courses.updateMany({}, { $unset: { instructor: "" } });
   ```

3. **Clean up attendance records** (if needed):
   ```javascript
   db.studentattendances.updateMany({}, { $unset: { course: "" } });
   ```

## Support

For issues or questions:
1. Check the validation script output
2. Review migration logs
3. Check database state manually if needed

## Migration Scripts Summary

| Script | Purpose | Safe to Re-run? |
|--------|---------|----------------|
| `migrate-instructor-role.ts` | Assigns instructor roles | ✅ Yes |
| `migrate-course-to-class.ts` | Creates classes and enrollments | ✅ Yes (idempotent) |
| `migrate-attendance-records.ts` | Updates attendance references | ✅ Yes |
| `validate-migrations.ts` | Validates migration results | ✅ Yes |
| `run-all-migrations.ts` | Runs all migrations in order | ✅ Yes |

All scripts are idempotent and safe to re-run multiple times.
