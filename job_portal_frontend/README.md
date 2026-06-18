# Job Portal Frontend

A modern, production-ready React frontend for the MERN Job Portal project. Built with Vite, React Router, Tailwind CSS, and Axios.

## 🚀 Features

- **Responsive Design**: Mobile-first design that works on all devices
- **Authentication**: JWT-based authentication with protected routes
- **Modern UI**: Clean, modern interface similar to LinkedIn/Indeed
- **Job Browsing**: Search, filter, and browse jobs with pagination
- **Applications**: Submit job applications with resume and cover letter
- **Dashboard**: Candidate dashboard with application tracking
- **Profile Management**: Edit user profile and skills
- **Role-Based Access**: Different experiences for candidates and recruiters

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:5000`

## 🛠️ Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
```

## 🔧 Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📱 Running the Project

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── assets/              # Static assets
├── components/          # Reusable components
│   ├── common/         # Common utilities
│   ├── navbar/         # Navigation bar
│   ├── footer/         # Footer
│   ├── jobs/           # Job-related components
│   └── ui/             # UI components
├── context/            # React Context
├── layouts/            # Layout components
├── pages/              # Page components
│   ├── auth/           # Login/Register
│   ├── jobs/           # Job pages
│   ├── dashboard/      # Dashboard pages
│   └── home/           # Home page
├── routes/             # Routing
├── services/           # API services
├── utils/              # Utilities
├── App.jsx             # Main App
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## 🔑 Key Pages

### Public Pages
- **Home** (`/`) - Landing page
- **Login** (`/login`) - User login
- **Register** (`/register`) - Registration
- **Jobs** (`/jobs`) - Job listings
- **Job Details** (`/jobs/:id`) - Job details & apply

### Protected Pages
- **Dashboard** (`/dashboard`) - Redirects users to the correct workspace
- **Candidate Workspace** (`/candidate/dashboard`) - Candidate/student dashboard
- **Recruiter Workspace** (`/recruiter/dashboard`) - Recruiter hiring dashboard
- **Profile** (`/profile`) - Edit profile
- **My Applications** (`/my-applications`) - Track applications

## Candidate Module

The candidate/student side now has a dedicated professional workspace at:

```txt
/candidate/dashboard
```

Candidate features:

- Candidate registration with phone, skills, education, experience, resume URL, portfolio, LinkedIn, GitHub, location, and profile image
- JWT protected candidate routes
- Overview stats for applied jobs, saved jobs, interview invites, and profile completion
- Profile management for skills, education, experience, social links, resume, profile image, and privacy toggles
- Resume center with upload, profile photo upload, preview, download, and resume parsing action
- Job search with salary, skills, experience, remote/hybrid/onsite, company, and location filters
- Save jobs, apply to jobs, view recommended jobs, and see skill match percentage
- Application tracking across applied, under review, shortlisted, interview scheduled, selected, and rejected
- Notifications for interviews, recruiter messages, job alerts, and system messages
- Settings for password change, account deletion, and privacy controls
- Responsive dashboard with sidebar, cards, analytics bars, toast notifications, and dark mode

## Recruiter Module

The recruiter side has a dedicated workspace at:

```txt
/recruiter/dashboard
```

Recruiter features include company profile management, job management, applicants, drag-and-drop hiring pipeline, interviews, messaging, analytics, subscription UI, and dark mode.

## API Services

Frontend service groups live in `src/services/api.js`:

- `authService`
- `jobService`
- `applicationService`
- `candidateService`
- `recruiterService`

## 🎨 UI Components

### Button
```jsx
<Button variant="primary" size="md">Click me</Button>
```

### Input
```jsx
<Input label="Email" type="email" required />
```

### Loading
```jsx
<Loading fullScreen={true} />
```

### Error
```jsx
<Error message="Error message" />
```

## 📊 Context API

```jsx
const { user, token, login, logout } = useAuth()
```

## 🔗 API Services

```javascript
// Jobs
jobService.getAllJobs(params)
jobService.getJobById(id)
jobService.createJob(data)
jobService.updateJob(id, data)
jobService.deleteJob(id)

// Applications
applicationService.applyForJob(jobId, data)
applicationService.getMyApplications()
applicationService.getJobApplications(jobId)

// Auth
authService.register(data)
authService.login(data)
authService.getProfile()
authService.updateProfile(data)
```

## 🛠️ Technologies

- **React 18** - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **react-icons** - Icons
- **react-hot-toast** - Notifications

## 📦 Quick Start

```bash
# Install
npm install

# Development
npm run dev

# Production
npm run build
npm run preview
```

## 🌐 Backend Connection

Frontend communicates with backend at `http://localhost:5000/api`

Update `VITE_API_BASE_URL` in `.env` if backend runs on different port.

## 🚀 Deployment

### Vercel
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

## 🐛 Troubleshooting

- **CORS Errors**: Ensure backend has CORS enabled
- **Login Issues**: Check if backend is running
- **Build Errors**: Clear cache and reinstall dependencies

## 📄 License

Part of the Job Portal MERN application.
