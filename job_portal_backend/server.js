// server.js
// Main server file - Express app setup and initialization

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const maintenanceMode = require('./middleware/maintenanceMode');

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const supportRoutes = require('./routes/supportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ==================== Middleware ====================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Uploaded file not found. Please ask the candidate to re-upload the file.',
  });
});
app.use(cookieParser());

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.CANDIDATE_FRONTEND_URL,
  process.env.RECRUITER_FRONTEND_URL,
  'https://hireflow-frontend-eight.vercel.app',
]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(maintenanceMode);

// ==================== Routes ====================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Job Portal Backend API is running',
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);

// ==================== Error Handling ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

// ==================== Server Start ====================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('==============================================');
  console.log(' Job Portal Backend Server Started');
  console.log('==============================================');
  console.log(` Server running on: http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('==============================================');
  console.log('');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
