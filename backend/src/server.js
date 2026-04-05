require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Handle unhandled promise rejections (PRO feature)
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

const startServer = async () => {
  try {
    // 🔌 Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected');

    // 🚀 Start Express server
    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
      );
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();