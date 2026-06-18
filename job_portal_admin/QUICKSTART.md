# Quick Start Guide for HireFlow Admin Panel

## 1. Navigate to the project folder
```bash
cd job_portal_admin
```

## 2. Install dependencies
```bash
npm install
```

## 3. Start development server
```bash
npm run dev
```

The admin panel will be available at: **http://localhost:5173**

## 4. Login
Use these demo credentials:
- **Email:** admin@example.com
- **Password:** admin123

## 5. Navigate the admin panel
- **Dashboard:** Main overview with KPIs
- **Users:** Manage all platform users
- **Recruiters:** Approve and manage recruiters
- **Jobs:** Create and manage job postings
- **Applications:** Review and manage applications
- **Analytics:** View platform analytics and reports
- **Settings:** Configure platform settings

## Backend API Requirements

The admin panel requires the backend API to be running:

```bash
# In job_portal_backend folder
npm run dev
```

Backend should be running on: http://localhost:5000/api

## Production Build
```bash
npm run build
npm run preview
```

## Features Implemented

✅ Secure JWT authentication
✅ Protected routes
✅ Dark modern UI theme
✅ Responsive mobile design
✅ Complete sidebar navigation
✅ User management interface
✅ Job management interface
✅ Application tracking interface
✅ Recruiter management interface
✅ Analytics dashboard framework
✅ Settings management interface
✅ Error handling and validation
✅ Toast notifications
✅ Pagination and search
✅ Loading states and skeletons
✅ Reusable UI components

## Next Steps

To enable full functionality, the backend needs to implement the following admin-specific endpoints:

### User Management
- `GET /api/admin/users` - List users with pagination
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/block` - Block/unblock user

### Job Management
- `GET /api/admin/jobs` - List all jobs
- `PUT /api/admin/jobs/:id/status` - Change job status

### Application Management
- `GET /api/admin/applications` - List applications with filters

### Recruiter Management
- `GET /api/admin/recruiters` - List recruiters
- `PUT /api/admin/recruiters/:id/approve` - Approve recruiter
- `PUT /api/admin/recruiters/:id/reject` - Reject recruiter

### Analytics
- `GET /api/admin/analytics/stats` - Dashboard stats
- `GET /api/admin/analytics/data` - Chart data

### Categories
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

### Settings
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings/:section` - Update settings

## Troubleshooting

**Port already in use:**
```bash
# Use a different port
npm run dev -- --port 5174
```

**API connection errors:**
- Ensure backend is running: `npm run dev` in job_portal_backend
- Check CORS settings in backend
- Verify .env has correct VITE_API_BASE_URL

**Login issues:**
- Ensure admin user exists in backend
- Check email and password
- Verify JWT_SECRET is configured in backend
