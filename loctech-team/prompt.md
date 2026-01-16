I want to build an Attendance System using Next.js that integrates with Slack. Please generate the full implementation plan and code snippets where needed.

✅ Requirements

Sign-in Template:

Each attendance entry should capture:

Name of the user

Time signed in (auto-captured server-side in local timezone).

When a user signs in, a message should be sent to a Slack channel using Slack Bot Token API with a formatted template, e.g.:

:white_check_mark: Attendance Recorded
Name: John Doe
Time: 09:15 AM

Office Location Restriction:

Users should only be able to sign in when they are physically inside the office.

Suggested approach: use a QR code displayed in the office.

QR Code should encode a secret or unique session ID.

Scanning the QR code with the app should validate that the user is in-office.

Without scanning/valid QR, the user cannot sign in.

Next.js API Routes:

Backend logic should live inside /pages/api/\*.

The API should handle:

Validating QR code.

Recording attendance (save to DB or temporary JSON).

Sending Slack message with Bot Token (chat.postMessage).

Database (optional):

Use mongodb atlas (assistant should recommend best option).

Store id, name, time, and validated flag for each attendance record.

Frontend (Next.js + React):

Page with a form that lets users enter their name.

QR code scanner integration (camera access) using a library like react-qr-reader or qr-scanner.

Once QR is validated + name is provided, a POST request should be sent to /api/signin.

Slack Integration:

Use a Bot Token stored in .env.local.

Add code to send formatted attendance messages to a specific channel ID.

Security:

QR code secret should rotate daily (assistant should suggest a method).

Bot Token must never be exposed in frontend.

Only API route communicates with Slack.

✅ Deliverables from the Assistant

Project setup instructions for Next.js + dependencies.

Database schema (with mongoose if possible).

API route code for attendance submission.

Frontend form + QR scanner page.

Slack message integration code.

Sample .env.local file for storing secrets.

Optional improvement ideas (export attendance logs as CSV, mark sign-out, etc.).

🎯 Goal

At the end, I want a working Next.js Attendance System where:

Users can only sign in inside the office (QR validation).

Attendance automatically posts to a Slack channel in a clean template.

Data is stored in a database for reporting.
