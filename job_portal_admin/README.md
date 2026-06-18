# HireFlow Admin Panel

Production-ready admin dashboard for MERN Job Portal SaaS platform.

## Features

✅ **Authentication**
- Secure JWT-based login
- Session management with localStorage
- Protected routes and role-based access control

✅ **Dashboard**
- KPI cards (Total Users, Recruiters, Jobs, Applications)
- Recent activities feed
- Quick statistics overview

✅ **User Management**
- View all users with pagination and search
- Edit user information
- Delete users
- Block/unblock user accounts
- Filter by role (candidate/recruiter/admin)

✅ **Recruiter Management**
- View all recruiters
- Approve/reject recruiter applications
- Manage recruiter accounts
- Track recruiter statistics

✅ **Job Management**
- Create, edit, delete jobs
- Activate/deactivate job listings
- Category management
- Search and filter jobs
- Featured jobs management

✅ **Application Management**
- View all applications with filtering
- View application status in read-only mode
- Hiring decisions are recruiter-only: shortlist, interview, select, accept, and reject happen from the recruiter workspace
- View candidate details and resumes
- Bulk actions and filters

✅ **Analytics & Reports**
- Monthly applications trend chart
- Job distribution analytics
- User growth metrics
- Recruiter performance analytics
- Export data to CSV

✅ **Settings & Platform Management**
- Website configuration
- Logo and banner management
- Homepage customization
- Social media links
- Email settings configuration

✅ **UI/UX Features**
- Dark modern design (LinkedIn/Indeed style)
- Responsive mobile-friendly layout
- Loading skeletons and spinners
- Toast notifications
- Reusable component library
- Error boundaries and error handling

## Tech Stack

- **React 19** - UI Framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client with JWT interceptor
- **React Icons** - Icon library
- **React Hot Toast** - Notifications
- **Recharts** - Data visualization
- **Context API** - State management

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Sidebar, Navbar, ProfileDropdown
│   ├── dashboard/      # Dashboard-specific components
│   ├── tables/         # Data table components
│   ├── forms/          # Form components
│   ├── charts/         # Chart components
│   └── ui/             # Base UI components (Button, Input, Modal, etc)
├── pages/              # Page components
│   ├── auth/           # Login page
│   ├── dashboard/      # Main dashboard
│   ├── users/          # User management
│   ├── jobs/           # Job management
│   ├── applications/   # Application management
│   ├── recruiters/     # Recruiter management
│   ├── analytics/      # Analytics dashboard
│   └── settings/       # Settings page
├── context/            # React Context (Auth)
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── services/           # API service functions
├── routes/             # Route definitions
├── utils/              # Utility functions
└── App.jsx             # Root component
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Backend API running on http://localhost:5000/api

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Integration

The admin panel connects to backend endpoints:

```
GET    /api/auth/profile          - Get current user profile
PUT    /api/auth/profile          - Update profile
GET    /api/auth/logout           - Logout user
POST   /api/auth/login            - Login (for demo testing)

GET    /api/admin/users           - List all users
GET    /api/admin/users/:id       - Get user details
PUT    /api/admin/users/:id       - Update user
DELETE /api/admin/users/:id       - Delete user
PUT    /api/admin/users/:id/block - Block/unblock user

GET    /api/admin/jobs            - List all jobs
POST   /api/admin/jobs            - Create job
PUT    /api/admin/jobs/:id        - Update job
DELETE /api/admin/jobs/:id        - Delete job
PUT    /api/admin/jobs/:id/status - Change job status

GET    /api/admin/applications    - List all applications
Application status updates are intentionally not exposed in admin APIs. Use recruiter APIs for recruiter-owned hiring decisions.

GET    /api/admin/recruiters      - List recruiters
PUT    /api/admin/recruiters/:id/approve  - Approve recruiter
PUT    /api/admin/recruiters/:id/reject   - Reject recruiter

GET    /api/admin/analytics/stats - Dashboard statistics
GET    /api/admin/analytics/data  - Analytics data for charts

GET    /api/admin/categories      - List job categories
POST   /api/admin/categories      - Create category
PUT    /api/admin/categories/:id  - Update category
DELETE /api/admin/categories/:id  - Delete category

GET    /api/admin/settings              - Get persisted platform settings
PUT    /api/admin/settings/general      - Update site, currency, timezone, and registration settings
PUT    /api/admin/settings/branding     - Update logo/banner URLs, colors, favicon, and footer text
PUT    /api/admin/settings/email        - Update email provider and SMTP settings
POST   /api/admin/settings/logo         - Upload logo image
POST   /api/admin/settings/banner       - Upload banner image
```

## Authentication

The app uses JWT token-based authentication:

1. User logs in via `/login`
2. Backend returns JWT token
3. Token stored in localStorage
4. Token auto-injected in all API requests via Axios interceptor
5. Invalid/expired tokens redirect to login

**Demo Credentials:**
- Email: admin@example.com
- Password: admin123

## Key Components

### AuthContext
Manages authentication state, login/logout, and token handling.

```javascript
const { user, token, login, logout, isAuthenticated } = useAuth()
```

### API Services
All API calls abstracted in `src/services/adminApi.js`:

```javascript
import { userService, jobService, applicationService } from '../services/adminApi'
```

### UI Components
Reusable components in `src/components/ui/`:
- Button - Variants: primary, secondary, danger, success, outline
- Input - With label and error support
- Modal - Flexible dialog component
- Pagination - Smart pagination controls
- Tabs - Tabbed interface
- LoadingSpinner, Skeleton - Loading states

## Styling

Tailwind CSS configured with dark theme:
- Primary: Blue (#3b82f6)
- Secondary: Slate (#1e293b)
- Dark background (#0f172a)
- Light text (#e2e8f0)

## Development Tips

### Adding a New Page
1. Create page component in `src/pages/<section>/`
2. Add route in `src/routes/AdminRoutes.jsx`
3. Add menu item in `src/components/common/Sidebar.jsx`
4. Use `AdminLayout` wrapper for consistent styling

### Adding API Calls
1. Add service function in `src/services/adminApi.js`
2. Import and use in page/component
3. Wrap in try-catch with error handling
4. Show toast notifications for feedback

### Creating Reusable Components
1. Place in `src/components/<category>/`
2. Export as named export
3. Use Tailwind classes for styling
4. Accept flexible props
5. Add TypeScript comments for clarity

## Production Deployment

```bash
npm run build
```

Creates optimized production build in `dist/` folder.

## Performance Optimizations

- Code splitting with React.lazy()
- Component memoization with React.memo()
- Axios request deduplication
- Efficient re-renders with proper dependency arrays
- Image optimization

## Troubleshooting

### "Cannot GET /dashboard"
- Make sure dev server is running: `npm run dev`
- Check that you're accessing http://localhost:5173

### 401 Unauthorized errors
- Check that backend API is running on http://localhost:5000
- Verify admin credentials
- Check JWT token in localStorage

### CORS errors
- Ensure backend has CORS enabled
- Check CORS_ORIGIN in backend .env includes http://localhost:5173

## Contributing

1. Follow the component structure guidelines
2. Use Tailwind CSS for styling
3. Add error boundaries around features
4. Test responsive design on mobile
5. Keep components reusable and modular

## License

ISC

## Candidate And Recruiter Modules

This admin panel manages platform data used by the candidate and recruiter modules.

Candidate module surfaces:

- Candidate users
- Candidate applications
- Candidate resumes stored on applications
- Application pipeline status
- Job search and application data

Candidate application statuses supported by the backend:

- `pending`
- `applied`
- `under-review`
- `shortlisted`
- `interview-scheduled`
- `selected`
- `accepted`
- `rejected`

Recruiter module surfaces:

- Recruiter users
- Company profile summary
- Recruiter designation and industry
- Admin approval and rejection flow
- Jobs and applications created by recruiters

The candidate workspace lives in the user frontend at:

```txt
/candidate/dashboard
```

The recruiter workspace lives in the user frontend at:

```txt
/recruiter/dashboard
```

## Support

For issues or questions, check the backend documentation or contact the development team.
