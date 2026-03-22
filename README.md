# 📚 Loctech System Documentation Index

## Quick Navigation

### 🏗️ System Architecture & Overview
- **[SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)** - Complete system architecture, models, and features
  - System architecture (dual Next.js apps)
  - Core data models (User, Course, Class, Enrollment, Student, Attendance, CBT)
  - Key features checklist
  - User roles & permissions
  - API structure reference
  - Technology stack
  - Database relationships
  - Quick start for adding features

### 🛠️ Development Guide
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Implementation patterns and best practices
  - Model creation template
  - Controller best practices
  - API route patterns
  - React component patterns
  - Page creation examples
  - Common query patterns
  - Error handling
  - Security best practices
  - Common mistakes to avoid
  - Performance optimization tips

### 🗺️ Feature Roadmap
- **[FEATURE_ROADMAP.md](FEATURE_ROADMAP.md)** - Implemented features and proposed new ones
  - ✅ All implemented features (organized by category)
  - 📋 Proposed features (prioritized)
  - 🧪 Testing checklist
  - 🚀 Performance tips
  - 📞 Common debugging issues

### 📖 Reference Documentation (in `/rules` folder)
- **CBT_SYSTEM_DESCRIPTION.md** - Detailed CBT system design
- **FEATURE_DOCUMENTATION.md** - Academic structure refactor details
- **EXAM_LAYOUT.md** - UI/UX specifications for exams

---

## 🎯 Quick Start Guide

### For New Developers
1. Read [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) - Understand the architecture (30 min)
2. Explore the codebase structure - Get familiar with folders (30 min)
3. Read [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Learn patterns (30 min)
4. Pick a simple feature to implement - Practice the patterns (2-4 hours)

### For Adding New Features
1. Check [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) - See what's planned
2. Use [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Follow the templates
3. Reference [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) - For data relationships
4. Use existing code as examples - Model → Controller → API → Component → Page

### For System Overview
1. Start with [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) - Architecture & models
2. Check [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) - What's implemented
3. Review `/rules` docs - For detailed specs

---

## 📂 Project Structure

```
loctech-system/
├── 📘 SYSTEM_OVERVIEW.md          ← START HERE
├── 📘 DEVELOPMENT_GUIDE.md         ← Implementation patterns
├── 📘 FEATURE_ROADMAP.md           ← Features & roadmap
├── 📘 README.md                    ← Index (this file)
│
├── rules/
│   ├── CBT_SYSTEM_DESCRIPTION.md   ← Detailed CBT specs
│   ├── FEATURE_DOCUMENTATION.md    ← Academic refactor specs
│   └── EXAM_LAYOUT.md              ← UI/UX specs
│
├── loctech-team/                   ← ADMIN/INSTRUCTOR APP
│   ├── app/                        ← Next.js pages & routes
│   │   ├── api/                    ← Backend API endpoints
│   │   └── dashboard/              ← Admin dashboard pages
│   ├── backend/
│   │   ├── models/                 ← MongoDB schemas
│   │   ├── controllers/            ← Business logic
│   │   └── services/               ← Utilities (email, SMS, etc)
│   ├── components/                 ← React components
│   ├── lib/                        ← Utilities & helpers
│   ├── types/                      ← TypeScript types
│   └── package.json                ← Dependencies
│
└── loctech-student/                ← STUDENT PORTAL
    ├── app/                        ← Student pages & routes
    │   ├── api/                    ← Student API endpoints
    │   └── dashboard/              ← Student pages
    ├── backend/
    │   └── controllers/            ← Student-specific logic
    ├── components/                 ← Student UI components
    ├── lib/                        ← Student utilities
    ├── types/                      ← Student types
    └── package.json                ← Dependencies
```

---

## 🗄️ Core Models Reference

### User Hierarchy
```
User (Authentication)
├── Role: "super_admin" | "admin" | "staff" | "instructor"
├── Email, Phone, Name
├── PasswordHash
└── BankDetails (optional)
```

### Academic Structure
```
Course (Academic Program)
  ↓ (1-to-many)
Class (Teaching Group)
  ├─ Instructor (1-to-1)
  └─ Schedule
      ↓ (1-to-many)
Enrollment (Student-in-Class)
  ├─ Student (1-to-1)
  └─ Status (active/paused/completed/withdrawn)
```

### Testing & Assessment
```
Exam (Assessment)
  ├─ Questions[] (0-to-many)
  └─ CreatedBy (User)
      ↓ (1-to-many)
UserExam (Exam Attempt)
  ├─ Student (1-to-1)
  └─ Answers[] (0-to-many)
      ↓ (1-to-many)
UserAnswer (Response)
  └─ Question (1-to-1)
```

### Attendance
```
Session (Sign-in Event)
  ↓ (1-to-many)
Attendance (Staff Sign-in)
  └─ User (1-to-1)

StudentAttendance (Class Attendance)
  ├─ Student (1-to-1)
  └─ Class (1-to-1)
```

---

## 🔑 Key Concepts

### Courses vs Classes
- **Course**: Academic program (Web Development, Data Science)
- **Class**: Specific teaching group with instructor & schedule
- One course can have many classes (for parallel batches)

### Enrollment Pattern
- Students enroll in **Classes**, not Courses
- One student per class enforced via unique index
- Enrollment has status (active/paused/completed/withdrawn)

### Question Types (CBT)
- MCQ (Multiple Choice)
- True/False
- Essay (free text)
- Fill-in-the-Blank
- Matching (complex)

### Attendance System
- Daily PIN codes for sign-in (reusable throughout day)
- QR-based backup (encodes secret + session)
- Session tracks who signed in
- StudentAttendance tracks per-class attendance

---

## 🚀 Implementation Patterns

All new features should follow:

```
1. DATA MODEL
   backend/models/feature.model.ts
   ↓
2. BUSINESS LOGIC
   backend/controllers/feature.controller.ts
   ↓
3. API ENDPOINTS
   app/api/feature/route.ts
   ↓
4. REACT COMPONENTS
   components/feature/list.tsx
   components/feature/form.tsx
   ↓
5. PAGES
   app/dashboard/feature/page.tsx
   ↓
6. NAVIGATION
   lib/utils.ts (add route)
   components/nav-main.tsx (add nav item)
```

See **DEVELOPMENT_GUIDE.md** for detailed templates.

---

## 📊 Feature Status

### ✅ Fully Implemented
- User management & authentication
- Course & class management
- Student enrollment system
- Attendance tracking (QR + PIN)
- Computer-based testing (CBT)
- Email notifications
- Slack integration
- Admin dashboard
- Student portal
- Reporting

### 🔄 In Development
- None currently

### 📋 Planned (Priority Order)
1. Student Certificates
2. Progress Tracking
3. SMS Notifications
4. Parent Portal
5. Discussion Forums
6. Payment System
7. Assignments
8. Live Class Integration
9. Advanced Analytics
10. Mobile App

See **FEATURE_ROADMAP.md** for details.

---

## 🔗 Important Connections

### Authentication
- User model: `backend/models/user.model.ts`
- Auth config: `lib/auth.ts`
- Middleware: `middleware.ts`
- Session: Stored in database, managed by NextAuth.js

### Database
- Connection: MongoDB (env var: `MONGODB_URI`)
- ORM: Mongoose
- Single instance shared between both apps
- Models in: `backend/models/`

### APIs
- Both apps have `/api/` routes
- Use `/api/` for internal requests (each app uses its own)
- student app can call team app API if needed (see fetch-utils.ts)

### Email
- Template engine: React Email
- Sender: Nodemailer
- Templates in: `emails/`
- Config: `.env.local`

### Slack
- Bot token: `SLACK_BOT_TOKEN` (.env.local)
- Channel ID: `SLACK_CHANNEL_ID` (.env.local)
- Service: `backend/services/slack.service.ts`

---

## 🧪 Testing & Debugging

### Test an API Endpoint
```bash
curl http://localhost:3000/api/students
```

### View Database
```bash
# Use MongoDB Compass or Atlas UI
# Connection: value of MONGODB_URI
```

### Check Logs
```bash
# Development server logs in terminal
# Production: Check server logs
```

### Common Issues
See **FEATURE_ROADMAP.md** → "Support & Debugging" section

---

## 📞 Support Resources

### Documentation
- **SYSTEM_OVERVIEW.md** - Architecture & models
- **DEVELOPMENT_GUIDE.md** - Implementation patterns
- **FEATURE_ROADMAP.md** - Features & roadmap
- **rules/*.md** - Detailed specifications

### Code Examples
- Check existing controllers for patterns
- Review existing API routes for structure
- Look at existing components for UI patterns

### Common Tasks
- **Add new feature**: Use DEVELOPMENT_GUIDE.md templates
- **Understand relationship**: Check SYSTEM_OVERVIEW.md diagram
- **Find what's implemented**: Check FEATURE_ROADMAP.md
- **Debug issue**: Check FEATURE_ROADMAP.md debugging section

---

## 📝 Contributing

When adding features:
1. Follow patterns in DEVELOPMENT_GUIDE.md
2. Update SYSTEM_OVERVIEW.md if adding models
3. Update FEATURE_ROADMAP.md with completion status
4. Add tests for new functionality
5. Document changes in code comments
6. Update navigation if adding routes

---

## 🎓 Learning Path

**Day 1**: Architecture Overview
- Read SYSTEM_OVERVIEW.md (models & structure)
- Explore project folders
- Understand the dual-app architecture

**Day 2**: Implementation Patterns
- Read DEVELOPMENT_GUIDE.md
- Study existing controllers
- Study existing API routes
- Study existing components

**Day 3**: Hands-On Practice
- Create a simple model
- Create a simple controller
- Create API endpoints
- Create a React component
- Create a page and add to navigation

**Day 4+**: Feature Development
- Pick from FEATURE_ROADMAP.md
- Plan data model
- Implement following patterns
- Test thoroughly
- Update documentation

---

## 🔐 Security Checklist

Before deploying, ensure:
- [ ] All API routes check authentication
- [ ] All protected routes check authorization
- [ ] Input validation on all endpoints
- [ ] Password hashing (bcrypt)
- [ ] HTTPS enforced in production
- [ ] Environment variables in .env.local
- [ ] No secrets in code
- [ ] Error messages don't leak data
- [ ] User data is properly scoped

---

## 📱 Running Both Apps

### Development
```bash
# Terminal 1: Admin app
cd loctech-team
npm install
npm run dev  # runs on http://localhost:3000

# Terminal 2: Student app
cd loctech-student
npm install
npm run dev  # runs on http://localhost:3001
```

### Production
```bash
# Build both apps
cd loctech-team && npm run build
cd loctech-student && npm run build

# Start both
npm run start  # in each directory
```

---

## 📈 System Statistics

- **23 Models** (User, Course, Class, Student, Enrollment, Exam, Question, etc.)
- **20 Controllers** (Student, Exam, Attendance, etc.)
- **20+ API Routes** (Auth, Students, Courses, Classes, etc.)
- **30+ Components** (Dashboard, Tables, Forms, etc.)
- **10+ Pages** (Dashboard, Students, Classes, Exams, etc.)
- **Single MongoDB** (Shared between both apps)
- **NextAuth.js** (User authentication)
- **Radix UI + Tailwind** (UI Framework)
- **TypeScript** (Type safety)

---

**Last Updated**: March 2026  
**System Version**: 1.0 (Post-Refactor)  
**Maintainer**: Development Team
