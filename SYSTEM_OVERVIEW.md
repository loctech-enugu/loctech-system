# Loctech System Overview & Architecture

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [Core Data Models](#core-data-models)
3. [Key Features](#key-features)
4. [User Roles & Permissions](#user-roles--permissions)
5. [API Structure](#api-structure)
6. [Technology Stack](#technology-stack)
7. [Adding New Features](#adding-new-features)
8. [Database Relationships](#database-relationships)

---

## System Architecture

### Overview
Loctech is a **dual Next.js application** system for academic management and computer-based testing:

```
loctech-system/
├── loctech-team/      (Admin/Staff/Instructor Dashboard)
└── loctech-student/   (Student Portal)
```

### Applications

#### **loctech-team** (Admin/Staff/Instructor Panel)
- **Purpose**: Administrative and instructional management
- **Users**: Admins, Staff, Instructors
- **Port**: 3000 (default)
- **Features**: 
  - Academic management (Courses, Classes, Enrollments)
  - Attendance monitoring
  - Exam/CBT management
  - Student management
  - Reporting and analytics
  - Staff attendance tracking

#### **loctech-student** (Student Portal)
- **Purpose**: Student-facing learning environment
- **Users**: Students
- **Port**: 3001 (recommended)
- **Features**:
  - Dashboard with class overview
  - Class details and schedules
  - Exam taking interface
  - Attendance sign-in
  - Announcements
  - Profile management

### Communication Flow
```
┌─────────────────────────────────┐
│  loctech-student (Student Portal) │
│  (Frontend + Backend Routes)      │
│  - Uses local API routes (/api/)  │
│  - Connects to shared MongoDB     │
│  - NextAuth for authentication    │
└─────────────────────────────────┘
                ↓
    ┌───────────────────┐
    │  Shared MongoDB   │
    │  (Single Instance)│
    └───────────────────┘
                ↑
┌─────────────────────────────────┐
│  loctech-team (Admin Dashboard)  │
│  (Frontend + Backend Routes)      │
│  - Backend controllers/services   │
│  - Email & Slack integration      │
└─────────────────────────────────┘
```

---

## Core Data Models

### User Hierarchy
```
User (Authentication & Authorization)
├── Role: "super_admin" | "admin" | "staff" | "instructor"
├── Email (unique, lowercase)
├── Phone
├── Password Hash
├── Title (job title)
├── Bank Details (optional, for payments)
└── Status: active/inactive
```

**Models**: [User Model](loctech-team/backend/models/user.model.ts)

### Academic Structure

#### **Course** (Academic Program)
```
Course
├── courseRefId (unique, e.g., "CSC101")
├── title (e.g., "Web Development")
├── description
├── amount (pricing/fee)
├── category (e.g., "Programming")
├── level (beginner/intermediate/advanced)
├── duration (e.g., "6 weeks")
├── mode (online/offline/hybrid)
├── learning[] (learning objectives)
├── requirements[] (prerequisites)
├── instructors[] (reference to Users)
├── featured (boolean for marketing)
├── slug (URL-friendly identifier)
├── isActive (boolean)
└── timestamps
```

**Models**: [Course Model](loctech-team/backend/models/courses.model.ts)

#### **Class** (Teaching Group)
```
Class
├── courseId (reference to Course) ⭐ REQUIRED
├── instructorId (reference to User) ⭐ EXACTLY ONE
├── name (e.g., "Web Dev - Morning Batch")
├── schedule
│   ├── daysOfWeek (0-6, where 0=Sunday)
│   ├── startTime (HH:MM)
│   ├── endTime (HH:MM)
│   └── timezone (default: "Africa/Lagos")
├── capacity (optional max students)
├── status (active/inactive/completed)
└── timestamps
```

**Critical Rule**: Each class has exactly one instructor. Use multiple classes under a course for parallel batches.

**Models**: [Class Model](loctech-team/backend/models/class.model.ts)

#### **Enrollment** (Student-in-Class)
```
Enrollment
├── studentId (reference to Student) ⭐ UNIQUE pair
├── classId (reference to Class)     ⭐ UNIQUE pair
├── status (active/paused/completed/withdrawn)
├── pauseReason (string, optional)
├── enrolledAt (date)
├── pausedAt (date, optional)
├── resumedAt (date, optional)
└── timestamps
```

**Rule**: One enrollment per student per class (unique index on `studentId + classId`)

**Models**: [Enrollment Model](loctech-team/backend/models/enrollment.model.ts)

#### **Student** (Learner Profile)
```
Student
├── name, email, phone
├── address, dateOfBirth
├── highestQualification
├── stateOfOrigin, nationality
├── nextOfKin (name, relationship, contact)
├── occupation
├── heardFrom (enum: Google/Facebook/Twitter/Friends/etc)
├── passwordHash
├── status (active/graduated/suspended/pending)
└── timestamps
```

**Note**: Student is separate from User model. Users are for staff/admin/instructors.

**Models**: [Student Model](loctech-team/backend/models/students.model.ts)

### Attendance System

#### **Attendance** (Staff/Admin Sign-In)
```
Attendance
├── user (reference to User) ⭐ UNIQUE pair
├── session (reference to Session)  ⭐ UNIQUE pair
├── time (timestamp, defaults to now)
├── validated (boolean, default: false)
├── isExcused (boolean, default: false)
├── excusedBy (reference to User, optional)
├── isLate (boolean, default: false)
└── timestamps
```

**Rule**: One record per user per session (enforced by unique index)

**Models**: [Attendance Model](loctech-team/backend/models/attendance.model.ts)

#### **StudentAttendance** (Class Attendance Tracking)
```
StudentAttendance
├── studentId (reference to Student)
├── classId (reference to Class)
├── date (attendance date)
├── status (present/absent/excused)
├── signInTime (optional, when signed in)
├── sessionId (reference to Session, optional)
└── timestamps
```

**Models**: [StudentAttendance Model](loctech-team/backend/models/students-attendance.model.ts)

#### **Session** (Attendance Session)
```
Session
├── date (when session occurred)
├── classId (reference to Class)
├── startTime, endTime
├── code (PIN-based attendance code, reusable per day)
└── timestamps
```

**Models**: [Session Model](loctech-team/backend/models/session.model.ts)

### Computer-Based Testing (CBT)

#### **Exam** (Assessment)
```
Exam
├── title (exam name)
├── description
├── duration (minutes)
├── totalQuestions (count)
├── questionsPerStudent (0 = all questions)
├── shuffleQuestions (boolean)
├── passingScore (0-100 percentage)
├── maxAttempts (default: 1)
├── status (draft/published/ongoing/completed/cancelled)
├── scheduledStart (optional date/time)
├── expirationDate (optional date/time)
├── showCorrectAnswers (boolean)
├── showDetailedFeedback (boolean)
├── autoPublishResults (boolean)
├── questions[] (references to Question)
├── courseId (optional course link)
├── classIds[] (optional class assignments)
├── createdBy (reference to User)
├── requireMinimumAttendance (boolean)
├── minimumAttendancePercentage (0-100)
└── timestamps
```

**Models**: [Exam Model](loctech-team/backend/models/exam.model.ts)

#### **Question** (Test Item)
```
Question
├── type (enum: mcq/true_false/essay/fill_blank/matching)
├── question (text)
├── options[] (for MCQ: string array)
├── correctAnswer (string or string[])
├── explanation (optional)
├── points (default: 1)
├── difficulty (easy/medium/hard)
├── categoryId (reference to Category)
├── tags[] (search/organization)
├── isActive (boolean)
└── timestamps
```

**Models**: [Question Model](loctech-team/backend/models/question.model.ts)

#### **UserExam** (Student Exam Attempt)
```
UserExam
├── studentId (reference to Student)
├── examId (reference to Exam)
├── startedAt (timestamp)
├── submittedAt (timestamp, optional)
├── score (calculated after submission)
├── totalPoints (sum of attempted questions)
├── passed (boolean, based on passingScore)
├── attempt (attempt number)
├── timeSpent (seconds)
└── timestamps
```

**Models**: [UserExam Model](loctech-team/backend/models/user-exam.model.ts)

#### **UserAnswer** (Student Responses)
```
UserAnswer
├── studentId (reference to Student)
├── examId (reference to Exam)
├── questionId (reference to Question)
├── userExamId (reference to UserExam)
├── selectedAnswer (string or string[])
├── isCorrect (boolean, calculated)
├── pointsEarned (calculated)
└── timestamps
```

**Models**: [UserAnswer Model](loctech-team/backend/models/user-answer.model.ts)

### Supporting Models

#### **Category** (For Questions & Organization)
```
Category
├── name
├── description
├── isActive
└── timestamps
```

#### **Announcement**
```
Announcement
├── title
├── content
├── classIds[] or courseIds[] (audience)
├── createdBy (User)
├── isPinned
├── status (draft/published)
└── timestamps
```

#### **Notification**
```
Notification
├── userId (target recipient)
├── title
├── content
├── type (email/slack/in-app)
├── read (boolean)
└── timestamps
```

#### **Leave**
```
Leave
├── userId (staff member)
├── startDate, endDate
├── reason
├── status (pending/approved/rejected)
├── approvedBy (User, optional)
└── timestamps
```

#### **EmailTemplate & EmailLog**
- Store and log all email communications
- Track delivery status
- Support templated emails (Password Reset, Welcome, etc.)

---

## Key Features

### 1. **Academic Management**
- ✅ Course creation and management
- ✅ Class scheduling and management
- ✅ Student enrollment tracking
- ✅ Multi-instructor course support
- ✅ Class capacity management

### 2. **Attendance System**
- ✅ QR-based attendance for classes
- ✅ PIN-based daily attendance codes
- ✅ Manual attendance recording
- ✅ Late tracking
- ✅ Absence excusal system
- ✅ Attendance monitoring dashboard
- ✅ Slack integration for notifications

### 3. **Computer-Based Testing (CBT)**
- ✅ Multiple question types (MCQ, True/False, Essay, etc.)
- ✅ Question bank with categorization
- ✅ Exam creation with flexible scheduling
- ✅ Random question shuffling per student
- ✅ Configurable questions per student
- ✅ Automatic scoring
- ✅ Student exam results and feedback
- ✅ Attendance-based exam eligibility
- ✅ Results publication control

### 4. **Student Portal**
- ✅ Dashboard with class overview
- ✅ Exam taking interface
- ✅ Attendance sign-in (PIN/QR)
- ✅ Class details view
- ✅ Announcements
- ✅ Profile management
- ✅ Results tracking

### 5. **Admin Dashboard**
- ✅ System statistics
- ✅ User management (students, staff, instructors)
- ✅ Course and class management
- ✅ Attendance monitoring
- ✅ Exam management and creation
- ✅ Question bank management
- ✅ Email template management
- ✅ Reporting and analytics

### 6. **Email & Notifications**
- ✅ Welcome emails
- ✅ Password reset emails
- ✅ Attendance notifications
- ✅ Exam notifications
- ✅ Slack integration for alerts

---

## User Roles & Permissions

### **Super Admin**
- Full system access
- User management (create, edit, delete)
- System configuration
- Override any restrictions
- Access all features

### **Admin**
- Academic and operational control
- Manage courses, classes, students
- Manage staff and instructors
- Create and publish exams
- Monitor attendance
- Generate reports
- Email/Slack configuration
- Cannot delete users

### **Staff**
- Limited administrative access
- Manage enrollments
- Monitor attendance
- Record attendance manually
- View student progress
- Cannot create courses or exams

### **Instructor**
- Scoped to assigned classes
- View students in their classes
- Monitor attendance
- View exam results (if authorized)
- Post announcements to their classes
- Cannot manage system settings

### **Student**
- Access own dashboard
- View enrolled classes
- Take assigned exams
- View attendance records
- View announcements
- Update own profile
- Cannot access admin features

---

## API Structure

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/update-password
GET  /api/auth/session
```

### Students
```
GET    /api/students              (admin only)
GET    /api/students/:id          (admin/self)
POST   /api/students              (admin)
PUT    /api/students/:id          (admin/self)
DELETE /api/students/:id          (admin)
GET    /api/students/sync-courses (sync bidirectional relationships)
```

### Courses & Classes
```
GET    /api/courses               (all users)
GET    /api/courses/:id           (all users)
POST   /api/courses               (admin)
PUT    /api/courses/:id           (admin)
DELETE /api/courses/:id           (admin)

GET    /api/classes               (all users)
GET    /api/classes/:id           (all users)
POST   /api/classes               (admin)
PUT    /api/classes/:id           (admin)
DELETE /api/classes/:id           (admin)
```

### Enrollments
```
GET    /api/enrollments           (admin/instructor for their classes)
GET    /api/enrollments/:id       (admin/student)
POST   /api/enrollments           (admin)
PUT    /api/enrollments/:id       (admin)
DELETE /api/enrollments/:id       (admin)
GET    /api/enrollments/class/:id (get students in class)
```

### Attendance
```
GET    /api/attendance            (admin/staff)
POST   /api/attendance/record     (staff/student self-service)
GET    /api/attendance/students/:studentId (admin/staff)
POST   /api/attendance/excuse     (admin/staff)
GET    /api/attendance/monitoring (admin/staff dashboard)
```

### Exams (CBT)
```
GET    /api/exams                 (admin/instructor)
GET    /api/exams/:id             (admin/instructor)
POST   /api/exams                 (admin/instructor)
PUT    /api/exams/:id             (admin/instructor)
DELETE /api/exams/:id             (admin)

GET    /api/questions             (admin/instructor)
POST   /api/questions             (admin/instructor)
PUT    /api/questions/:id         (admin/instructor)
DELETE /api/questions/:id         (admin)
```

### Student Exam Interface
```
GET    /api/student/exams         (student: available exams)
GET    /api/student/exams/:id     (student: start exam)
POST   /api/student/exams/:id/answers (student: save answers)
POST   /api/student/exams/:id/submit  (student: submit exam)
GET    /api/student/exams/:id/results (student: view results)
POST   /api/student/exams/:id/violations (student: record violations)
```

### Announcements
```
GET    /api/announcements         (all users: public/their audience)
POST   /api/announcements         (admin/instructor)
PUT    /api/announcements/:id     (admin/creator)
DELETE /api/announcements/:id     (admin/creator)
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI + custom Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: TanStack React Query
- **Tables**: TanStack React Table
- **Styling**: Tailwind CSS + PostCSS
- **Icons**: Lucide React
- **Theming**: next-themes (light/dark mode)

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: NextAuth.js v4
- **Email**: React Email + Nodemailer
- **Notifications**: Slack Web API
- **PDF Generation**: jsPDF, docx

### DevTools
- **Linting**: ESLint
- **Package Manager**: npm
- **Version Control**: Git

---

## Adding New Features

### Step-by-Step Process

#### 1. **Define the Data Model**
If your feature needs persistent data:

```typescript
// File: loctech-team/backend/models/yourfeature.model.ts
import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const YourFeatureSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    // Add relationships with indexes
    courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    // Timestamps for audit trail
  },
  { timestamps: true }
);

// Optimize with indexes for frequently queried fields
YourFeatureSchema.index({ courseId: 1, status: 1 });

export type YourFeature = InferSchemaType<typeof YourFeatureSchema>;
export const YourFeatureModel: Model<YourFeature> =
  (mongoose.models.YourFeature as Model<YourFeature>) ||
  mongoose.model<YourFeature>("YourFeature", YourFeatureSchema);
```

#### 2. **Create Backend Controller**
Handle business logic:

```typescript
// File: loctech-team/backend/controllers/yourfeature.controller.ts
import { YourFeatureModel } from "../models/yourfeature.model";

export async function getAllYourFeatures() {
  return await YourFeatureModel.find().lean();
}

export async function getYourFeatureById(id: string) {
  return await YourFeatureModel.findById(id).lean();
}

export async function createYourFeature(data: any) {
  return await YourFeatureModel.create(data);
}

export async function updateYourFeature(id: string, data: any) {
  return await YourFeatureModel.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteYourFeature(id: string) {
  return await YourFeatureModel.findByIdAndDelete(id);
}
```

#### 3. **Create API Route**
Expose controller via HTTP:

```typescript
// File: loctech-team/app/api/yourfeature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { getAllYourFeatures, createYourFeature } from "@/backend/controllers/yourfeature.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) return errorResponse("Unauthorized", 401);

    const data = await getAllYourFeatures();
    return successResponse(data);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch",
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (session?.user.role !== "admin" && session?.user.role !== "super_admin") {
      return errorResponse("Access denied", 403);
    }

    const data = await req.json();
    const result = await createYourFeature(data);
    return successResponse(result, "Created successfully", 201);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to create",
      500
    );
  }
}
```

#### 4. **Create Frontend Component**
Build UI in React:

```typescript
// File: loctech-team/components/yourfeature/list.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function YourFeatureList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["yourfeature"],
    queryFn: async () => {
      const res = await fetch("/api/yourfeature");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data?.map((item: any) => (
        <div key={item._id}>{item.name}</div>
      ))}
    </div>
  );
}
```

#### 5. **Create Route & Page**
Add navigation:

```typescript
// File: loctech-team/app/dashboard/yourfeature/page.tsx
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import YourFeatureList from "@/components/yourfeature/list";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Your Feature", href: "/dashboard/yourfeature" },
];

export default function YourFeaturePage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">Your Feature</h1>
        <YourFeatureList />
      </div>
    </AppLayout>
  );
}
```

#### 6. **Add Navigation Link**
Update sidebar/navigation:

```typescript
// File: loctech-team/lib/utils.ts
export const userLinks = {
  // ... existing links
  yourfeature: "/dashboard/yourfeature",
};

// File: loctech-team/components/nav-main.tsx
// Add to nav items array:
{
  title: "Your Feature",
  href: "/dashboard/yourfeature",
  icon: YourIcon,
  roles: ["admin", "super_admin"], // restrict by role
}
```

### Best Practices for New Features

1. **Authorization First**
   - Always check session and role before operations
   - Use `getServerSession(authConfig)` in APIs
   - Implement role-based access control

2. **Data Validation**
   - Use Zod or similar for request validation
   - Validate all user inputs
   - Return clear error messages

3. **Database Indexes**
   - Add indexes to frequently queried fields
   - Create composite indexes for multi-field queries
   - Document index strategy

4. **Error Handling**
   - Use consistent error response format
   - Log errors for debugging
   - Return appropriate HTTP status codes

5. **Component Organization**
   ```
   components/
   ├── yourfeature/
   │   ├── list.tsx
   │   ├── detail.tsx
   │   ├── form.tsx
   │   └── actions.tsx
   ```

6. **API Response Format**
   ```typescript
   // Success
   { success: true, data: {...}, message: "..." }
   
   // Error
   { success: false, error: "...", statusCode: 400 }
   ```

7. **Testing Considerations**
   - Create with required fields
   - Test all CRUD operations
   - Verify authorization
   - Test edge cases

---

## Database Relationships

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│    User     │ 1──────*│    Course    │
│  (Admin/    │         │  (Academic   │
│ Instructor) │         │   Program)   │
└─────────────┘         └──────────────┘
      │                        │
      │                    1   │
      │                   ╱    │
      └──────────────────      │
                               │
                             1 │
                          ┌────▼─────────┐
                          │    Class      │
                          │  (Teaching    │
                          │   Group)      │
                          └────┬─────────┘
                               │ 1
                          ┌────▼─────────────┐
                          │  Enrollment      │
                          │ (Student in      │
                          │  Class)          │
                          └────┬─────────────┘
                               │ *
                          ┌────▼──────────┐
                          │   Student     │
                          │  (Learner)    │
                          └───────────────┘

┌──────────────┐ 1   ┌──────────────┐
│    Exam      │────*│   Question   │
│ (Assessment) │     │ (Test Item)  │
└──────┬───────┘     └──────────────┘
       │
       │ * (student attempts)
       │
┌──────▼──────────┐
│   UserExam      │
│  (Exam Attempt) │
└──────┬──────────┘
       │ 1
       │
┌──────▼──────────┐
│   UserAnswer    │
│  (Response to   │
│   Question)     │
└─────────────────┘

┌─────────────────┐       ┌──────────────┐
│     Session     │ 1────*│  Attendance  │
│ (Sign-in Event) │       │ (Record)     │
└─────────────────┘       └──────────────┘
```

### Key Relationship Rules

| Relationship | Rule | Enforce How |
|---|---|---|
| User → Course | Instructors can teach multiple courses | Index on instructors array |
| Course → Class | Course can have multiple classes | courseId index |
| Class → Instructor | Exactly one instructor per class | Required field, no array |
| Class → Students | Students via Enrollment (many-to-many) | Enrollment model |
| Exam → Questions | Exam references array of questions | questions[] array |
| Student → Exam | Attempts tracked via UserExam | studentId + examId |
| UserExam → UserAnswer | One exam attempt has many answers | userExamId reference |

---

## Important Notes

### Single MongoDB Instance
Both applications (`loctech-team` and `loctech-student`) share the same MongoDB database. This ensures:
- Data consistency across applications
- No duplicate student/course data
- Real-time synchronization

### NextAuth Configuration
- Located in: `loctech-team/lib/auth.ts`
- Supports both User and Student authentication
- Sessions expire according to configured strategy
- Credentials stored securely

### Attendance Codes
- Generated daily using `QR_BASE_SECRET`
- Same code reusable throughout the day
- Format: JSON with secret and session ID
- Students can sign in via PIN or QR scan

### Email System
- Uses React Email for template design
- Nodemailer for sending
- Templates for: Password Reset, Welcome, Announcements
- Email logs stored for audit trail

### Slack Integration
- Configured with bot token
- Posts attendance summaries daily
- Sends alerts for important events
- Channel ID must be configured in `.env.local`

---

## Quick Reference: File Locations

| Component | Location |
|---|---|
| Models | `loctech-team/backend/models/*.model.ts` |
| Controllers | `loctech-team/backend/controllers/*.controller.ts` |
| API Routes | `loctech-team/app/api/**/*.ts` |
| Pages | `loctech-team/app/dashboard/**/*.tsx` |
| Components | `loctech-team/components/**/*.tsx` |
| Types | `loctech-team/types/index.ts` |
| Utilities | `loctech-team/lib/utils.ts` |
| Auth Config | `loctech-team/lib/auth.ts` |

---

## Next Steps

1. **Explore the codebase structure** - Review models and controllers
2. **Understand existing features** - Review pages and components
3. **Plan your feature** - Define models, APIs, and UI
4. **Follow the patterns** - Use existing code as templates
5. **Test thoroughly** - Test all CRUD operations and edge cases
6. **Document changes** - Update this overview if adding major features

---

**Last Updated**: March 2026
**System Version**: 1.0 (Post-Refactor)
