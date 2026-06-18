# Job Portal Backend - Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
The `.env` file should already be created. If not:
```bash
cp .env.example .env
```

Update `.env` with your MongoDB connection:
```env
MONGODB_URI=mongodb://localhost:27017/job_portal
JWT_SECRET=your_secret_key_here
```

### Step 3: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# If using MongoDB locally
mongod

# Or use MongoDB Atlas (cloud) - update MONGODB_URI in .env
```

### Step 4: Start Development Server
```bash
npm run dev
```

✅ Server running at: `http://localhost:5000`

---

## 🧪 Test the API

### Quick Test with cURL or Postman

#### 1. Register a User (Candidate)
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

#### 2. Register a Recruiter
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

#### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@example.com",
    "password": "password123"
  }'
```

You'll receive a token - save it for authenticated requests.

#### 4. Create a Job (as Recruiter, use received token)
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Senior React Developer",
    "company": "Tech Corp",
    "location": "New York, NY",
    "salary": {
      "min": 100000,
      "max": 150000,
      "currency": "USD"
    },
    "description": "We are hiring experienced React developers!",
    "skillsRequired": ["React", "Node.js", "MongoDB"],
    "jobType": "Full-time",
    "experience": "Senior Level"
  }'
```

#### 5. Get All Jobs
```bash
curl http://localhost:5000/api/jobs
```

#### 6. Get All Jobs with Filters
```bash
curl "http://localhost:5000/api/jobs?title=React&location=New%20York&minSalary=100000"
```

---

## 📁 Project Structure Overview

```
job-portal/
├── config/          → Database configuration
├── controllers/     → Business logic (auth, jobs, applications)
├── middleware/      → Express middleware (auth, error handling)
├── models/          → MongoDB schemas (User, Job, Application)
├── routes/          → API endpoints (auth, jobs, applications)
├── utils/           → Helper functions and validators
├── server.js        → Main Express app
├── .env             → Environment variables
└── package.json     → Dependencies
```

---

## 🔑 Key Features

✅ **User Authentication** - Register, Login, Logout
✅ **Role-Based Access** - Candidate and Recruiter roles
✅ **JWT Tokens** - Secure API endpoints
✅ **Job Management** - Post, update, delete jobs
✅ **Job Search** - Filter by title, location, salary, etc.
✅ **Applications** - Apply for jobs, track status
✅ **Error Handling** - Comprehensive error messages

---

## 🚀 Development Scripts

```bash
# Start development server (with hot-reload)
npm run dev

# Start production server
npm start

# Install dependencies
npm install

# View audit issues
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 📖 API Documentation

For complete API documentation, see `README.md`

Key Endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/jobs` - Create job (recruiter only)
- `GET /api/jobs` - Get all jobs
- `POST /api/applications/apply/:jobId` - Apply for job (candidate only)
- `GET /api/applications/my-applications` - Get my applications (candidate only)

---

## ⚙️ Environment Variables Explained

```env
PORT=5000                    # Server port
NODE_ENV=development         # Environment (development/production)
MONGODB_URI=mongodb://...    # MongoDB connection string
JWT_SECRET=your_secret       # JWT secret key (change in production!)
JWT_EXPIRE=7d               # JWT token expiration time
CORS_ORIGIN=http://...      # Allowed origin for CORS
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod`
- Check MONGODB_URI in .env file
- Verify MongoDB is accessible on localhost:27017

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001
```

### CORS Errors
- Update CORS_ORIGIN in .env to match your frontend URL
- Default is `http://localhost:3000`

### Token Errors
- Make sure JWT_SECRET is set in .env
- Token should be sent in Authorization header: `Bearer TOKEN_HERE`

---

## 📚 Learn More

- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [JWT Docs](https://jwt.io/)

---

## ✨ Next Steps

1. **Connect Frontend** - Update CORS_ORIGIN to your React app URL
2. **Add File Upload** - Implement resume/image upload with Multer
3. **Add Email Notifications** - Integrate email service
4. **Add Search Indexing** - Implement full-text search
5. **Add Pagination** - Job listings pagination (already in code)
6. **Deploy** - Deploy to Heroku, AWS, or DigitalOcean

---

**Happy Coding! 🎉**

For detailed API documentation, see `README.md`
