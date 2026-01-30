# Enquiry Form Feature - Requirements Document

## Overview
A feature to manage student/prospect enquiries with lead tracking, follow-up management, and automatic sync when prospects become students.

## Data Model

### Enquiry/Lead Model
```typescript
{
  id: ObjectId
  name: string (required)
  email: string (required)
  phone: string (required)
  courseOfInterest: ObjectId (ref: Course) (required)
  howDidYouHearAboutUs: string (required)
    // Options: "Google", "Facebook", "Twitter", "Instagram", 
    //          "Loctech Website", "Radio", "Billboard", 
    //          "Flyers", "Friends", "Other"
  lead: string (optional) // Additional lead source details
  feedback: string (optional) // Notes/feedback from prospect
  followUp: {
    date: Date (optional)
    notes: string (optional)
    completed: boolean (default: false)
  } (optional)
  status: "new" | "contacted" | "follow_up_scheduled" | "converted" | "lost" | "not_interested"
  convertedToStudentId: ObjectId (ref: Student) (optional) // Links to Student if converted
  assignedTo: ObjectId (ref: User) (optional) // Admin/staff handling this enquiry
  createdAt: Date
  updatedAt: Date
}
```

## Features Required

### 1. Enquiry Form (Public/Student Portal)
- **Fields:**
  - Name (required)
  - Email (required)
  - Phone Number (required)
  - Course of Interest (dropdown - required)
  - How did you hear about us (dropdown - required)
  - Lead (optional text field)
  - Feedback/Message (optional textarea)
  
- **Validation:**
  - Email format validation
  - Phone number format validation
  - All required fields must be filled

### 2. Admin Dashboard - Enquiry Management
- **List View:**
  - Table with all enquiries
  - Filter by status, course, date range
  - Search by name, email, phone
  - Sort by date, status, course
  
- **Status Management:**
  - Update status (new → contacted → follow_up_scheduled → converted/lost)
  - Bulk status updates
  
- **Follow-up Management:**
  - Schedule follow-up dates
  - Add follow-up notes
  - Mark follow-up as completed
  - View follow-up history

### 3. Enquiry Details Page
- **View:**
  - All enquiry information
  - Status timeline
  - Follow-up history
  - Conversion status (if converted to student)
  
- **Actions:**
  - Update status
  - Schedule/edit follow-up
  - Add notes/feedback
  - Convert to student (creates student record)
  - Assign to staff member

### 4. Conversion to Student
- **Process:**
  - When converting enquiry to student:
    1. Create Student record with enquiry data
    2. Link enquiry to student via `convertedToStudentId`
    3. Update enquiry status to "converted"
    4. Send confirmation email to student
    5. Notify assigned staff member
  
- **Data Mapping:**
  - Enquiry.name → Student.name
  - Enquiry.email → Student.email
  - Enquiry.phone → Student.phone
  - Enquiry.courseOfInterest → Student initial course interest
  - Enquiry.howDidYouHearAboutUs → Student.heardFrom

### 5. Automatic Sync Detection
- **Background Job/Function:**
  - Check if new student email/phone matches existing enquiry
  - If match found:
    - Link student to enquiry (`convertedToStudentId`)
    - Update enquiry status to "converted"
    - Log conversion date

### 6. Analytics & Reporting
- **Metrics:**
  - Total enquiries
  - Conversion rate (enquiries → students)
  - Enquiries by course
  - Enquiries by source (how did you hear about us)
  - Follow-up completion rate
  - Average time to conversion
  - Enquiries by status

### 7. Email Notifications
- **Triggers:**
  - New enquiry received (notify assigned staff)
  - Follow-up reminder (24 hours before scheduled date)
  - Status changed (notify assigned staff)
  - Converted to student (confirmation to student)

## API Endpoints Required

### Enquiry Management
- `GET /api/enquiries` - List all enquiries (with filters)
- `GET /api/enquiries/[id]` - Get single enquiry
- `POST /api/enquiries` - Create new enquiry (public)
- `PUT /api/enquiries/[id]` - Update enquiry
- `PATCH /api/enquiries/[id]/status` - Update status
- `PATCH /api/enquiries/[id]/follow-up` - Update follow-up
- `POST /api/enquiries/[id]/convert` - Convert to student
- `GET /api/enquiries/stats` - Get analytics/stats

### Sync Detection
- `POST /api/enquiries/sync` - Manual sync check
- Background job to auto-sync on student creation

## UI Components Needed

### Public Form
- `components/enquiries/public-form.tsx` - Public enquiry form

### Admin Components
- `components/enquiries/table.tsx` - Enquiry listing table
- `components/enquiries/create-enquiry.tsx` - Create enquiry (admin)
- `components/enquiries/edit-enquiry.tsx` - Edit enquiry
- `components/enquiries/enquiry-details.tsx` - View enquiry details
- `components/enquiries/convert-to-student.tsx` - Conversion dialog
- `components/enquiries/follow-up-scheduler.tsx` - Follow-up management
- `components/enquiries/stats-dashboard.tsx` - Analytics dashboard

## Pages Required

### Public
- `/enquiry` or `/contact` - Public enquiry form page

### Admin
- `/dashboard/enquiries` - Enquiry management page
- `/dashboard/enquiries/[id]` - Enquiry details page
- `/dashboard/enquiries/stats` - Analytics page

## Database Schema

```typescript
// Enquiry Model
const EnquirySchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  phone: { type: String, required: true, trim: true, index: true },
  courseOfInterest: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  howDidYouHearAboutUs: {
    type: String,
    required: true,
    enum: ["Google", "Facebook", "Twitter", "Instagram", "Loctech Website", 
           "Radio", "Billboard", "Flyers", "Friends", "Other"]
  },
  lead: { type: String, trim: true },
  feedback: { type: String, trim: true },
  followUp: {
    date: { type: Date },
    notes: { type: String },
    completed: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ["new", "contacted", "follow_up_scheduled", "converted", "lost", "not_interested"],
    default: "new",
    index: true
  },
  convertedToStudentId: { type: Schema.Types.ObjectId, ref: "Student", index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Indexes
EnquirySchema.index({ email: 1, phone: 1 }); // For sync detection
EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ courseOfInterest: 1 });
```

## Implementation Priority

### Phase 1: Core Functionality
1. ✅ Create Enquiry model
2. ✅ Create enquiry controller
3. ✅ Create API routes
4. ✅ Public enquiry form
5. ✅ Admin enquiry list view

### Phase 2: Management Features
6. ✅ Enquiry details page
7. ✅ Status management
8. ✅ Follow-up scheduling
9. ✅ Notes/feedback management

### Phase 3: Conversion & Sync
10. ✅ Convert to student functionality
11. ✅ Auto-sync detection
12. ✅ Manual sync tool

### Phase 4: Analytics & Notifications
13. ✅ Analytics dashboard
14. ✅ Email notifications
15. ✅ Follow-up reminders

## Notes
- Enquiries should be searchable by name, email, phone
- Conversion tracking helps measure marketing effectiveness
- Follow-up system ensures no leads are lost
- Auto-sync reduces manual data entry when prospects become students
