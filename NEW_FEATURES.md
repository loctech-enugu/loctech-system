# Loctech — Feature Todo List

> Generated from team meeting notes · March 2026

---

## From the Meeting

These items were explicitly discussed and agreed upon during the session.

---

### 1. Grading System

**Priority:** High

- [ ] Attendance grading — calculate and store each student's attendance score/percentage
- [ ] Assignment grading — allow instructors to mark and record assignment scores
- [ ] Overall grade calculation combining attendance + assignments + exam scores
- [ ] Grade view for instructors per class
- [ ] Grade view for students on their portal

---

### 2. Inquiry / Contact Form (Prospective Students)

**Priority:** High

- [ ] Public-facing inquiry form — no login required
- [ ] Capture: name, email, phone, course of interest, message
- [ ] Inquiries appear in admin dashboard for follow-up
- [ ] Auto-reply email sent to prospect on submission
- [ ] Staff can mark inquiries as responded
- [ ] if email is in students list marks inquiries as converted to enrollment

---

### 3. Two Sign-In Methods for Attendance (for students)

**Priority:** High

- [ ] Method 1 — Class attendance (existing system)
- [ ] Method 2 - walked in attendance (Pick a suitable name) [To know who walked into the building]

---

### 4. Front Desk Sign-In (Students Without Smartphones)

**Priority:** Medium

- [ ] Front desk staff can search for a student by name or ID (For the walkin attendance)
- [ ] Mark attendance on the student's behalf from the staff dashboard
- [ ] No QR or barcode scan required — fully manual override
- [ ] Attendance record labeled as "staff-assisted" in the log

---

### 5. Downloadable Attendance & Course Reports (Admin)

**Priority:** Medium

- [ ] Export attendance records per class and per date range — CSV or PDF
- [ ] Export full course roster with student details
- [ ] Export student progress / grade summary per course
- [ ] Download button accessible from the admin dashboard

---

### 6. At-Risk Student Notifications

**Priority:** Medium

- [ ] Trigger notification when attendance drops below a configurable threshold (e.g. 70%)
- [ ] Trigger notification when grade/score falls below passing level
- [ ] Notifications delivered via in-app, email, or both
- [ ] Admin/instructor can define "trouble" thresholds per class or globally
- [ ] At-risk students flagged visibly on the admin and instructor dashboard

---

## Suggested Additions

These were not explicitly discussed in the meeting but are recommended based on the system architecture and likely operational needs.

---

### 7. Assignment Submission Portal (Student-Facing)

**Priority:** High

- [ ] Instructor creates an assignment with title, description, due date, and max score
- [ ] Students upload or submit their work from the student portal
- [ ] Instructor reviews submissions and enters a score with optional written feedback
- [ ] Late submission flag automatically applied past the due date
- [ ] Feeds directly into the grading system (item 1 above)

> **Why:** The grading system needs something to grade. Without a submission mechanism, assignments are managed off-platform (WhatsApp, email), making records incomplete.

---

### 8. Printable / Downloadable Student ID Card

**Priority:** Low

- [ ] Generated from the student profile — includes name, photo, student ID, enrolled course
- [ ] Contains a barcode or QR code usable for attendance sign-in
- [ ] Admin can download as PDF; student can also download theirs from the portal
- [ ] Ties the barcode attendance method to a physical card students carry

> **Why:** Solves the "no smartphone" problem for students too — they show their printed ID card at front desk or at a scanner.

---

### 9. Fee / Payment Tracking

**Priority:** Medium

- [ ] Record payments made against a student's course fee
- [ ] Mark students as fully paid, part-paid, or owing
- [ ] Send reminder notifications to students with outstanding balances
- [ ] Admin can export a payment status report per course
- [ ] Extends the existing `amount` field already on the `Course` model

> **Why:** The course model already stores a fee amount. Closing the loop with payment records prevents manual tracking in spreadsheets.

---

### 10. Bulk Student Import via CSV

**Priority:** Low

- [ ] Upload a CSV to create multiple student accounts at once
- [ ] Downloadable template so admins know the required column format
- [ ] Validation step shows errors row-by-row before confirming the import
- [ ] Welcome email auto-sent to each imported student with their login credentials

> **Why:** Onboarding a new cohort of 30+ students one by one will become time-consuming quickly.

---

### 11. Admin Audit Log

**Priority:** Low

- [ ] Log every significant action: who created, edited, or deleted a record, and when
- [ ] Filterable by user, date, and action type
- [ ] Read-only view — accessible by `super_admin` only
- [ ] Protects against disputes about who changed what

> **Why:** With multiple staff roles accessing and editing records, an audit trail is important for accountability and debugging.

---

## Open Question

Before building the grading system, confirm:

> **How are final grades weighted across the three components — attendance, assignments, and exams?**
> Is this configurable per course, or fixed system-wide? This affects the data model design.

---

## Summary

| #   | Feature                                 | Source    | Priority |
| --- | --------------------------------------- | --------- | -------- |
| 1   | Grading system                          | Meeting   | High     |
| 2   | Inquiry form                            | Meeting   | High     |
| 3   | Two sign-in methods + instructor toggle | Meeting   | High     |
| 4   | Front desk sign-in                      | Meeting   | Medium   |
| 5   | Downloadable reports                    | Meeting   | Medium   |
| 6   | At-risk notifications                   | Meeting   | Medium   |
| 7   | Assignment submission portal            | Suggested | High     |
| 8   | Student ID card (printable)             | Suggested | Low      |
| 9   | Fee / payment tracking                  | Suggested | Medium   |
| 10  | Bulk CSV import                         | Suggested | Low      |
| 11  | Admin audit log                         | Suggested | Low      |
