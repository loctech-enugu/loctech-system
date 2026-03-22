# Loctech System Visual Architecture & Data Flow

## 🏗️ High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOCTECH DUAL-APP SYSTEM                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐   ┌──────────────────────────────────────────────┐
│         LOCTECH-TEAM (Admin Panel)           │   │      LOCTECH-STUDENT (Student Portal)       │
│         Port: 3000 (default)                 │   │      Port: 3001 (recommended)               │
├──────────────────────────────────────────────┤   ├──────────────────────────────────────────────┤
│                                              │   │                                              │
│  Users: Admin, Staff, Instructor             │   │  Users: Students                             │
│                                              │   │                                              │
│  Features:                                   │   │  Features:                                   │
│  • Course management                         │   │  • Dashboard (class overview)                │
│  • Class management                          │   │  • Class details & schedules                 │
│  • Student management                        │   │  • Exam taking interface                     │
│  • Enrollment tracking                       │   │  • Attendance sign-in                        │
│  • Attendance monitoring                     │   │  • Results & grades                          │
│  • CBT (Exam) management                     │   │  • Announcements                             │
│  • Question bank                             │   │  • Profile management                        │
│  • Reporting & analytics                     │   │                                              │
│  • Email/Slack notifications                 │   │                                              │
│  • Staff attendance                          │   │                                              │
│                                              │   │                                              │
│  Tech Stack:                                 │   │  Tech Stack:                                 │
│  • Next.js 15 (App Router)                   │   │  • Next.js 16 (App Router)                   │
│  • TypeScript                                │   │  • TypeScript                                │
│  • Backend API Routes                        │   │  • Backend API Routes                        │
│  • Mongoose (MongoDB ODM)                    │   │  • Mongoose (MongoDB ODM)                    │
│  • NextAuth.js (Auth)                        │   │  • NextAuth.js (Auth)                        │
│  • Radix UI + Tailwind                       │   │  • Radix UI + Tailwind                       │
│  • TanStack React Query                      │   │  • TanStack React Query                      │
│  • React Hook Form                           │   │  • React Hook Form                           │
│                                              │   │                                              │
└──────────────────────────────────────────────┘   └──────────────────────────────────────────────┘
                       ↓                                                ↓
                       └────────────────┬───────────────────────────────┘
                                        │
                            ┌───────────▼────────────┐
                            │   SHARED MONGODB       │
                            │   Single Instance      │
                            │   All Models &         │
                            │   Collections          │
                            └───────────────────────┘
                                        ↑
                            ┌───────────┴────────────┐
                            │  Authentication        │
                            │  (NextAuth.js)         │
                            │  • Sessions            │
                            │  • User/Student Auth   │
                            │  • Token Management    │
                            └───────────────────────┘
```

---

## 📊 Data Model Relationships

### Core Academic Structure
```
┌─────────────────────────────────────────────────────────────────┐
│                    ACADEMIC STRUCTURE                            │
└─────────────────────────────────────────────────────────────────┘

                          ┌────────────────┐
                          │     COURSE     │
                          │ (Academic Prog)│
                          └────────┬───────┘
                                   │ 1
                             ┌─────┴─────┐
                             │ Many      │
                        ┌────▼────────┐
                        │   CLASS     │
                        │ (Teaching   │
                        │  Group)     │
                        └────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ 1               │ 1-to-many
              ┌─────▼────┐     ┌──────▼──────────┐
              │INSTRUCTOR│     │  ENROLLMENT    │
              │  (User)  │     │ (Student-in-  │
              └──────────┘     │  Class)        │
                               └────┬───────────┘
                                    │ 1
                               ┌────▼─────┐
                               │ STUDENT  │
                               │(Learner) │
                               └──────────┘

Key Rules:
• One course → Many classes
• Each class → Exactly ONE instructor
• Many students → Enroll via many classes (1 per class)
• Unique: (studentId, classId)
```

### Testing & Assessment
```
┌─────────────────────────────────────────────────────────────────┐
│               COMPUTER-BASED TESTING (CBT)                      │
└─────────────────────────────────────────────────────────────────┘

        ┌──────────────┐
        │    EXAM      │
        │ (Assessment) │
        └────┬─────────┘
             │
    ┌────────┴─────────┐
    │ Many            │ 1
    │             ┌───▼──────┐
    │             │QUESTION  │
    │         ┌───┤(Test Item)
    │         │   └──────────┘
    │         │
    │    ┌────▼────────────────┐
    │    │   CATEGORY          │
    │    │ (Question Topic)    │
    │    └─────────────────────┘
    │
    │ Many students take exam
    │
    ├─────────────┬──────────────────┐
    │             │                  │
    │ ┌───────────▼────────┐ ┌──────▼──────────┐
    │ │   USER EXAM       │ │  USER ANSWER    │
    │ │  (Exam Attempt)   │ │  (Student Resp) │
    │ │                   │ │                 │
    │ │ • startedAt       │ │ • selectedAnswer│
    │ │ • submittedAt     │ │ • isCorrect     │
    │ │ • score           │ │ • pointsEarned  │
    │ │ • timeSpent       │ │ • questionId    │
    │ │ • passed (Y/N)    │ └─────────────────┘
    │ └───────────────────┘
    │
    └─→ Results: Score, Feedback, Pass/Fail

Question Types:
□ MCQ (Multiple Choice)
□ True/False
□ Essay (Free Text)
□ Fill-in-the-Blank
□ Matching
```

### Attendance System
```
┌─────────────────────────────────────────────────────────────────┐
│                   ATTENDANCE TRACKING                           │
└─────────────────────────────────────────────────────────────────┘

Staff/Admin Attendance:
┌──────────────┐         ┌─────────────────┐
│   SESSION    │ 1───────┤  ATTENDANCE     │
│ (Sign-in     │ (many)  │ (Staff Sign-in) │
│  Event)      │         │                 │
└──────────────┘         │ • user          │
    │                    │ • time          │
    │ Contains:          │ • validated     │
    │ • code (PIN)       │ • isLate        │
    │ • date             │ • isExcused     │
    │ • startTime        │ • excusedBy     │
    │ • endTime          └─────────────────┘
    │
    └─→ Unique: (user, session)

Student Class Attendance:
┌──────────────────┐
│ STUDENT          │
│ ATTENDANCE       │
│                  │
│ • studentId  ────┬── FK to Student
│ • classId    ────┬── FK to Class
│ • date           │
│ • status         │── "present" | "absent" | "excused"
│ • signInTime     │
│ • sessionId      │
└──────────────────┘
```

---

## 🔄 Common Data Flows

### Flow 1: Student Exam Taking
```
START: Student Opens Portal
    ↓
1. GET /api/student/exams
   └─→ Fetch available exams (filters by status, dates)
    ↓
2. Student clicks "Start Exam"
    ↓
3. POST /api/student/exams/:id
   └─→ Validate eligibility (attendance, attempts)
   └─→ Create UserExam record
   └─→ Start timer
    ↓
4. Display exam questions
    ↓
5. Student answers questions
    ↓
6. POST /api/student/exams/:id/answers
   └─→ Save UserAnswer records (auto-save)
    ↓
7. Student submits exam
    ↓
8. POST /api/student/exams/:id/submit
   └─→ Lock exam (no more changes)
   └─→ Calculate score
   └─→ Mark as passed/failed
    ↓
9. GET /api/student/exams/:id/results
   └─→ Display results with feedback (configurable)

END: Exam Complete
```

### Flow 2: Attendance Sign-In
```
START: Student at Class
    ↓
1. Open attendance sign-in page
    ↓
2. Option A: Enter PIN Code
   └─→ POST /api/attendance/classes/record
   └─→ Validate code (today's HMAC)
   └─→ Record StudentAttendance
    ↓
3. Option B: Scan QR Code
   └─→ QR contains: { secret, sessionId }
   └─→ Validate secret matches today's HMAC
   └─→ Record StudentAttendance
    ↓
4. Confirmation: "Attendance recorded at HH:MM"

END: Attendance Marked
```

### Flow 3: Class Enrollment
```
START: Admin enrolls student
    ↓
1. Navigate to Classes → Class Details
    ↓
2. Click "Enroll Students"
    ↓
3. Select student(s)
    ↓
4. POST /api/enrollments
   └─→ Validate student not already enrolled
   └─→ Create Enrollment record
   └─→ Set status = "active"
    ↓
5. Student now appears in:
   • Class roster
   • Student's "My Classes" dashboard
   • Eligible for class exams
   • Can sign in to class attendance

END: Enrollment Complete
```

### Flow 4: Creating Exam
```
START: Admin creates exam
    ↓
1. Navigate to CBT → Exams → Create
    ↓
2. Fill exam details:
   • Title
   • Duration
   • Passing score
   • Max attempts
   • Status (draft)
    ↓
3. Select questions from bank
    ↓
4. POST /api/exams
   └─→ Create Exam record
   └─→ Link Questions
   └─→ Status = "draft"
    ↓
5. Configure results:
   • Show correct answers
   • Show feedback
   • Auto-publish results
    ↓
6. Publish exam
   └─→ Change status to "published"
   └─→ Students can now start exam
    ↓
7. Assign to classes/courses (optional)
    ↓
8. Schedule:
   • scheduledStart (when exam becomes available)
   • expirationDate (when exam closes)

END: Exam Live
```

---

## 🗂️ Code Organization Pattern

### For Any New Feature: Follow This Pattern

```
1. MODEL LAYER
   └─ backend/models/feature.model.ts
      • Define schema
      • Add indexes
      • Export type

2. CONTROLLER LAYER
   └─ backend/controllers/feature.controller.ts
      • getAllFeatures()
      • getFeatureById()
      • createFeature()
      • updateFeature()
      • deleteFeature()
      • Custom queries

3. API LAYER
   └─ app/api/feature/route.ts
      • GET (list)
      • POST (create)
   └─ app/api/feature/[id]/route.ts
      • GET (detail)
      • PUT (update)
      • DELETE (remove)

4. COMPONENT LAYER
   └─ components/feature/
      ├─ list.tsx (table/list view)
      ├─ form.tsx (create/edit form)
      ├─ detail.tsx (detail view)
      └─ actions.tsx (helper components)

5. PAGE LAYER
   └─ app/dashboard/feature/
      ├─ page.tsx (list page)
      └─ [id]/page.tsx (detail page)

6. ROUTING
   └─ lib/utils.ts
      ├─ Add route to userLinks
   └─ components/nav-main.tsx
      └─ Add nav item (with role check)
```

---

## 🔐 Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHORIZATION HIERARCHY                       │
└─────────────────────────────────────────────────────────────────┘

    SUPER ADMIN
    │
    ├─→ Full system access
    ├─→ Manage all users
    ├─→ Override any restrictions
    └─→ Access all features

    ADMIN
    │
    ├─→ Academic operations
    ├─→ Course/Class management
    ├─→ Student management
    ├─→ Exam management
    ├─→ User management (excluding super_admin)
    └─→ Reporting

    INSTRUCTOR
    │
    ├─→ Access only assigned classes
    ├─→ View students in their classes
    ├─→ Create/manage exams for their classes
    ├─→ View attendance for their classes
    └─→ Post announcements to their classes

    STAFF
    │
    ├─→ Limited admin access
    ├─→ Manage enrollments
    ├─→ Record attendance
    ├─→ View student progress
    └─→ Cannot create courses or exams

    STUDENT
    │
    ├─→ Access own dashboard
    ├─→ View enrolled classes
    ├─→ Take assigned exams
    ├─→ View own attendance
    ├─→ Update own profile
    └─→ Cannot access admin features

API Call Flow:
    Client Request
        ↓
    GET /api/protected-resource
        ↓
    Server Check: getServerSession()
        ├─ NO SESSION → Return 401 Unauthorized
        ├─ SESSION EXISTS → Check role
        │   ├─ WRONG ROLE → Return 403 Access Denied
        │   ├─ ADMIN ONLY but INSTRUCTOR → Return 403
        │   └─ CORRECT ROLE → Check ownership (optional)
        │       ├─ NOT OWNER → Return 403 (if required)
        │       └─ OWNER → Proceed with request
        │
    Return 200 OK + data
```

---

## 📱 Mobile Responsiveness

```
Admin Dashboard Layout:
┌─────────────────────────────┐
│ Logo    Nav Menu   Settings │  Desktop (1200px+)
├─────────────────────────────┤
│ │                           │
│ │ Sidebar  │  Main Content  │
│ │ ├ Home   │                │
│ │ ├ Users  │  Data Tables   │
│ │ ├ Exams  │  Forms         │
│ │ └ ...    │  Charts        │
│           │                │
└─────────────────────────────┘

┌──────────────────┐
│ Logo    Menu    │  Mobile (< 768px)
├──────────────────┤
│ ☰ Hamburger     │
│                 │
│ Main Content    │
│ (Stacked)       │
│                 │
│ Single Column   │
│ Layout          │
│                 │
└──────────────────┘

Responsive Components:
• Sidebar: Collapsible on mobile
• Tables: Horizontal scroll on mobile
• Forms: Single column on mobile
• Modals: Full screen on mobile
```

---

## 🚀 Request/Response Pattern

### Standard API Response

```javascript
// Success Response (200, 201)
{
  success: true,
  data: {
    _id: "...",
    name: "...",
    // ... model fields
  },
  message: "Operation successful"
}

// Error Response (400, 401, 403, 404, 500)
{
  success: false,
  error: "Error message here",
  statusCode: 400
}

// List Response (200)
{
  success: true,
  data: [
    { _id: "...", name: "..." },
    { _id: "...", name: "..." }
  ],
  message: "Fetched successfully"
}
```

---

## 🔄 Environment Configuration

```
.env.local (Both Apps)
├─ MONGODB_URI=mongodb+srv://...
├─ NEXTAUTH_SECRET=... (random 32+ chars)
├─ NEXTAUTH_URL=http://localhost:3000 (team app)
├─ SLACK_BOT_TOKEN=xoxb-...
├─ SLACK_CHANNEL_ID=C...
├─ QR_BASE_SECRET=... (for attendance QR)
├─ NODEMAILER_USER=your@email.com
├─ NODEMAILER_PASS=app_password
└─ API_BASE_URL=http://localhost:3000 (for student app to call team api)
```

---

## 📈 Performance Optimization Paths

```
Database Queries:
  Regular Query → Add Index → Use .lean() → Use .select()
  Slow (N+1) ↓
  Fast (.lean() + .populate())

API Responses:
  All Fields → Return Only Needed → Paginate → Cache
  Large JSON ↓
  Fast Pagination

Frontend Rendering:
  Re-render All → Memoize → Virtual Scroll → Code Split
  Slow UI ↓
  Smooth UX

Loading States:
  No Feedback → Show Spinner → Show Skeleton → Show Partial Data
  Perceived Slow ↓
  Perceived Fast
```

---

## 🧪 Testing Strategy

```
Unit Tests (Model/Controller)
↓
Integration Tests (API + Database)
↓
Component Tests (React Components)
↓
E2E Tests (User Flows)
↓
Performance Tests (Load Testing)
```

---

**Last Updated**: March 2026  
**Diagrams Version**: 1.0
