# Loctech System Refactor Plan

## Overview

This document outlines the comprehensive refactor plan to align the Loctech Academic System with the requirements specified in:
- `FEATURE_DOCUMENTATION.md` - Academic structure refactor (Courses → Classes → Enrollments)
- `CBT_SYSTEM_DESCRIPTION.md` - Computer-Based Testing system implementation

## Current System Analysis

### Existing Models
- **Course**: Direct many-to-many with students, single instructor
- **Student**: Direct many-to-many with courses
- **User**: Roles: admin, staff, super_admin (no instructor role)
- **StudentAttendance**: Linked to course (not class)
- **Attendance**: For staff, linked to sessions
- **LessonSchedule**: Linked to course and instructor

### Issues Identified
1. No Class model - courses directly enroll students
2. No Enrollment model - no student-level status tracking per class
3. Attendance is course-based, not class-based
4. No instructor role - instructors are staff/admin
5. No CBT system (Exams, Questions, Results)
6. No absence notification system
7. No class-level pause functionality

---

## Phase 1: Academic Structure Refactor

### 1.1 New Models to Create

#### Class Model
```typescript
{
  id: ObjectId
  courseId: ObjectId (ref: Course)
  instructorId: ObjectId (ref: User) // exactly one instructor
  name: string // e.g. "Web Dev - Morning Batch"
  schedule: {
    daysOfWeek: number[] // [1,3,5] for Mon,Wed,Fri
    startTime: string // "09:00"
    endTime: string // "12:00"
    timezone?: string
  }
  capacity?: number // optional
  status: "active" | "inactive" | "completed"
  createdAt, updatedAt
}
```

#### Enrollment Model
```typescript
{
  id: ObjectId
  studentId: ObjectId (ref: Student)
  classId: ObjectId (ref: Class)
  status: "active" | "paused" | "completed" | "withdrawn"
  pauseReason?: string
  enrolledAt: Date
  pausedAt?: Date
  resumedAt?: Date
  createdAt, updatedAt
}
```

#### Notification Model
```typescript
{
  id: ObjectId
  studentId: ObjectId (ref: Student)
  classId: ObjectId (ref: Class)
  type: "absence" | "other"
  absenceStreak: number // consecutive absences
  notifiedAt: Date
  notifiedBy: ObjectId (ref: User) // admin/staff who sent
  emailSent: boolean
  emailSentAt?: Date
  resetAt?: Date // when attendance resumed
  createdAt, updatedAt
}
```

### 1.2 Model Refactoring

#### Course Model Changes
- Remove: `students` array (students enroll in classes, not courses)
- Remove: `instructor` single reference
- Add: `instructors` array (many instructors can teach a course)
- Keep: All other fields (courseRefId, title, description, etc.)

#### Student Model Changes
- Remove: `courses` array (students enroll in classes via Enrollment model)
- Keep: All other fields

#### StudentAttendance Model Changes
- Change: `course` → `class` (ref: Class)
- Keep: All other fields (student, staff, date, status, etc.)

#### User Model Changes
- Add: `role: "instructor"` to enum
- Keep: All other fields

### 1.3 Controllers & API Routes

#### New Controllers
- `classes.controller.ts` - CRUD for classes
- `enrollments.controller.ts` - Manage student enrollments
- `notifications.controller.ts` - Absence notification management

#### New API Routes
- `/api/classes` - Class management
- `/api/classes/[id]` - Single class operations
- `/api/enrollments` - Enrollment management
- `/api/enrollments/[id]` - Single enrollment operations
- `/api/notifications` - Notification management
- `/api/attendance/classes/[classId]` - Class-based attendance

#### Updated Controllers
- `courses.controller.ts` - Remove student management, add instructor management
- `students.controller.ts` - Remove course management, add class enrollment helpers
- `student-attendance.controller.ts` - Change from course-based to class-based

### 1.4 Access Control Updates

#### Role-Based Access
- **Super Admin**: Full access
- **Admin**: Manage courses, classes, enrollments, attendance
- **Staff**: Limited admin access (enrollments, attendance monitoring)
- **Instructor**: Access only to assigned classes
  - View class roster
  - Generate attendance PIN/barcode
  - View attendance records for their classes
- **Student**: Read-only academic info, attendance sign-in

#### Middleware Updates
- Add instructor role checks
- Add class-level access restrictions for instructors

---

## Phase 2: Attendance System Refactor

### 2.1 Attendance Model Updates

#### ClassAttendance Model (New)
```typescript
{
  id: ObjectId
  studentId: ObjectId (ref: Student)
  classId: ObjectId (ref: Class)
  date: Date // class session date
  status: "present" | "absent"
  recordedAt: Date
  recordedBy: ObjectId (ref: User) // instructor/admin
  method: "barcode" | "pin" | "manual"
  pin?: string // if used PIN
  createdAt, updatedAt
}
```

### 2.2 Attendance Features

#### PIN/Barcode Generation
- Generate time-bound PIN for class sessions
- Generate barcode for student scanning
- Only visible to assigned instructor and admin

#### Constraints
- Cannot record attendance if:
  - Student enrollment is paused
  - Class session is not active for the day

#### Consecutive Absence Tracking
- Track consecutive absences per student per class
- Reset when student attends
- Trigger notification at 2 consecutive absences

### 2.3 Attendance Monitoring Dashboard

#### Admin/Staff View
- Table showing:
  - Student name
  - Class
  - Last attendance date
  - Consecutive absence count
  - Notification status
  - Action button: "Notify Student"

#### Automated Notifications
- Trigger: 2 consecutive absences
- Action: Send email using template
- Mark as notified
- Prevent duplicates for same streak
- Reset when attendance resumes

---

## Phase 3: CBT System Implementation

### 3.1 Core Models

#### Exam Model
```typescript
{
  id: ObjectId
  title: string
  description: string
  duration: number // minutes
  totalQuestions: number
  questionsPerStudent: number // for randomization
  passingScore: number // percentage 0-100
  maxAttempts: number
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled"
  scheduledStart: Date
  expirationDate: Date
  showCorrectAnswers: boolean
  showFeedback: boolean
  autoPublishResults: boolean
  questionIds: ObjectId[] // ref: Question
  createdAt, updatedAt
}
```

#### Question Model
```typescript
{
  id: ObjectId
  type: "mcq" | "true_false" | "essay" | "fill_blank" | "matching"
  question: string
  options?: string[] // for MCQ
  correctAnswer: string | string[] // depends on type
  explanation?: string
  points: number
  difficulty: "easy" | "medium" | "hard"
  categoryId: ObjectId (ref: Category)
  tags?: string[]
  isActive: boolean
  createdAt, updatedAt
}
```

#### Category Model
```typescript
{
  id: ObjectId
  name: string
  description?: string
  isActive: boolean
  createdAt, updatedAt
}
```

#### UserExam Model
```typescript
{
  id: ObjectId
  userId: ObjectId (ref: Student)
  examId: ObjectId (ref: Exam)
  attemptNumber: number
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "CANCELLED"
  startTime?: Date
  endTime?: Date
  submittedAt?: Date
  score?: number
  percentage?: number
  timeSpent?: number // minutes
  violations: {
    type: string // "tab-switch", "exit-fullscreen", etc.
    timestamp: Date
  }[]
  violationCount: number
  questions: ObjectId[] // randomized question set for this attempt
  createdAt, updatedAt
}
```

#### UserAnswer Model
```typescript
{
  id: ObjectId
  userExamId: ObjectId (ref: UserExam)
  questionId: ObjectId (ref: Question)
  answer: string | string[]
  isCorrect: boolean
  pointsEarned: number
  timeSpent: number // seconds
  createdAt, updatedAt
}
```

#### EmailTemplate Model
```typescript
{
  id: ObjectId
  name: string
  subject: string
  body: string // HTML template with variables
  type: "registration" | "exam_published" | "exam_submission" | "result_published" | "admin_registration" | "exam_reminder" | "system"
  variables: string[] // available template variables
  isActive: boolean
  createdAt, updatedAt
}
```

#### EmailLog Model
```typescript
{
  id: ObjectId
  templateId?: ObjectId (ref: EmailTemplate)
  recipientEmail: string
  subject: string
  body: string
  status: "pending" | "sent" | "failed" | "delivered" | "bounced"
  errorMessage?: string
  sentAt?: Date
  createdAt, updatedAt
}
```

### 3.2 CBT Controllers

#### New Controllers
- `exams.controller.ts` - Exam CRUD and management
- `questions.controller.ts` - Question bank management
- `categories.controller.ts` - Category management
- `user-exams.controller.ts` - Student exam taking
- `user-answers.controller.ts` - Answer management
- `email-templates.controller.ts` - Template management
- `email-logs.controller.ts` - Email tracking

### 3.3 CBT API Routes

#### Exam Routes
- `/api/exams` - List/create exams
- `/api/exams/[id]` - Get/update/delete exam
- `/api/exams/[id]/publish` - Publish/unpublish
- `/api/exams/[id]/questions` - Manage exam questions
- `/api/exams/[id]/results` - View exam results
- `/api/exams/[id]/results/[userId]` - Individual result
- `/api/exams/[id]/results/publish` - Publish results

#### Question Routes
- `/api/questions` - List/create questions
- `/api/questions/[id]` - Get/update/delete question
- `/api/questions/bank` - Question bank with filters

#### Category Routes
- `/api/categories` - List/create categories
- `/api/categories/[id]` - Get/update/delete category

#### Student Exam Routes
- `/api/student/exams` - Available exams
- `/api/student/exams/[id]` - Start exam
- `/api/student/exams/[id]/submit` - Submit exam
- `/api/student/exams/[id]/answers` - Save answers
- `/api/student/exams/[id]/results` - View results

#### Email Routes
- `/api/email/templates` - Template management
- `/api/email/templates/[id]` - Single template
- `/api/email/logs` - Email log viewing

### 3.4 CBT Security Features

#### Anti-Cheating Implementation
- Tab switch detection (3-strike policy)
- Right-click disabled
- Copy prevention
- Full-screen enforcement
- Focus loss detection
- Violation tracking and auto-fail

#### Exam Session Management
- Real-time timer with warnings
- Auto-submission on time expiry
- Answer persistence
- Question flagging
- Navigation controls

### 3.5 CBT Frontend Components

#### Admin Panel
- Exam creation/editing interface
- Question bank management
- Question selector with filters
- Result management and publishing
- Analytics dashboard

#### Student Portal
- Exam listing
- Full-screen exam interface
- Timer component
- Question navigation
- Answer submission
- Results viewing

---

## Phase 4: Data Migration

### 4.1 Migration Scripts

#### Course-to-Class Migration
1. For each course with students:
   - Create a default class
   - Assign instructor (if exists)
   - Create enrollments for all students
   - Migrate attendance records to class-based

#### Attendance Migration
1. Convert StudentAttendance records:
   - Map course → class (find or create default class)
   - Update references

#### Instructor Role Migration
1. Identify instructors (users assigned to courses)
2. Create instructor role or assign instructor permissions
3. Map course instructors to class instructors

### 4.2 Data Validation
- Verify all students have enrollments
- Verify all attendance records have classes
- Verify all classes have instructors
- Check for orphaned records

---

## Phase 5: Frontend Updates

### 5.1 Admin/Staff UI

#### Course Management
- Remove direct student enrollment
- Add instructor assignment (multiple)
- Add class listing per course
- Course statistics (aggregate from classes)

#### Class Management
- Create/edit classes
- Assign instructor (single)
- Manage schedule
- Student enrollment management
- Class status controls

#### Enrollment Management
- Add/remove students from classes
- Pause/resume enrollments
- View enrollment history
- Bulk enrollment operations

#### Attendance Management
- Class-based attendance views
- PIN/barcode generation
- Attendance monitoring dashboard
- Absence notification interface

### 5.2 Instructor UI

#### Instructor Dashboard
- Today's classes
- Attendance completion status
- At-risk students (by class)
- Generate attendance PIN/barcode

#### Class Management
- View class roster
- View attendance records
- Generate attendance codes

### 5.3 Student UI

#### Student Dashboard
- Enrolled classes (derived from enrollments)
- Class details (instructor, schedule, status)
- Attendance history
- Announcements (scoped to classes/courses)

#### Attendance Sign-In
- Barcode scanner
- PIN entry
- Attendance confirmation

### 5.4 CBT UI

#### Admin CBT Interface
- Exam management dashboard
- Question bank interface
- Exam creation wizard
- Result management
- Analytics views

#### Student CBT Interface
- Available exams list
- Exam taking interface
- Results viewing
- Performance history

---

## Phase 6: Integration Points

### 6.1 Course-Exam Integration
- Link exams to courses
- Course-based question banks
- Semester/term organization

### 6.2 Class-Exam Integration
- Assign exams to classes
- Class-based exam scheduling
- Performance tracking per class

### 6.3 Attendance-Exam Integration
- Track exam attendance
- Mark absent students
- Reschedule for absent students
- Attendance-based eligibility

---

## Implementation Order

1. **Phase 1**: Academic Structure Refactor
   - Create Class and Enrollment models
   - Update Course and Student models
   - Create controllers and API routes
   - Update access control

2. **Phase 2**: Attendance System Refactor
   - Update attendance models
   - Implement PIN/barcode generation
   - Build monitoring dashboard
   - Implement notifications

3. **Phase 3**: CBT System Implementation
   - Create all CBT models
   - Build controllers and API routes
   - Implement security features
   - Build frontend components

4. **Phase 4**: Data Migration
   - Write migration scripts
   - Execute migrations
   - Validate data

5. **Phase 5**: Frontend Updates
   - Update admin/staff UI
   - Build instructor UI
   - Update student UI
   - Build CBT interfaces

6. **Phase 6**: Integration & Testing
   - Integrate systems
   - End-to-end testing
   - Performance optimization
   - Documentation

---

## Testing Strategy

### Unit Tests
- Model validations
- Controller logic
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- Access control

### E2E Tests
- User workflows
- Attendance flow
- CBT exam flow
- Notification system

---

## Documentation Updates

1. API documentation
2. Database schema documentation
3. User guides (Admin, Instructor, Student)
4. Migration guide
5. Deployment guide

---

## Risk Mitigation

1. **Data Loss**: Backup before migrations
2. **Breaking Changes**: Version API endpoints
3. **Performance**: Index optimization
4. **Access Control**: Comprehensive testing
5. **CBT Security**: Multiple validation layers

---

## Success Criteria

1. ✅ All students enrolled via classes (not courses)
2. ✅ Attendance tracked per class
3. ✅ Instructors can only access assigned classes
4. ✅ Absence notifications working
5. ✅ Full CBT system operational
6. ✅ All existing data migrated successfully
7. ✅ All features from both documentation files implemented
