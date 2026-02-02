# Student App Setup Guide

## Overview

The `loctech-student` app is a separate frontend application for students that connects to the `loctech-team` backend API. This document outlines what has been implemented and what needs to be completed.

## Completed Features

### 1. Infrastructure
- ✅ Providers setup (SessionProvider, QueryClientProvider, ThemeProvider)
- ✅ Updated app layout with providers
- ✅ Updated utils.ts with API_BASE_URL and route links
- ✅ Updated fetch-utils.ts to point to team app's API

### 2. Pages Created
- ✅ Home page (redirects to dashboard)
- ✅ Dashboard page (redirects to student dashboard)
- ✅ Student Dashboard (`/dashboard/student`)
- ✅ Attendance Sign-In (`/dashboard/student/attendance/sign-in`)
- ✅ My Exams (`/dashboard/student/exams`)
- ✅ Take Exam (`/dashboard/student/exams/[id]/take`)
- ✅ Exam Results (`/dashboard/student/exams/[id]/results`)

### 3. Components Created
- ✅ Student Dashboard component
- ✅ Student Attendance Sign-In component
- ✅ Student Exams List component

## Components That Need to Be Copied/Adapted

The following complex components from `loctech-team` need to be copied to `loctech-student` and updated to use `API_BASE_URL`:

1. **Exam Taking Interface** (`components/cbt/exam-taking-interface.tsx`)
   - Full exam interface with security features
   - Tab detection, right-click disable, full-screen enforcement
   - Timer, question navigation, answer saving
   - Update all API calls to use `${API_BASE_URL}/api/...`

2. **Exam Results** (`components/cbt/exam-results.tsx`)
   - Display exam results and scores
   - Question-by-question breakdown
   - Update API calls to use `${API_BASE_URL}/api/...`

3. **Supporting Components** (from `loctech-team/components/cbt/`):
   - `exam-timer.tsx` - Timer component
   - `violation-warning.tsx` - Security violation warnings
   - Any other CBT-related components

4. **Hooks** (from `loctech-team/hooks/`):
   - `use-exam-security.ts` - Security monitoring hook
   - Any other exam-related hooks

## Environment Variables

Create a `.env.local` file in `loctech-student`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
```

**Note**: The student app should run on a different port (e.g., 3001) than the team app (3000).

## Authentication

The student app uses NextAuth with the same configuration as the team app. Students authenticate using their email and password, and the session is shared via cookies (if using the same domain) or needs to be configured for cross-domain authentication.

## API Integration

All API calls in the student app point to the team app's API endpoints using the `API_BASE_URL` constant. The fetch calls include `credentials: "include"` to send cookies for authentication.

## Next Steps

1. Copy exam-taking-interface.tsx and update API calls
2. Copy exam-results.tsx and update API calls
3. Copy supporting CBT components and hooks
4. Test authentication flow
5. Test exam taking with security features
6. Test attendance sign-in
7. Add classes/courses viewing page (if needed)
8. Add announcements page (if needed)

## Running the Student App

```bash
cd loctech-student
npm install
npm run dev
```

The app will run on `http://localhost:3001` (or the port specified in your Next.js config).

## Notes

- The student app is a separate Next.js application
- It shares the same database and API with the team app
- Students authenticate through the same NextAuth system
- All student-specific API endpoints are in `loctech-team/app/api/student/` and `loctech-team/app/api/enrollments/student/`
- The sidebar navigation is already configured in `components/app-sidebar.tsx`
