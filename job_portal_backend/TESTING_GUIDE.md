# Job Portal Backend - Testing Guide

Complete guide to test all API endpoints using cURL or Postman.

## 🚀 Getting Started

### 1. Start the Server
```bash
npm run dev
```
Server should be running at: `http://localhost:5000`

### 2. Make sure MongoDB is Running
```bash
mongod
```

---

## 🧪 Testing All Endpoints

### Authentication Tests

#### 1. Register as Candidate
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Candidate",
    "email": "candidate@example.com",
    "password": "password123",
    "role": "candidate"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Candidate",
    "email": "candidate@example.com",
    "role": "candidate"
  }
}
```

**Save the token!** You'll need it for authenticated requests.

---

#### 2. Register as Recruiter
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Recruiter",
    "email": "recruiter@example.com",
    "password": "password123",
    "role": "recruiter"
  }'
```

---

#### 3. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "password": "password123"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

---

#### 4. Get User Profile (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the token from login/register.

---

#### 5. Update User Profile (Protected)
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Candidate Updated",
    "bio": "Full Stack Developer",
    "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
    "contact": {
      "phone": "+1-555-0123",
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe",
      "portfolio": "https://johndoe.com"
    }
  }'
```

---

#### 6. Logout (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Job Management Tests

#### 7. Create Job (Recruiter Only)
First, get a recruiter token from login.

```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -d '{
    "title": "Senior React Developer",
    "company": "Tech Innovations Inc",
    "location": "San Francisco, CA",
    "salary": {
      "min": 120000,
      "max": 160000,
      "currency": "USD"
    },
    "description": "We are looking for an experienced React developer with 5+ years of experience. You will work on modern web applications and lead a small team.",
    "skillsRequired": ["React", "TypeScript", "Node.js", "MongoDB"],
    "jobType": "Full-time",
    "experience": "Senior Level"
  }'
```

Save the job ID from the response - you'll need it for other tests!

---

#### 8. Create Another Job
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -d '{
    "title": "Junior Python Developer",
    "company": "StartUp Labs",
    "location": "New York, NY",
    "salary": {
      "min": 60000,
      "max": 80000,
      "currency": "USD"
    },
    "description": "Entry-level position for Python developer. Great opportunity to learn and grow with a startup.",
    "skillsRequired": ["Python", "Django", "PostgreSQL"],
    "jobType": "Full-time",
    "experience": "Entry Level"
  }'
```

---

#### 9. Get All Jobs (No Auth Required)
```bash
curl http://localhost:5000/api/jobs
```

Expected Response:
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "pages": 1,
  "jobs": [...]
}
```

---

#### 10. Get Jobs with Filters
```bash
# Filter by title
curl "http://localhost:5000/api/jobs?title=React"

# Filter by location
curl "http://localhost:5000/api/jobs?location=San%20Francisco"

# Filter by salary range
curl "http://localhost:5000/api/jobs?minSalary=100000&maxSalary=150000"

# Filter by job type
curl "http://localhost:5000/api/jobs?jobType=Full-time"

# Filter by experience level
curl "http://localhost:5000/api/jobs?experience=Senior%20Level"

# Combine multiple filters
curl "http://localhost:5000/api/jobs?title=React&location=San%20Francisco&minSalary=100000"

# Pagination
curl "http://localhost:5000/api/jobs?page=1&limit=5"
```

---

#### 11. Get Single Job (No Auth Required)
```bash
curl http://localhost:5000/api/jobs/JOB_ID_HERE
```

Replace `JOB_ID_HERE` with the actual job ID.

---

#### 12. Update Job (Recruiter Owner Only)
```bash
curl -X PUT http://localhost:5000/api/jobs/JOB_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -d '{
    "title": "Senior React Developer (Updated)",
    "salary": {
      "min": 130000,
      "max": 170000,
      "currency": "USD"
    },
    "active": true
  }'
```

---

#### 13. Get My Jobs (Recruiter Only)
```bash
curl http://localhost:5000/api/jobs/recruiter/my-jobs \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

---

#### 14. Delete Job (Recruiter Owner Only)
```bash
curl -X DELETE http://localhost:5000/api/jobs/JOB_ID_HERE \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

---

### Application Management Tests

#### 15. Apply for Job (Candidate Only)
Get a candidate token from login first.

```bash
curl -X POST http://localhost:5000/api/applications/apply/JOB_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{
    "coverLetter": "I am very interested in this position. With my 5+ years of React experience and strong TypeScript skills, I believe I am a perfect fit for your team. I am excited about the opportunity to contribute to your innovative projects."
  }'
```

Replace `JOB_ID_HERE` with the actual job ID.

Save the application ID from response!

---

#### 16. Apply for Another Job
```bash
curl -X POST http://localhost:5000/api/applications/apply/ANOTHER_JOB_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{
    "coverLetter": "I am interested in this Python developer position..."
  }'
```

---

#### 17. Get My Applications (Candidate Only)
```bash
curl http://localhost:5000/api/applications/my-applications \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "count": 2,
  "applications": [
    {
      "_id": "...",
      "userId": "...",
      "jobId": {
        "title": "Senior React Developer",
        "company": "Tech Innovations Inc",
        ...
      },
      "status": "pending",
      "coverletter": "...",
      "appliedAt": "2024-05-21T10:30:00Z"
    },
    ...
  ]
}
```

---

#### 18. Try to Apply for Same Job Again (Should Fail)
```bash
curl -X POST http://localhost:5000/api/applications/apply/JOB_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{
    "coverLetter": "Second application attempt"
  }'
```

Expected Error:
```json
{
  "success": false,
  "message": "You have already applied for this job"
}
```

This demonstrates that duplicate applications are prevented!

---

#### 19. Get Job Applications (Recruiter Owner Only)
```bash
curl http://localhost:5000/api/applications/job/JOB_ID_HERE \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

---

#### 20. Update Application Status (Recruiter Owner Only)
```bash
# Accept application
curl -X PUT http://localhost:5000/api/applications/status/APPLICATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -d '{
    "status": "accepted"
  }'

# Shortlist application
curl -X PUT http://localhost:5000/api/applications/status/APPLICATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -d '{
    "status": "shortlisted"
  }'

# Reject application
curl -X PUT http://localhost:5000/api/applications/status/APPLICATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -d '{
    "status": "rejected"
  }'
```

---

#### 21. Get Application Statistics (Recruiter Owner Only)
```bash
curl http://localhost:5000/api/applications/stats/JOB_ID_HERE \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "total": 5,
  "stats": [
    { "_id": "pending", "count": 2 },
    { "_id": "accepted", "count": 1 },
    { "_id": "shortlisted", "count": 2 }
  ]
}
```

---

## ❌ Error Testing

### Test Unauthorized Access
```bash
# Try accessing protected route without token
curl http://localhost:5000/api/auth/profile

# Expected Error:
# { "success": false, "message": "Unauthorized - No token provided" }
```

---

### Test Invalid Token
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer invalid_token_here"

# Expected Error:
# { "success": false, "message": "Unauthorized - Invalid token" }
```

---

### Test Role-Based Access
```bash
# Candidate trying to create job (should fail)
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -d '{"title": "Test Job", ...}'

# Expected Error:
# { "success": false, "message": "Access denied - Recruiter role required" }
```

---

### Test Non-Existent Job
```bash
curl http://localhost:5000/api/jobs/invalid_job_id

# Expected Error:
# { "success": false, "message": "Job not found" }
```

---

## 📊 Test Scenarios

### Scenario 1: Candidate Workflow
1. Register as candidate ✓
2. Get all jobs ✓
3. Search jobs ✓
4. View job details ✓
5. Apply for job ✓
6. View my applications ✓
7. Check application status ✓

### Scenario 2: Recruiter Workflow
1. Register as recruiter ✓
2. Create job posting ✓
3. Update job details ✓
4. View my job postings ✓
5. View applications for job ✓
6. Update application status ✓
7. View statistics ✓

---

## 🔧 Using Postman

1. **Import Collection**
   - Create new collection: "Job Portal Backend"
   - Create folders: Auth, Jobs, Applications

2. **Add Environment**
   - Variable: `BASE_URL` = `http://localhost:5000`
   - Variable: `TOKEN` = (leave empty, update after login)
   - Variable: `JOB_ID` = (update after creating job)

3. **Create Requests**
   - Use `{{BASE_URL}}/api/auth/register` in URL
   - Use `{{TOKEN}}` in Authorization header
   - Test each endpoint

---

## ✅ Checklist

- [ ] Server is running (`npm run dev`)
- [ ] MongoDB is running (`mongod`)
- [ ] Registered as candidate
- [ ] Registered as recruiter
- [ ] Logged in successfully
- [ ] Retrieved user profile
- [ ] Created job posting
- [ ] Retrieved all jobs
- [ ] Applied for job as candidate
- [ ] Retrieved applications
- [ ] Updated application status as recruiter
- [ ] All error cases tested

---

## 🎉 Ready to Launch!

Once all tests pass, your backend is ready for:
- Frontend integration
- Production deployment
- Load testing
- Security audits

---

**Happy Testing! 🧪**
