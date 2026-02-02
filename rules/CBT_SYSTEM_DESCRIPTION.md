# Computer-Based Testing (CBT) System - Description & Features

## System Overview

The CBT (Computer-Based Testing) System is a comprehensive, web-based examination platform designed for educational institutions. It provides a secure, automated, and user-friendly environment for creating, administering, and managing online examinations. The system is built with a modern tech stack featuring separate admin and student interfaces, robust security measures, and comprehensive result management capabilities.

## Architecture

The system follows a three-tier architecture:
- **Backend**: Node.js/Express with MongoDB (Mongoose) for data persistence
- **Admin Panel**: React-based interface for exam creators and administrators
- **Client Portal**: React-based interface for students taking exams

---

## Core Features

### 1. Exam Management (Admin)

#### 1.1 Exam Creation & Configuration
- **Flexible Exam Setup**: Create exams with customizable titles, descriptions, and metadata
- **Duration Management**: Set exam duration in minutes with automatic time tracking
- **Question Pool Management**: 
  - Select questions from a centralized question bank
  - Set total questions per exam
  - Configure questions per student (enables randomization)
  - Support for question shuffling per student
- **Scoring Configuration**:
  - Set passing score percentage (0-100%)
  - Configure maximum attempts per student
  - Automatic score calculation
- **Status Management**: 
  - Draft → Published → Ongoing → Completed → Cancelled workflow
  - Exam lifecycle tracking
- **Scheduling**:
  - Set scheduled start date/time
  - Configure expiration date/time
  - Automatic exam availability based on schedule

#### 1.2 Question Management
- **Question Bank System**:
  - Centralized question repository
  - Multiple question types: MCQ, True/False, Essay, Fill-in-the-Blank, Matching
  - Question categorization and tagging
  - Difficulty levels: Easy, Medium, Hard
  - Question search and filtering capabilities
- **Question Selection Interface**:
  - Visual question selector with checkboxes
  - Filter by category, difficulty, and search text
  - Bulk selection (select all filtered)
  - Real-time question count display
- **Question Assignment**:
  - Link questions to specific exams
  - Support for question randomization per student
  - Configurable questions per student (subset selection)

#### 1.3 Exam Publishing & Distribution
- **Publish/Unpublish Control**: Toggle exam availability for students
- **Result Publishing Options**:
  - Auto-publish results immediately after submission
  - Manual result publishing control
  - Individual result publishing per student
- **Result Visibility Settings**:
  - Show/hide correct answers
  - Show/hide detailed feedback
  - Customizable result display options

#### 1.4 Exam Analytics & Monitoring
- **Dashboard Statistics**:
  - Total exams count
  - Published exams count
  - Draft exams count
  - Completed exams count
- **Exam Listing**:
  - View all exams with status badges
  - Filter and search capabilities
  - Quick access to exam management actions

### 2. Student Exam Interface

#### 2.1 Exam Taking Experience
- **Full-Screen Mode**: Automatic full-screen activation for focused exam environment
- **Real-Time Timer**: 
  - Countdown timer with visual progress indicator
  - Color-coded warnings (blue → orange → red)
  - Blinking alerts when time is running low
  - Automatic submission when time expires
- **Question Navigation**:
  - One question per page display
  - Previous/Next navigation buttons
  - Question navigation sidebar with visual indicators
  - Progress bar showing completion percentage
  - Question numbering (e.g., "Question 5 of 20")
- **Answer Management**:
  - Save answers in real-time
  - Flag questions for review
  - Visual indicators for answered/unanswered questions
  - Answer persistence across navigation

#### 2.2 Built-in Tools
- **Calculator Dialog**: Integrated calculator tool for mathematical exams
- **Question Flagging**: Mark questions for later review
- **Answer Review**: Navigate back to review and modify answers

#### 2.3 Exam Submission
- **Manual Submission**: Submit exam when ready
- **Automatic Submission**: 
  - Time expiry auto-submission
  - Violation-based auto-submission
- **Submission Confirmation**: Loading state during submission process
- **Completion Screen**: Post-submission confirmation and next steps

### 3. Security & Anti-Cheating Features

#### 3.1 Tab/Focus Monitoring
- **Tab Switch Detection**: 
  - Monitors window visibility changes
  - Tracks window blur events
  - Warning system (3-strike policy)
  - Automatic exam submission after 3 violations
- **Warning System**:
  - Visual warning modals on violation
  - Warning count display
  - Clear instructions about exam rules
  - Progressive warnings before auto-submission

#### 3.2 Browser Security
- **Right-Click Disabled**: Prevents context menu access
- **Copy Prevention**: Blocks copy operations
- **Full-Screen Enforcement**: Encourages full-screen mode
- **Focus Loss Detection**: Monitors when exam window loses focus

#### 3.3 Violation Tracking
- **Violation Logging**: 
  - Tracks all security violations
  - Stores violation metadata in exam session
  - Violation types: tab-switch, exit-fullscreen, focus-lost, right-click, copy-attempt, etc.
- **Auto-Fail Mechanism**: 
  - Configurable violation threshold (default: 5 violations)
  - Automatic exam termination on excessive violations
  - Score set to 0 on violation-based termination

### 4. Result Management

#### 4.1 Automatic Scoring
- **Real-Time Calculation**: 
  - Automatic answer comparison
  - Score calculation on submission
  - Percentage score computation
  - Points per question tracking
- **Result Storage**:
  - Correct/incorrect answer tracking
  - Time spent per question
  - Overall exam time tracking
  - Submission timestamp

#### 4.2 Result Publishing
- **Publishing Control**:
  - Individual result publishing per student
  - Bulk result publishing
  - Auto-publish option
- **Result Visibility**:
  - Show correct answers (configurable)
  - Show detailed feedback (configurable)
  - Question-by-question review
  - Explanation display for incorrect answers

#### 4.3 Result Display
- **Student View**:
  - Overall score and percentage
  - Pass/fail status
  - Correct vs incorrect count
  - Question-by-question breakdown
  - Time spent analysis
- **Admin View**:
  - All student results
  - Performance analytics
  - Result export capabilities

### 5. Email Notification System

#### 5.1 Email Templates
- **Customizable Templates**: 
  - HTML email templates
  - Variable substitution
  - Template management system
- **Email Types**:
  - Registration success
  - Exam published notification
  - Exam submission confirmation
  - Result published notification
  - Admin student registration
  - Exam reminders
  - System notifications

#### 5.2 Email Logging
- **Delivery Tracking**:
  - Email status: Pending, Sent, Failed, Delivered, Bounced
  - Error message logging
  - Sent timestamp tracking
  - Recipient email tracking

### 6. User Management

#### 6.1 Student Management
- **User Profiles**:
  - Name, email, phone
  - Location (Nigerian states)
  - Education level (Graduate, NYSC, Undergraduate, Secondary)
  - Course of interest
  - Preferred exam time
- **User Status**:
  - Pending, Active, Inactive, Suspended
  - Password management
  - First-time password change requirement
- **Custom Fields**: Extensible user data fields

#### 6.2 Admin Management
- **Admin Accounts**: Separate admin authentication and authorization
- **Role-Based Access**: Admin-only features and routes

### 7. Question Bank System

#### 7.1 Question Categories
- **Category Management**:
  - Create and manage question categories
  - Category-based filtering
  - Active/inactive category status
- **Question Organization**:
  - Tag-based organization
  - Difficulty-based filtering
  - Category-based filtering
  - Search functionality

#### 7.2 Question Types
- **Multiple Choice Questions (MCQ)**: Standard multiple choice with options
- **True/False**: Binary choice questions
- **Essay**: Long-form text answers
- **Fill-in-the-Blank**: Text completion questions
- **Matching**: Matching pairs questions

### 8. Exam Session Management

#### 8.1 Session Tracking
- **Exam Status**:
  - NOT_STARTED: Exam assigned but not started
  - IN_PROGRESS: Exam currently being taken
  - COMPLETED: Exam submitted and scored
  - EXPIRED: Exam time expired
  - CANCELLED: Exam cancelled
- **Time Tracking**:
  - Start time recording
  - End time recording
  - Time spent calculation
  - Completion timestamp

#### 8.2 Attempt Management
- **Multiple Attempts**: Support for multiple exam attempts per student
- **Attempt Numbering**: Track attempt sequence
- **Attempt Restrictions**: Configurable max attempts per exam

### 9. Data Models & Relationships

#### 9.1 Core Entities
- **Exam**: Exam configuration and settings
- **Question**: Question bank items
- **UserExam**: Student-exam relationship and status
- **UserAnswer**: Individual question responses
- **UserResponse**: Form field responses
- **Category**: Question categorization
- **EmailTemplate**: Email notification templates
- **EmailLog**: Email delivery tracking

#### 9.2 Data Integrity
- **Unique Constraints**: Prevent duplicate exam attempts
- **Referential Integrity**: Maintained relationships between entities
- **Indexing**: Optimized database queries with proper indexes

---

## Technical Features

### Frontend Technologies
- **React**: Modern UI framework
- **TypeScript**: Type-safe development
- **React Router**: Client-side routing
- **React Query**: Data fetching and caching
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Component library

### Backend Technologies
- **Node.js/Express**: Server framework
- **MongoDB/Mongoose**: Database and ODM
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing

### Security Features
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Password Security**: Hashed passwords with bcrypt
- **Session Management**: Secure session tracking
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: Parameterized queries (Mongoose)

---

## Integration with School Management System

### Recommended Integration Points

1. **Student Information System (SIS)**
   - Import student data from existing SIS
   - Sync student enrollment status
   - Link exam assignments to student records
   - Export exam results to student transcripts

2. **Gradebook Integration**
   - Push exam scores to gradebook
   - Automatic grade calculation
   - Weighted exam scores
   - Grade history tracking

3. **Course Management**
   - Link exams to specific courses
   - Course-based question banks
   - Semester/term-based exam organization
   - Curriculum-aligned question tagging

4. **Attendance System**
   - Track exam attendance
   - Mark absent students
   - Reschedule exams for absent students
   - Attendance-based exam eligibility

5. **Parent Portal**
   - Notify parents of exam schedules
   - Share exam results with parents
   - Parent access to student performance
   - Progress reports

6. **Teacher Dashboard**
   - Teacher-specific exam creation
   - Class-based exam assignment
   - Performance analytics per class
   - Question bank sharing among teachers

7. **Reporting & Analytics**
   - Class performance reports
   - Subject-wise analytics
   - Student progress tracking
   - Comparative analysis
   - Export to Excel/PDF

8. **Notification System**
   - SMS integration for exam reminders
   - Push notifications
   - Email notifications (already implemented)
   - In-app notifications

---

## Benefits for Educational Institutions

### For Administrators
- **Efficiency**: Automated exam creation and grading
- **Time Savings**: Reduced manual grading time
- **Scalability**: Handle large numbers of students simultaneously
- **Consistency**: Standardized exam delivery
- **Analytics**: Comprehensive performance insights
- **Security**: Built-in anti-cheating measures

### For Teachers
- **Question Bank Reusability**: Build and reuse question banks
- **Flexible Scheduling**: Schedule exams at convenient times
- **Quick Results**: Instant grading and results
- **Detailed Analytics**: Understand student performance patterns
- **Customization**: Tailor exams to specific learning objectives

### For Students
- **Convenience**: Take exams from any location
- **Immediate Feedback**: Quick result delivery
- **Fair Assessment**: Randomized questions prevent cheating
- **User-Friendly Interface**: Intuitive exam-taking experience
- **Progress Tracking**: View performance history

### For Parents
- **Transparency**: Access to student exam results
- **Timely Updates**: Notifications about exam schedules and results
- **Performance Monitoring**: Track student progress over time

---

## Implementation Considerations

### Infrastructure Requirements
- **Server**: Node.js hosting environment
- **Database**: MongoDB instance
- **Storage**: File storage for question media (if needed)
- **Email Service**: SMTP server for email notifications
- **CDN**: Content delivery for static assets (optional)

### Scalability
- **Load Balancing**: Handle concurrent exam sessions
- **Database Optimization**: Proper indexing and query optimization
- **Caching**: Cache frequently accessed data
- **Session Management**: Efficient session storage

### Security Best Practices
- **HTTPS**: Encrypted connections
- **Regular Updates**: Keep dependencies updated
- **Backup Strategy**: Regular database backups
- **Access Control**: Strict authentication and authorization
- **Audit Logging**: Track all system activities

### Training & Support
- **Admin Training**: Train administrators on exam creation
- **Student Orientation**: Guide students on using the system
- **Documentation**: Comprehensive user guides
- **Support System**: Help desk for technical issues

---

## Future Enhancement Opportunities

1. **Proctoring Integration**: AI-based proctoring with webcam monitoring
2. **Offline Mode**: Support for offline exam taking with sync
3. **Mobile App**: Native mobile applications
4. **Advanced Analytics**: Machine learning-based performance predictions
5. **Adaptive Testing**: Dynamic question difficulty adjustment
6. **Multimedia Support**: Audio/video questions
7. **Collaborative Exams**: Group exam features
8. **Gamification**: Points, badges, leaderboards
9. **Integration APIs**: RESTful APIs for third-party integrations
10. **Multi-language Support**: Internationalization

---

## Conclusion

This CBT System provides a comprehensive, secure, and scalable solution for educational institutions to conduct online examinations. With its robust feature set, security measures, and user-friendly interfaces, it streamlines the exam process from creation to result delivery. The system's modular architecture and integration capabilities make it an ideal choice for schools looking to modernize their examination processes while maintaining academic integrity and providing valuable insights into student performance.
