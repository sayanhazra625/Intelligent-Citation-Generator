const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ================== Middleware ==================
app.use(express.json());
app.use(helmet());

// ================== CORS Setup ==================
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS not allowed"));
  },
  credentials: true
}));

// ================== Routes Import ==================
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const citationRoutes = require('./routes/citation.routes');
const projectRoutes = require('./routes/project.routes');
const bibliographyRoutes = require('./routes/bibliography.routes');

// ================== Routes Mount ==================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/citations', citationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bibliography', bibliographyRoutes);

// ================== Health Check (Render) ==================
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// ================== API Health ==================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Citation Generator API is running'
  });
});

// ================== Root Route ==================
app.get('/', (req, res) => {
  res.send('🚀 Citation Generator Backend Running');
});

// ================== 404 Handler ==================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ================== Error Handler ==================
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;