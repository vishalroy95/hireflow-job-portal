# Job Portal - Full Stack Setup Guide

Complete setup guide for the MERN Job Portal (Backend + Frontend)

## 📋 Prerequisites

- **Node.js** v16 or higher
- **MongoDB** (local or Atlas)
- **npm** or **yarn**
- **Git** (optional)

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd c:\Users\VISHAL RAY\Desktop\job-portal

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

Backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd c:\Users\VISHAL RAY\Desktop\job-portal\frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env

# Start frontend dev server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
job-portal/
├── backend/                 # Backend files
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── README.md
│
└── frontend/                # Frontend files
    ├── src/
    ├── public/
    ├── package.json
    ├── .env
    ├── vite.config.js
    ├── tailwind.config.js
    └── README.md
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/jobportal

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create job (recruiter only)
- `PUT /api/jobs/:id` - Update job (recruiter only)
- `DELETE /api/jobs/:id` - Delete job (recruiter only)
- `GET /api/jobs/recruiter/my-jobs` - Get recruiter's jobs

### Applications
- `POST /api/applications/apply/:jobId` - Apply for job
- `GET /api/applications/my-applications` - Get my applications
- `GET /api/applications/job/:jobId` - Get job applications
- `PUT /api/applications/status/:id` - Update application status
- `GET /api/applications/stats` - Get application statistics

## 🎯 Testing the Application

### 1. Test Backend

```bash
# Option 1: Using provided TESTING_GUIDE.md
# See backend/TESTING_GUIDE.md for cURL examples

# Option 2: Manual testing
# Register:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"123456","role":"candidate"}'

# Login:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

### 2. Test Frontend

1. Open `http://localhost:5173` in browser
2. Click "Register" or "Login"
3. Create a test account
4. Browse jobs, apply for jobs
5. Check dashboard and applications

## 🔍 Verify Everything Works

### Checklist

- [ ] Backend runs on port 5000
- [ ] Frontend runs on port 5173
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can view jobs listing
- [ ] Can view job details
- [ ] Can apply for job
- [ ] Can view dashboard
- [ ] Can view my applications
- [ ] Can update profile

## 🐛 Troubleshooting

### Backend Issues

**Error: Cannot connect to MongoDB**
```
Solution:
1. Ensure MongoDB is running (or Atlas connection is valid)
2. Check MONGODB_URI in .env
3. Verify connection string format
```

**Error: Port 5000 already in use**
```
Solution:
1. Change PORT in .env to different port (e.g., 5001)
2. Or kill process: lsof -ti:5000 | xargs kill -9
```

**Error: JWT_SECRET missing**
```
Solution:
Set JWT_SECRET in .env file
```

### Frontend Issues

**Error: Cannot reach API**
```
Solution:
1. Ensure backend is running on port 5000
2. Check VITE_API_BASE_URL in .env
3. Verify CORS is enabled in backend
```

**Error: Login not working**
```
Solution:
1. Check browser console for errors
2. Ensure cookies are enabled
3. Clear browser cache and try again
```

**Error: Styling looks broken**
```
Solution:
1. Clear browser cache (Ctrl+Shift+Del)
2. Restart dev server: npm run dev
3. Ensure Tailwind CSS is configured correctly
```

## 📦 Dependency Versions

### Backend
- express: ^4.18.2
- mongoose: ^7.5.0
- jsonwebtoken: ^9.0.2
- bcryptjs: ^2.4.3
- cors: ^2.8.5
- multer: ^1.4.5-lts.1

### Frontend
- react: ^18.3.1
- react-dom: ^18.3.1
- react-router-dom: ^6.24.1
- axios: ^1.7.2
- tailwindcss: ^3.4.4
- react-hot-toast: ^2.4.1

## 🚀 Production Deployment

### Backend (Heroku)
```bash
# Create Heroku app
heroku create job-portal-api

# Set environment variables
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

### Frontend (Vercel)
```bash
# Deploy
vercel
```

## 📝 Documentation

- [Backend README](./README.md)
- [Backend Testing Guide](./TESTING_GUIDE.md)
- [Backend Project Summary](./PROJECT_SUMMARY.md)
- [Backend Quick Start](./QUICKSTART.md)
- [Frontend README](./frontend/README.md)

## 🎓 Learning Resources

- React: https://react.dev
- Vite: https://vite.dev
- Tailwind CSS: https://tailwindcss.com
- MongoDB: https://docs.mongodb.com
- Express.js: https://expressjs.com

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review error messages in console
3. Check .env configuration
4. Ensure all services are running
5. Review README files in each directory

## ✅ Checklist for Going Live

- [ ] Set strong JWT_SECRET
- [ ] Configure MongoDB Atlas for production
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS_ORIGIN
- [ ] Enable security headers
- [ ] Setup error logging
- [ ] Configure backup strategy
- [ ] Setup monitoring
- [ ] Test all features

## 📄 License

This is a MERN Job Portal project.

---

**Happy Coding! 🎉**
