# Student App Review - Missing Components

## Issues Found

### 1. Dashboard Component Bug
- **File**: `components/student/dashboard.tsx`
- **Issue**: Unreachable code after return statement (line 56)
- **Fix**: Remove unreachable return statement

### 2. API Routes Using API_BASE_URL
- **Files**: 
  - `components/student/dashboard.tsx`
  - `components/student/attendance-sign-in.tsx`
  - `components/cbt/student-exams-list.tsx`
- **Issue**: Using `API_BASE_URL` pointing to team app instead of local routes
- **Fix**: Change to use local API routes (`/api/...`)

### 3. Missing API Endpoints
- `/api/student/exams/[id]` - Start exam, get exam status
- `/api/student/exams/[id]/answers` - Save/get answers
- `/api/student/exams/[id]/submit` - Submit exam
- `/api/student/exams/[id]/results` - Get exam results
- `/api/student/exams/[id]/violations` - Record violations
- `/api/announcements` - Get announcements for students

### 4. Missing Controllers
- `backend/controllers/user-exams.controller.ts`
- `backend/controllers/user-answers.controller.ts`
- `backend/controllers/exams.controller.ts` (for getExamResult)

### 5. Missing Pages
- `/dashboard/student/classes/[id]` - Class details page
- `/dashboard/student/announcements` - Announcements page
- `/dashboard/student/profile` - Profile page

## Implementation Plan

1. Fix dashboard component bug
2. Update API calls to use local routes
3. Copy exam controllers from team app
4. Create all missing API endpoints
5. Create missing pages
6. Test all endpoints
