# Migration Guide - Running Migration Scripts

This guide explains how to run the migration scripts to transition from the old course-based structure to the new Course → Class → Enrollment structure.

## ⚠️ Important: Backup First!

**Before running any migrations, make sure to:**
1. ✅ Backup your MongoDB database
2. ✅ Test on a staging environment first
3. ✅ Review the migration output carefully

## Prerequisites

1. **Node.js and TypeScript**: Ensure you have Node.js installed
2. **Database Connection**: MongoDB connection must be configured in your `.env` file
3. **Dependencies**: All npm packages must be installed (`npm install`)
4. **Models Registered**: All models must be registered in `lib/db.ts` (already done)

## Quick Start (Recommended)

Run all migrations in the correct order with a single command:

```bash
npx tsx scripts/run-all-migrations.ts
```

This will:
1. ✅ Migrate instructor roles
2. ✅ Convert courses to classes
3. ✅ Migrate attendance records
4. ✅ Validate all migrations

## Step-by-Step Migration

If you prefer to run migrations individually:

### Step 1: Migrate Instructor Roles

Assigns instructor role to users who teach courses:

```bash
npx tsx scripts/migrate-instructor-role.ts
```

**What it does:**
- Finds users assigned to courses as instructors
- Updates their role from "staff" to "instructor"
- Ensures classes have instructors assigned

**Output:**
- Number of users updated
- List of instructor assignments

### Step 2: Migrate Courses to Classes

Creates classes from existing courses and enrollments:

```bash
npx tsx scripts/migrate-course-to-class.ts
```

**What it does:**
- Creates default classes for each course with students
- Assigns instructors to classes
- Creates enrollments for all students
- Migrates attendance records to class-based

**Output:**
- Number of classes created
- Number of enrollments created
- Migration summary

### Step 3: Migrate Attendance Records

Updates attendance records to reference classes instead of courses:

```bash
npx tsx scripts/migrate-attendance-records.ts
```

**What it does:**
- Finds attendance records still referencing courses
- Updates them to reference classes instead
- Handles edge cases and missing data

**Output:**
- Number of records updated
- Any errors or warnings

### Step 4: Validate Migrations

Validates that all migrations were successful:

```bash
npx tsx scripts/validate-migrations.ts
```

**What it validates:**
- ✅ Students don't have direct course links
- ✅ All students have enrollments
- ✅ Attendance records reference classes (not courses)
- ✅ All classes have instructors
- ✅ All enrollments have valid references
- ✅ Courses don't have direct student links
- ✅ Instructor roles are correctly assigned

**Output:**
- Validation results
- List of any issues found
- Summary of data integrity

## Migration Scripts Location

All migration scripts are located in:
```
loctech-team/scripts/
├── migrate-instructor-role.ts
├── migrate-course-to-class.ts
├── migrate-attendance-records.ts
├── validate-migrations.ts
└── run-all-migrations.ts
```

## Understanding the Migration Process

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

## Troubleshooting

### Error: "Cannot connect to database"

**Solution:**
- Check your `.env` file has `MONGODB_URI` set correctly
- Ensure MongoDB is running
- Verify network connectivity

### Error: "Model not registered"

**Solution:**
- Check that all models are imported in `lib/db.ts`
- Ensure `registerModels()` is called

### Validation Errors

**Common Issues:**

1. **Students without enrollments**
   - These may be inactive students
   - Review manually and create enrollments if needed

2. **Attendance records without classes**
   - These may be orphaned records
   - Review and either delete or assign to a class

3. **Classes without instructors**
   - Assign instructors manually via the UI or API

### Rollback

If you need to rollback:

1. **Restore from backup** (recommended)
2. The migration scripts are non-destructive - they don't delete old data
3. Old course-student relationships remain until manually cleaned

## Post-Migration Cleanup (Optional)

After successful migration, you may want to clean up old data:

### Remove Old Course-Student Links

```javascript
// Run in MongoDB shell
db.courses.updateMany({}, { $unset: { students: "" } });
db.students.updateMany({}, { $unset: { courses: "" } });
```

### Remove Old Instructor Field

```javascript
db.courses.updateMany({}, { $unset: { instructor: "" } });
```

### Clean Up Attendance Records

```javascript
db.studentattendances.updateMany({}, { $unset: { course: "" } });
```

## Verification Checklist

After running migrations, verify:

- [ ] All students have at least one enrollment
- [ ] All classes have an instructor assigned
- [ ] Attendance records reference classes (not courses)
- [ ] Courses have instructors array (not single instructor)
- [ ] Students don't have courses array
- [ ] Validation script passes all checks

## Support

If you encounter issues:

1. Check the migration script output for detailed error messages
2. Review the validation results
3. Check database state manually using MongoDB Compass or shell
4. Review the migration logs

## Migration Script Safety

✅ **All scripts are idempotent** - safe to run multiple times  
✅ **Non-destructive** - don't delete existing data  
✅ **Reversible** - can restore from backup if needed  

## Next Steps After Migration

1. ✅ Test the new structure in the UI
2. ✅ Verify all features work correctly
3. ✅ Update any custom integrations
4. ✅ Train users on new workflows
5. ✅ Monitor system for any issues

---

**Ready to migrate?** Run:
```bash
npx tsx scripts/run-all-migrations.ts
```
