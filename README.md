# 🚀 Job Portal - MERN Application

A complete Job Portal application built with the MERN stack (MongoDB, Express, React, Node.js).

## 📁 Project Structure

```
job-portal/
├── job_portal_backend/          # Backend API (Express.js + Node.js)
│   ├── config/                  # Database configuration
│   ├── controllers/             # Business logic
│   ├── middleware/              # Custom middleware
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API routes
│   ├── utils/                   # Utility functions
│   ├── uploads/                 # File uploads
│   ├── server.js               # Main server file
│   ├── package.json            # Backend dependencies
│   ├── .env                    # Environment variables
│   ├── README.md               # Backend documentation
│   ├── QUICKSTART.md           # Quick start guide
│   ├── TESTING_GUIDE.md        # API testing guide
│   └── PROJECT_SUMMARY.md      # Project details
│
└── job_portal_frontend/         # Frontend Application (React + Vite)
    ├── src/
    │   ├── components/         # Reusable React components
    │   ├── pages/              # Page components
    │   ├── context/            # React Context
    │   ├── services/           # API services
    │   ├── routes/             # Route definitions
    │   ├── layouts/            # Layout components
    │   ├── utils/              # Utility functions
    │   ├── App.jsx             # Main App component
    │   └── main.jsx            # Entry point
    ├── package.json            # Frontend dependencies
    ├── .env                    # Environment variables
    ├── vite.config.js          # Vite configuration
    ├── tailwind.config.js      # Tailwind CSS config
    └── README.md               # Frontend documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v16+ 
- MongoDB (local or Atlas)
- npm or yarn

### 1️⃣ Backend Setup

```bash
# Navigate to backend
cd job_portal_backend

# Install dependencies
npm install

# Create .env file
echo "PORT=5000" > .env
echo "MONGODB_URI=mongodb://localhost:27017/jobportal" >> .env
echo "JWT_SECRET=your_jwt_secret_key" >> .env
echo "CORS_ORIGIN=http://localhost:5173" >> .env
echo "NODE_ENV=development" >> .env

# Start backend server
npm run dev
```

**Backend runs on**: `http://localhost:5000`

### 2️⃣ Frontend Setup (New Terminal)

```bash
# Navigate to frontend
cd job_portal_frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env

# Start frontend dev server
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

### 3️⃣ Access Application

Open your browser and visit: `http://localhost:5173`

---

## 📚 Documentation

### Backend Documentation
- **[Backend README](./job_portal_backend/README.md)** - Complete backend overview
- **[Quick Start](./job_portal_backend/QUICKSTART.md)** - 5-minute setup guide
- **[Testing Guide](./job_portal_backend/TESTING_GUIDE.md)** - API testing with cURL
- **[Project Summary](./job_portal_backend/PROJECT_SUMMARY.md)** - Features & API endpoints

### Frontend Documentation
- **[Frontend README](./job_portal_frontend/README.md)** - Complete frontend overview
- Pages: Home, Login, Register, Jobs, Job Details, Dashboard, Profile, Applications
- Components: Button, Input, Loading, Error, JobCard, Navbar, Footer

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/logout          - Logout user
GET    /api/auth/profile         - Get user profile
PUT    /api/auth/profile         - Update profile
```

### Jobs
```
GET    /api/jobs                 - Get all jobs
GET    /api/jobs/:id             - Get job by ID
POST   /api/jobs                 - Create job (recruiter)
PUT    /api/jobs/:id             - Update job (recruiter)
DELETE /api/jobs/:id             - Delete job (recruiter)
GET    /api/jobs/recruiter/my-jobs - Get recruiter jobs
```

### Applications
```
POST   /api/applications/apply/:jobId           - Apply for job
GET    /api/applications/my-applications        - Get my applications
GET    /api/applications/job/:jobId             - Get job applications
PUT    /api/applications/status/:id             - Update status
GET    /api/applications/stats                  - Get statistics
```

---

## ⚙️ Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/jobportal
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🛠️ Tech Stack

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **react-hot-toast** - Notifications
- **react-icons** - Icon library

---

## 📋 Features

### ✅ User Features
- User registration & login
- JWT-based authentication
- Profile management
- Skill management
- Resume upload

### ✅ Job Features
- Browse job listings
- Search & filter jobs
- Job details view
- Apply for jobs
- Track applications
- View application status

### ✅ Recruiter Features
- Post job listings
- Manage posted jobs
- View applications
- Update application status
- Track applicants

### ✅ UI/UX Features
- Responsive design (mobile, tablet, desktop)
- Modern clean interface
- Loading states
- Error handling
- Toast notifications
- Form validation

---

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing with bcryptjs
- ✅ Protected routes
- ✅ CORS enabled
- ✅ Input validation
- ✅ Error handling

---

## 📱 Responsive Design

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

All pages are fully responsive and mobile-friendly.

---

## 🧪 Testing

### Test Backend API
See [TESTING_GUIDE.md](./job_portal_backend/TESTING_GUIDE.md) for cURL examples

### Test Frontend
1. Open http://localhost:5173
2. Register new account
3. Browse jobs
4. Apply for jobs
5. Check dashboard

---

## 🚀 Deployment

### Backend Deployment (Heroku)
```bash
cd job_portal_backend
heroku create your-app-name
heroku config:set MONGODB_URI=your_db_uri
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

### Frontend Deployment (Vercel)
```bash
cd job_portal_frontend
npm run build
vercel
```

---

## 🐛 Troubleshooting

### Backend Won't Start
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify PORT is not in use

### Frontend Can't Connect to API
- Ensure backend is running on port 5000
- Check VITE_API_BASE_URL in .env
- Verify CORS is enabled

### Login Issues
- Clear browser cache
- Check console for errors
- Ensure cookies are enabled

---

## 📊 Project Statistics

| Aspect | Count |
|--------|-------|
| Backend Routes | 16+ |
| Frontend Pages | 8 |
| React Components | 12+ |
| API Endpoints | 15+ |
| Total Lines of Code | 5000+ |

---

## 📄 License

This is a MERN Job Portal project.

---

## 🤝 Support

For issues or questions:
1. Check the documentation in each folder
2. Review error messages in console
3. Check .env configuration
4. Ensure all services are running

---

## ✅ Checklist

### Backend
- [ ] MongoDB connection working
- [ ] Server running on port 5000
- [ ] All API endpoints tested
- [ ] CORS enabled

### Frontend
- [ ] Dependencies installed
- [ ] Dev server running on port 5173
- [ ] Can register/login
- [ ] Can browse jobs
- [ ] Can apply for jobs
- [ ] Dashboard working

---

## 🎉 You're All Set!

Both backend and frontend are ready to use. Start building! 🚀

---

**Happy Coding!**

*Last Updated: 2026-05-21*
