# Loctech — Todo List (Slack Channel)

> Extracted from team Slack conversation · March 2026

---

### 1. Project Status Indicator for Students class

**Requested by:** Instructor
**Priority:** Medium

- [x] Display a visible indicator/tag on a student's profile for class view when they are currently on a project
- [x] Instructor or admin should be able to toggle/set the "on project" status per student class
- [x] Optionally filter the student table by project status

NOTE: Class is marked on project not student

---

### 2. Convert Inquiry to Registered Student

**Requested by:** Loctech Enugu
**Priority:** High

- [x] Add a "Convert to Student" button on the inquiry record in the admin dashboard
- [x] On click, pre-fill a registration form with the inquiry details (name, email, phone, course interest)
- [x] Form should be ungraded (no score/assessment) — purely for onboarding
- [x] On submission, create a student account and link it back to the original inquiry
- [x] Mark the inquiry as "converted" in the inquiry log

---

### 3. Schedule / Class Assignment Module for New Students

**Requested by:** Loctech Enugu
**Priority:** High

- [x] After a student is registered, admin can assign them to a class (days and time)
- [x] Student receives an email notification confirming their assigned schedule
- [x] Email should clearly state the class days, start time, and any other relevant details
- [x] Student receives a follow-up notification reminding them of their upcoming class
- [x] Newly registered students without an assigned class should be clearly flagged in the admin dashboard

---

### 4. Attendance Absence Notification Message

**Requested by:** Chukwuemeka Chinenye Mirian
**Priority:** Medium

- [x] Implement the following draft notification for students who miss several consecutive classes:

  > _"Hello [Student Name], you have missed your classes for several consecutive weeks. Kindly send an email to loctechenugu@gmail.com requesting that your classes be placed on hold. This will enable us to properly manage your schedule until you are ready to resume. Thank you for your cooperation. — Loctech Team"_

Compare this with what we already have and implement

---

### 5. Grading System — Manual Assignment Grading

**Requested by:** Sammie
**Priority:** High

- [x] Instructor can create assignments with a title, description, and what the test/task is about
- [x] Instructor manually enters a grade/score for each student's submission
- [x] Assignment details (description + grade) are visible to the student on their portal
- [x] Students can see their grades per assignment from the student dashboard
- [x] Ties into the broader grading system already in the todo list

---

### 6. Fix: Course / Class Count on Students Table

**Requested by:** Chukwuemeka Chinenye Mirian
**Priority:** High (Bug Fix)

- [x] The course count on the students table currently displays zero even after a class has been assigned
- [x] Fix the count to correctly reflect the number of classes a student is enrolled in
- [x] Rename the column from "course count" to **"class count"** for accuracy
- [x] This makes it easy to identify students who have been assigned classes vs those who have not

---

### 7. Allow Editing of Classes After Creation

**Requested by:** Chukwuemeka Chinenye Mirian
**Priority:** High (Bug Fix / Access Control)

- [x] Admin and authorised staff should be able to edit a class record after it has been created
- [x] Fields that should be editable: instructor, schedule (days/time), class name, status, capacity
- [x] Add an "Edit" button/action to the class detail view in the admin dashboard
- [x] Ensure role-based access control is respected — only admin and super_admin can edit

---

## Summary

| #   | Feature                                      | Requested By    | Type             | Priority |
| --- | -------------------------------------------- | --------------- | ---------------- | -------- |
| 1   | Project status indicator for students        | Instructor      | Feature          | Medium   |
| 2   | Convert inquiry to registered student        | Loctech Enugu   | Feature          | High     |
| 3   | Schedule / class assignment module           | Loctech Enugu   | Feature          | High     |
| 4   | Absence notification message                 | Chinenye Mirian | Feature          | Medium   |
| 5   | Manual assignment grading + show to students | Sammie          | Feature          | High     |
| 6   | Fix class count on students table            | Chinenye Mirian | Bug Fix          | High     |
| 7   | Allow editing of classes after creation      | Chinenye Mirian | Bug Fix / Access | High     |
