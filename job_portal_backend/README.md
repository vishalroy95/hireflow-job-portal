# Job Portal Backend - MERN Stack

A production-ready backend for a Job Portal application built with Node.js, Express.js, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

## ✨ Features

- ✅ User Authentication (Register, Login, Logout)
- ✅ JWT-based Authorization
- ✅ Role-based Access Control (Candidate/Recruiter)
- ✅ Job Posting Management
- ✅ Job Application System
- ✅ Application Status Tracking
- ✅ Filtered Job Search
- ✅ User Profile Management
- ✅ Password Hashing with bcryptjs
- ✅ Error Handling Middleware
- ✅ CORS Enabled
- ✅ Cookie-based Session Management

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **CORS**: Cross-Origin Resource Sharing
- **Environment Variables**: dotenv

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (Local or Atlas)

### Setup Steps

1. **Clone or navigate to project directory:**

```bash
cd job-portal
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/job_portal

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

---

### Authentication Routes (`/auth`)

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "candidate" // or "recruiter"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "candidate"
  }
}
```

#### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "message": "Logged in successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "candidate"
  }
}
```

#### Get User Profile (Protected)
```
GET /auth/profile
Authorization: Bearer jwt_token_here

Response: 200 OK
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "candidate",
    "skills": ["JavaScript", "React"],
    "resume": "url_to_resume",
    "profileImage": "url_to_image",
    ...
  }
}
```

#### Update User Profile (Protected)
```
PUT /auth/profile
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "John Doe Updated",
  "bio": "Full Stack Developer",
  "skills": ["JavaScript", "React", "Node.js"],
  "contact": {
    "phone": "+1234567890",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe"
  }
}

Response: 200 OK
```

#### Logout User (Protected)
```
GET /auth/logout
Authorization: Bearer jwt_token_here

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Job Routes (`/jobs`)

#### Create Job (Recruiter Only)
```
POST /jobs
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Senior React Developer",
  "company": "Tech Company",
  "location": "New York, NY",
  "salary": {
    "min": 100000,
    "max": 150000,
    "currency": "USD"
  },
  "description": "We are looking for experienced React developers...",
  "skillsRequired": ["React", "Node.js", "MongoDB"],
  "jobType": "Full-time",
  "experience": "Senior Level"
}

Response: 201 Created
```

#### Get All Jobs
```
GET /jobs?page=1&limit=10&title=React&location=NYC&minSalary=100000&maxSalary=150000

Response: 200 OK
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "jobs": [...]
}
```

#### Get Single Job
```
GET /jobs/:jobId

Response: 200 OK
{
  "success": true,
  "job": {...}
}
```

#### Update Job (Recruiter Only)
```
PUT /jobs/:jobId
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description...",
  ...
}

Response: 200 OK
```

#### Delete Job (Recruiter Only)
```
DELETE /jobs/:jobId
Authorization: Bearer jwt_token_here

Response: 200 OK
{
  "success": true,
  "message": "Job deleted successfully"
}
```

#### Get My Jobs (Recruiter Only)
```
GET /jobs/recruiter/my-jobs
Authorization: Bearer jwt_token_here

Response: 200 OK
{
  "success": true,
  "count": 5,
  "jobs": [...]
}
```

---

### Application Routes (`/applications`)

#### Apply for Job (Candidate Only)
```
POST /applications/apply/:jobId
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "coverLetter": "I am very interested in this position..."
}

Response: 201 Created
{
  "success": true,
  "message": "Application submitted successfully",
  "application": {...}
}
```

#### Get My Applications (Candidate Only)
```
GET /applications/my-applications
Authorization: Bearer jwt_token_here

Response: 200 OK
{
  "success": true,
  "count": 3,
  "applications": [...]
}
```

#### Get Job Applications (Recruiter Only)
```
GET /applications/job/:jobId
Authorization: Bearer jwt_token_here

Response: 200 OK
{
  "success": true,
  "count": 15,
  "applications": [...]
}
```

#### Update Application Status (Recruiter Only)
```
PUT /applications/status/:applicationId
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "status": "accepted" // or "rejected", "shortlisted", "pending"
}

Response: 200 OK
{
  "success": true,
  "message": "Application status updated successfully",
  "application": {...}
}
```

#### Get Application Statistics (Recruiter Only)
```
GET /applications/stats/:jobId
Authorization: Bearer jwt_token_here

Response: 200 OK
{
  "success": true,
  "total": 25,
  "stats": [
    { "_id": "pending", "count": 10 },
    { "_id": "accepted", "count": 5 }
  ]
}
```

---

## 📁 Project Structure

```
job-portal/
├── config/
│   └── database.js              # MongoDB connection configuration
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── jobController.js         # Job management logic
│   └── applicationController.js # Application management logic
├── middleware/
│   ├── auth.js                  # JWT verification middleware
│   ├── roleCheck.js             # Role-based access control
│   └── errorHandler.js          # Global error handling
├── models/
│   ├── User.js                  # User schema
│   ├── Job.js                   # Job schema
│   └── Application.js           # Application schema
├── routes/
│   ├── authRoutes.js            # Auth routes
│   ├── jobRoutes.js             # Job routes
│   └── applicationRoutes.js     # Application routes
├── uploads/                     # File uploads directory
├── utils/
│   └── validators.js            # Validation helper functions
├── server.js                    # Main server file
├── .env                         # Environment variables
├── .env.example                 # Example environment file
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🔐 Authentication Flow

1. User registers with email and password
2. Password is hashed using bcryptjs
3. JWT token is generated and sent to client
4. Token is stored in httpOnly cookie or local storage
5. For protected routes, token is verified via middleware
6. Role-based middleware checks user permissions

## 🛡️ Security Features

- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT-based authentication
- ✅ httpOnly cookies for secure token storage
- ✅ CORS protection
- ✅ Role-based access control
- ✅ Input validation
- ✅ Error handling without exposing sensitive info
- ✅ Environment variables for secrets

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Additional error details (development only)"
}
```

Common HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Update `MONGODB_URI` to production database
3. Change `JWT_SECRET` to a strong secret
4. Update `CORS_ORIGIN` for production frontend URL
5. Use process manager like PM2
6. Set up reverse proxy (nginx/Apache)
7. Enable HTTPS/SSL

## 📞 Support

For issues or questions, please check the code comments or create an issue in the repository.

## 📄 License

This project is open source and available under the ISC License.

## Candidate Module

The backend now includes a dedicated candidate/student module for a LinkedIn/Naukri/Internshala-style job portal experience.

Primary models:

- `User`: authentication, role, basic candidate fields, skills, resume, profile image, contact links
- `CandidateProfile`: phone, location, education, experience, social links, resume metadata, saved jobs, recently viewed jobs, privacy settings
- `Job`: public job listings with salary, skills, experience, workplace type, openings, status, featured flag
- `Application`: candidate applications with stage, resume, salary expectation, education, skill match, AI screening summary
- `Notification`: interview alerts, recruiter messages, job alerts, system notifications

Candidate APIs require JWT auth and `role = "candidate"`:

```txt
GET    /api/candidate/dashboard
GET    /api/candidate/profile
PUT    /api/candidate/profile
POST   /api/candidate/profile/resume
POST   /api/candidate/profile/image
POST   /api/candidate/profile/parse-resume
GET    /api/candidate/saved-jobs
PUT    /api/candidate/saved-jobs/:jobId
POST   /api/candidate/viewed-jobs/:jobId
GET    /api/candidate/recommended-jobs
GET    /api/candidate/notifications
PUT    /api/candidate/notifications/:id/read
PUT    /api/candidate/settings/password
DELETE /api/candidate/settings/account
```

Candidate registration supports full name, email, password, phone number, skills, education, experience, resume URL, portfolio URL, LinkedIn URL, GitHub URL, location, and profile image URL.

File uploads use Multer and are stored in:

```txt
uploads/resumes
uploads/profile-images
```

Public upload URLs are served from:

```txt
/uploads/resumes/:filename
/uploads/profile-images/:filename
```

Candidate features include profile management, resume upload, resume parsing placeholder, AI-style skill match percentage, saved jobs, recently viewed jobs, recommended jobs, notifications, recruiter messages, password change, and account deletion.

Application pipeline stages:

- `applied`
- `under-review`
- `shortlisted`
- `interview-scheduled`
- `selected`
- `rejected`

## Recruiter Module

Recruiter APIs require JWT auth and `role = "recruiter"`:

```txt
GET    /api/recruiter/dashboard
GET    /api/recruiter/company
PUT    /api/recruiter/company
POST   /api/recruiter/jobs
PUT    /api/recruiter/jobs/:id
POST   /api/recruiter/jobs/:id/duplicate
PUT    /api/recruiter/jobs/:id/status
GET    /api/recruiter/applicants
PUT    /api/recruiter/applicants/:id/status
POST   /api/recruiter/applicants/:id/screen
GET    /api/recruiter/interviews
POST   /api/recruiter/interviews
PUT    /api/recruiter/interviews/:id
GET    /api/recruiter/messages
POST   /api/recruiter/messages
GET    /api/recruiter/analytics
GET    /api/recruiter/subscription
```

Recruiter models include `RecruiterProfile`, `Company`, `Interview`, `Message`, `Notification`, and `Subscription`.

## Admin Settings

Admin settings are persisted in MongoDB through the `PlatformSettings` model and protected by admin JWT access.

```txt
GET    /api/admin/settings
PUT    /api/admin/settings/general
PUT    /api/admin/settings/branding
PUT    /api/admin/settings/email
POST   /api/admin/settings/logo
POST   /api/admin/settings/banner
```

Settings include platform name/title, support contact, default currency, timezone, maintenance mode, candidate/recruiter registration toggles, branding colors/assets, and email provider or SMTP configuration. Uploaded branding assets are stored in `uploads/branding` and served from `/uploads/branding/:filename`.

## Security Notes

- Passwords are hashed with bcryptjs.
- JWT protects private routes.
- Role middleware separates candidate, recruiter, and admin access.
- Uploads are limited to 5 MB and filtered by file type.
- Forgot password and email verification APIs generate tokens. Email delivery is not wired to an external provider yet.
- Rate limiting, production email delivery, payment providers, and socket providers are recommended before public launch.

---

**Happy Coding! 🎉**
