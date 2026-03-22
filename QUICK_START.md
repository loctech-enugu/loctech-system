# 🚀 Loctech Quick-Start Cheat Sheet

## 📍 You Are Here
```
✅ Comprehensive system documentation created
✅ Ready to add new features
✅ Ready to onboard team members
```

---

## 📚 Documentation Files (In Priority Order)

| # | File | Purpose | Read Time |
|---|------|---------|-----------|
| 1️⃣ | **README.md** | Main index & navigation | 10 min |
| 2️⃣ | **SYSTEM_OVERVIEW.md** | Complete architecture & models | 45 min |
| 3️⃣ | **ARCHITECTURE_DIAGRAMS.md** | Visual relationships | 20 min |
| 4️⃣ | **DEVELOPMENT_GUIDE.md** | Code templates & patterns | 30 min |
| 5️⃣ | **FEATURE_ROADMAP.md** | Features & priorities | 25 min |
| 📋 | **DOCUMENTATION_SUMMARY.md** | This summary | 10 min |

**Total Time to Mastery**: ~2 hours

---

## 🎯 Quick Answers

### "I want to understand the system"
→ Read: **README.md** → **SYSTEM_OVERVIEW.md** → **ARCHITECTURE_DIAGRAMS.md**

### "I want to build a feature"
→ Check: **FEATURE_ROADMAP.md** → Follow: **DEVELOPMENT_GUIDE.md** templates

### "I need to find how something works"
→ Search: **SYSTEM_OVERVIEW.md** for models & APIs

### "I need code templates"
→ Go to: **DEVELOPMENT_GUIDE.md** and copy-paste templates

### "I'm new to the project"
→ Follow: Learning path in **README.md**

### "I need to know what to build next"
→ Review: **FEATURE_ROADMAP.md** → Priority section

---

## 🏗️ System at a Glance

```
Two Apps:
├── loctech-team (Admin/Instructor) → Port 3000
└── loctech-student (Student) → Port 3001

Shared Database:
└── MongoDB (single instance)

23 Models (Fully Documented):
├── User (Admin/Staff/Instructor)
├── Student (Learner)
├── Course, Class, Enrollment (Academic)
├── Exam, Question, UserExam, UserAnswer (Testing)
├── Attendance, StudentAttendance, Session (Tracking)
└── + Supporting models

Authentication:
└── NextAuth.js (sessions managed in MongoDB)

Roles:
├── Super Admin (Full access)
├── Admin (Academic control)
├── Staff (Limited admin)
├── Instructor (Class-scoped)
└── Student (Self-access)
```

---

## 📁 Where to Put Code

```
Creating a new feature "YourFeature"?

1. Model:      backend/models/yourfeature.model.ts
2. Controller: backend/controllers/yourfeature.controller.ts
3. API:        app/api/yourfeature/route.ts
4. Component:  components/yourfeature/list.tsx
5. Page:       app/dashboard/yourfeature/page.tsx
6. Nav:        lib/utils.ts + components/nav-main.tsx
```

See **DEVELOPMENT_GUIDE.md** for complete templates!

---

## 🔑 Key Concepts

### Academic Hierarchy
```
Course (Web Dev)
  ↓
Class (Morning Batch)
  ├─ Instructor (One)
  ├─ Schedule (Days, Times)
  └─ Enrollment (Students)
      ↓
    Student (enrolled)
```

**Rule**: One class = one instructor. Use multiple classes for parallel batches.

### Testing Hierarchy
```
Exam (Final Test)
  ├─ Questions (from bank)
  └─ Results
      ├─ UserExam (student's attempt)
      └─ UserAnswers (per question)
```

**Rule**: One exam attempt per student (enforced by unique index).

### Attendance
```
Daily PIN Code (reusable throughout day)
  ↓
Student scans QR or enters PIN
  ↓
StudentAttendance recorded
```

**Rule**: One record per student per date.

---

## 🚀 Adding a Feature (5 Steps)

### Step 1: Create Model
```typescript
// backend/models/feature.model.ts
const FeatureSchema = new Schema({
  name: { type: String, required: true },
  // Add more fields...
}, { timestamps: true });

// Add indexes
FeatureSchema.index({ status: 1 });
```
See **DEVELOPMENT_GUIDE.md** for full template.

### Step 2: Create Controller
```typescript
// backend/controllers/feature.controller.ts
export async function getAllFeatures() {
  return await FeatureModel.find().lean();
}
// Add more functions (create, read, update, delete)
```

### Step 3: Create API Routes
```typescript
// app/api/feature/route.ts
export async function GET(req) {
  const session = await getServerSession(authConfig);
  if (!session) return errorResponse("Unauthorized", 401);
  // ... rest of logic
}
```

### Step 4: Create Component
```typescript
// components/feature/list.tsx
"use client";
export function FeatureList() {
  const { data } = useQuery({
    queryKey: ["features"],
    queryFn: async () => {
      const res = await fetch("/api/feature");
      return res.json();
    },
  });
  // Render data...
}
```

### Step 5: Create Page & Add Navigation
```typescript
// app/dashboard/feature/page.tsx
export default function FeaturePage() {
  return <AppLayout><FeatureList /></AppLayout>;
}

// lib/utils.ts - Add route
export const userLinks = { feature: "/dashboard/feature" };

// components/nav-main.tsx - Add nav item
{ title: "Feature", href: "/dashboard/feature", roles: ["admin"] }
```

**That's it! Feature complete.**

---

## ✅ Pre-Launch Checklist

Before pushing code:
- [ ] Authentication check: `getServerSession(authConfig)`
- [ ] Authorization check: Role validation
- [ ] Input validation: Check request body
- [ ] Error handling: Use errorResponse()
- [ ] TypeScript: No `any` types
- [ ] Comments: JSDoc for functions
- [ ] Tests: Manual testing of CRUD
- [ ] Responsive: Works on mobile
- [ ] Documentation: Updated README if needed

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "API returns 401" | Check `getServerSession()` is in route |
| "Data not showing" | Check role authorization |
| "Component not rendering" | Check "use client" directive |
| "Model field undefined" | Check model schema definition |
| "Query slow" | Add `.lean()` and check indexes |
| "Duplicate data on multiple exams" | Check unique index on UserExam |
| "Feature not in sidebar" | Add to nav-main.tsx |
| "Can't connect to DB" | Check MONGODB_URI in .env.local |

See **FEATURE_ROADMAP.md** for more debugging tips.

---

## 📊 Model Quick Reference

### User (Auth)
```
User
├── email (unique)
├── passwordHash
├── role: "admin" | "staff" | "instructor" | "super_admin"
├── name, phone, title
└── bankDetails (optional)
```

### Course (Academic)
```
Course
├── courseRefId (unique, e.g., "CSC101")
├── title
├── instructors[] (can have many)
└── level, category, duration, etc.
```

### Class (Teaching Group)
```
Class
├── courseId (FK to Course)
├── instructorId (EXACTLY ONE)
├── name
├── schedule: { daysOfWeek, startTime, endTime }
└── status: "active" | "inactive" | "completed"
```

### Enrollment (Student-in-Class)
```
Enrollment
├── studentId
├── classId
├── status: "active" | "paused" | "completed" | "withdrawn"
└── Unique Index: (studentId, classId)
```

### Exam (Testing)
```
Exam
├── title, duration, passingScore
├── questions[] (FK to Question)
├── status: "draft" | "published" | "ongoing" | "completed"
├── scheduledStart, expirationDate
└── requireMinimumAttendance (optional)
```

See **SYSTEM_OVERVIEW.md** for complete model reference!

---

## 🔐 Authorization Template

```typescript
// Always follow this pattern
export async function GET(req: NextRequest) {
  // Step 1: Check authentication
  const session = await getServerSession(authConfig);
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  // Step 2: Check authorization (if needed)
  if (session.user.role !== "admin") {
    return errorResponse("Access denied", 403);
  }

  // Step 3: Check ownership (if needed)
  const resource = await getResource(id);
  if (resource.createdBy !== session.user.id) {
    return errorResponse("Access denied", 403);
  }

  // Step 4: Proceed with business logic
  // ...

  return successResponse(data);
}
```

---

## 📱 Running Locally

```bash
# Setup
cd loctech-team
npm install
npm run dev  # Terminal 1, Port 3000

cd loctech-student
npm install
npm run dev  # Terminal 2, Port 3001

# Open browser
http://localhost:3000  # Admin app
http://localhost:3001  # Student app
```

---

## 🎯 Next 7 Days Plan

| Day | Task | Document |
|-----|------|----------|
| 1️⃣ | Read system overview | README.md + SYSTEM_OVERVIEW.md |
| 2️⃣ | Review architecture | ARCHITECTURE_DIAGRAMS.md |
| 3️⃣ | Study code patterns | DEVELOPMENT_GUIDE.md |
| 4️⃣ | Plan feature | FEATURE_ROADMAP.md |
| 5️⃣ | Implement model + controller | DEVELOPMENT_GUIDE.md |
| 6️⃣ | Implement API + component | DEVELOPMENT_GUIDE.md |
| 7️⃣ | Test and deploy | Verify checklist |

---

## 📚 Documentation Structure

```
Root Docs (What you just got):
├── README.md ..................... Main index
├── SYSTEM_OVERVIEW.md ............ Complete reference (goto for models/APIs)
├── DEVELOPMENT_GUIDE.md .......... Code templates (goto for how-to)
├── FEATURE_ROADMAP.md ............ Features list (goto for planning)
├── ARCHITECTURE_DIAGRAMS.md ...... Visual guide (goto for relationships)
└── DOCUMENTATION_SUMMARY.md ...... This summary

Rules Docs (Reference):
├── FEATURE_DOCUMENTATION.md ...... Academic structure specs
├── CBT_SYSTEM_DESCRIPTION.md .... Testing system specs
└── EXAM_LAYOUT.md ................ UI/UX specifications
```

---

## 🎓 Study Path (By Role)

### If You're a Developer
1. Read: README.md
2. Study: SYSTEM_OVERVIEW.md (focus on models)
3. Learn: DEVELOPMENT_GUIDE.md (code templates)
4. Build: Pick feature from FEATURE_ROADMAP.md
5. Reference: ARCHITECTURE_DIAGRAMS.md (as needed)

### If You're a Product Manager
1. Read: README.md
2. Review: FEATURE_ROADMAP.md (entire section)
3. Understand: SYSTEM_OVERVIEW.md (features section)
4. Plan: Next sprint using roadmap
5. Reference: ARCHITECTURE_DIAGRAMS.md (explain to team)

### If You're a QA/Tester
1. Read: README.md
2. Review: FEATURE_ROADMAP.md (testing checklist)
3. Study: SYSTEM_OVERVIEW.md (data models)
4. Test: Use models to create test data
5. Reference: DEVELOPMENT_GUIDE.md (common mistakes to catch)

### If You're New to the Project
1. Day 1: README.md (overview)
2. Day 2: SYSTEM_OVERVIEW.md (deep dive)
3. Day 3: ARCHITECTURE_DIAGRAMS.md (visual)
4. Day 4: DEVELOPMENT_GUIDE.md (patterns)
5. Day 5+: Implement small feature

---

## 💡 Pro Tips

1. **Bookmark SYSTEM_OVERVIEW.md** - You'll reference it constantly for model fields and API endpoints

2. **Use DEVELOPMENT_GUIDE.md as template generator** - Copy-paste the templates and fill in your feature name

3. **Check ARCHITECTURE_DIAGRAMS.md when confused** - Visual understanding helps

4. **Reference existing code** - All features follow the same pattern; look at students or exams as examples

5. **Keep FEATURE_ROADMAP.md open** - Update it as you build, and reference it for prioritization

6. **Test with these accounts**:
   - Admin: (check in seed script)
   - Instructor: (create one)
   - Student: (create one)
   - Test workflows from each role

7. **Use .lean() for performance** - When reading from database, always use `.lean()` to return plain objects

8. **Index early, optimize later** - Add indexes to fields you filter/sort by

---

## 🚀 Ready to Go!

You now have:
- ✅ Complete system overview
- ✅ All code templates
- ✅ Visual architecture guide
- ✅ Feature roadmap
- ✅ Implementation patterns
- ✅ Security guidelines
- ✅ Quick reference

**Start by reading README.md, then pick a feature from FEATURE_ROADMAP.md to build!**

---

## 📞 Document Quick Access

| Need | Go To | Section |
|------|-------|---------|
| How to add feature | DEVELOPMENT_GUIDE.md | Creating a Model |
| All models explained | SYSTEM_OVERVIEW.md | Core Data Models |
| All APIs listed | SYSTEM_OVERVIEW.md | API Structure |
| Feature list | FEATURE_ROADMAP.md | Implemented Features |
| What to build next | FEATURE_ROADMAP.md | Proposed Features |
| Authorization rules | DEVELOPMENT_GUIDE.md | Common Query Patterns |
| Visual relationships | ARCHITECTURE_DIAGRAMS.md | Data Model Relationships |
| Project structure | README.md | Project Structure |
| Error handling | DEVELOPMENT_GUIDE.md | Error Handling Pattern |
| Debugging tips | FEATURE_ROADMAP.md | Support & Debugging |

---

**Last Updated**: March 18, 2026  
**Documentation Version**: 1.0  
**Status**: ✅ Complete & Ready  

**Questions? Check the relevant doc above! 🚀**
