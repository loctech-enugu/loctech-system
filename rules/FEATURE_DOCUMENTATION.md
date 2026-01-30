# Loctech Academic System Refactor – Feature Documentation

## Overview

This document describes the refactor and extension of Loctech’s existing academic management system.  
The goal is to align the system with real-world academic operations while preserving existing functionality and data where possible.

This is **not a greenfield redesign**. The focus is on:
- Introducing clearer academic structures
- Enforcing role separation and access boundaries
- Improving attendance tracking and operational visibility
- Making admin and instructor workflows predictable and auditable

The refactor introduces explicit distinctions between **Courses**, **Classes**, **Enrollments**, and **Attendance**, and clarifies how Admin, Staff, Instructors, and Students interact with the system.

---

## Core Academic Structure Refactor

### Existing Problem

The current system treats courses as the primary unit of enrollment and instruction. This creates several issues:
- Instructors cannot be cleanly scoped to a subset of students
- Attendance is difficult to track accurately
- Parallel classes under the same course cannot be represented
- Instructor permissions are overly broad or unclear

### Refactored Model

#### Key Concepts

- **Course**
  - Represents the academic program (e.g., Web Development, Data Analysis)
  - Acts as a container for classes and instructors

- **Class**
  - Represents a specific teaching group under a course
  - Has:
    - One assigned instructor
    - A schedule
    - A defined group of students

- **Instructor**
  - Can be assigned to multiple courses
  - Teaches one or more classes
  - Has access only to the classes they are assigned to

- **Student**
  - Enrolled in one or more classes
  - Never enrolled directly in a course

#### Structural Rules

- One course can have multiple instructors
- One course can have multiple classes
- Each class belongs to exactly one course
- Each class has exactly one instructor
- Students are enrolled in classes, not courses
- Instructors can only access their assigned classes

---

### Why This Structure Is Required

- **Operational accuracy**
  - Attendance, performance, and notifications happen at the class level
- **Instructor isolation**
  - Prevents instructors from accessing unrelated students or data
- **Scalability**
  - Supports parallel classes, different schedules, and staggered cohorts
- **Data integrity**
  - Removes ambiguity in reporting and monitoring

---

### Impact on Existing Data

- Existing course enrollments must be migrated into:
  - One or more default classes per course
- Students previously linked directly to courses must be:
  - Mapped into classes under those courses
- Instructor access must be re-scoped:
  - From course-wide to class-specific

---

## Roles and Access Boundaries

### Super Admin
- Full system access
- Can manage all entities and override restrictions

### Admin
- Academic and operational control
- Manages courses, classes, instructors, students, and attendance

### Staff
- Limited administrative access
- Can manage enrollments, attendance monitoring, and class status
- Cannot alter core system configuration

### Instructor
- Access limited to assigned classes
- Can:
  - View class rosters
  - Generate attendance PIN/barcode
  - View attendance records for their classes

### Student
- Read-only access to academic information
- Can perform attendance sign-in

---

## Admin / Staff Features

### Course Management

- Create and update courses
- Assign multiple instructors to a course
- View all classes under a course
- View aggregate course statistics (enrollment, attendance)

---

### Class Management

- Create classes under a course
- Assign exactly one instructor per class
- Define:
  - Schedule
  - Capacity (optional)
- Add or remove students from a class
- View class-level attendance and risk indicators

---

### Attendance System

#### Attendance Capture

- Attendance is recorded per:
  - Student
  - Class
  - Date
- Attendance sign-in methods:
  - Barcode scan
  - Time-bound generated PIN

#### Access Control

- Barcode/PIN visible only to:
  - Assigned instructor for the class
  - Admin or Super Admin

#### Constraints

- Attendance cannot be recorded if:
  - The class enrollment is paused
  - The class session is not active for the day

---

### Attendance Monitoring

- Track consecutive absences **per student per class**
- Display in a tabular view:
  - Student name
  - Class
  - Last attendance date
  - Consecutive absence count
  - Notification status

---

### Automated Absence Notifications

#### Trigger Rule

- Trigger when a student misses **2 consecutive class sessions**

#### Workflow

- System displays an action button:
  - “Notify Student”
- On action:
  - Send email using a predefined template
  - Mark student as `Notified` for that absence streak
  - Store:
    - Notification timestamp
    - Actor (admin or staff)

#### Safeguards

- Prevent duplicate notifications for the same absence streak
- Reset notification status when attendance resumes

---

### Class Status Management (Student-Level)

- Admin or Staff can:
  - Pause (hibernate) a student’s enrollment in a class
- Optional reason field
- While paused:
  - Attendance cannot be recorded
  - Student is excluded from absence calculations
- Status must be visible in:
  - Class roster
  - Attendance tables

---

## Student Panel Features

### Authentication
- Secure login
- Session-based access

### Dashboard Views

- Courses enrolled (derived from classes)
- Classes:
  - Instructor
  - Schedule
  - Status (active / paused)

### Announcements

- View announcements scoped to:
  - Their classes
  - Their course
- No global broadcast access

### Attendance

- Sign in using barcode or PIN
- View personal attendance history (read-only)

### Session Management

- Explicit sign out
- No access to administrative functions

---

## Data & Schema Considerations

### Core Entities

#### Course
- id
- name
- description
- status

#### Class
- id
- course_id
- instructor_id
- schedule
- status

#### Enrollment
- id
- student_id
- class_id
- status (active, paused)
- pause_reason (optional)

#### Attendance
- id
- student_id
- class_id
- date
- status (present, absent)
- recorded_at

#### Notification
- id
- student_id
- class_id
- type (absence)
- sent_at
- sent_by

---

### Relationships

- Course → has many Classes
- Course → has many Instructors
- Class → belongs to one Course
- Class → belongs to one Instructor
- Class → has many Enrollments
- Enrollment → belongs to one Student
- Attendance → belongs to Student + Class
- Notification → belongs to Student + Class

---

## Operational Improvements

### Instructor Dashboards
- Today’s classes
- Attendance completion status
- At-risk students (by class)

### Class-Level Reports
- Attendance percentage
- Absence trends
- Enrollment changes over time

### Attendance Summaries
- Daily summaries per class
- Weekly summaries per instructor
- Exportable formats

### High-Risk Student Alerts
- Configurable thresholds (e.g., 3+ absences)
- Visible to Admin and Staff dashboards

### Audit Logs
- Track admin and staff actions:
  - Enrollment changes
  - Attendance overrides
  - Notifications sent
  - Status changes
- Include timestamp and actor

---

## Summary

This refactor introduces:
- Clear separation between courses and classes
- Predictable instructor and student access boundaries
- Reliable attendance tracking at the correct academic level
- Operational tooling for monitoring and intervention

The system becomes easier to reason about, scale, and audit while remaining aligned with real training institute workflows.
