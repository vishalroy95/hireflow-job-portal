# HireFlow - AI Powered Job Portal

HireFlow is a full-stack MERN job portal built for candidates, recruiters, and administrators. It supports job discovery, applications, recruiter billing, admin management, notifications, email workflows, support tickets, and AI-powered resume analysis.

## Highlights

- Candidate, recruiter, and admin workspaces
- AI resume analyzer using Google Gemini
- Recruiter plans and billing with Razorpay
- Professional email notifications with SMTP
- Job alerts and notification center
- Support ticket workflow with admin replies
- Admin dashboard for jobs, users, recruiters, applications, testimonials, logs, settings, email templates, AI settings, and payment plans
- Country-aware salary display with INR/USD handling
- Responsive React UI for desktop and mobile

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Admin Panel | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, Google OAuth |
| Payments | Razorpay |
| Email | Nodemailer SMTP |
| AI | Google Gemini API |

## Project Structure

```text
hireflow-job-portal/
  job_portal_backend/    Backend API and business logic
  job_portal_frontend/   Candidate and recruiter web app
  job_portal_admin/      Admin dashboard
  scripts/               Utility scripts
  .gitignore
  README.md
```

## Core Features

### Candidate

- Register, login, and manage profile
- Upload resume and apply to jobs
- Track application status
- Receive job alerts and recruiter profile-view notifications
- Analyze applied resumes with AI
- Contact support and track replies

### Recruiter

- Register and manage company profile
- Post and manage jobs
- Review applications and update candidate status
- View saved candidates
- Purchase recruiter plans with Razorpay
- Receive email when a candidate applies

### Admin

- Manage users, recruiters, jobs, and applications
- Approve testimonials
- Handle support tickets
- Configure email events and templates
- Configure AI resume analyzer settings
- Configure recruiter payment plans
- View system logs for debugging and audit history

## Environment Setup

Each app has its own `.env.example` file. Create real `.env` files locally from those examples.

```text
job_portal_backend/.env.example
job_portal_frontend/.env.example
job_portal_admin/.env.example
```

Real `.env` files are intentionally ignored by Git and must never be committed.

## Run Locally

Backend:

```bash
cd job_portal_backend
npm install
npm run dev
```

Frontend:

```bash
cd job_portal_frontend
npm install
npm run dev
```

Admin:

```bash
cd job_portal_admin
npm install
npm run dev
```

## Deployment Plan

Recommended production setup:

- Backend API: Render
- Candidate and recruiter frontend: Vercel
- Admin dashboard: Vercel
- Database: MongoDB Atlas

Production environment variables should be configured inside Render and Vercel dashboards, not committed to GitHub.

## Live Links

- Frontend: Coming soon
- Admin: Coming soon
- Backend API: Coming soon

## Security Notes

- Passwords are hashed before storage
- Protected routes use JWT authentication
- Environment secrets are excluded from Git
- Resume and uploaded user files are excluded from Git
- Admin features are separated from public candidate/recruiter flows

## Repository Topics

Recommended GitHub topics:

```text
mern-stack
job-portal
react
nodejs
express
mongodb
admin-dashboard
razorpay
gemini-ai
resume-analyzer
```

## Author

Vishal Roy
