// config/database.js
// MongoDB connection configuration using mongoose

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error('MongoDB connection string is missing. Set MONGODB_URI in your environment.');
    }

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected Successfully');
    console.log(`Database: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
