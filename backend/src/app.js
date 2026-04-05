const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ================== CORS must come FIRST ==================
// Before helmet, before body parser, before everything.
// If CORS is placed after helmet, helmet's headers can interfere
// with the preflight OPTIONS response on some configurations.

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://intelligent-citation-generator.vercel.app',
  // Catch ALL vercel preview deployments for this project
  /^https:\/\/intelligent-citation-generator.*\.vercel\.app$/,
  // Read from env — set this in Render dashboard
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // Check against the allowed list — supports both strings and RegExp
    const allowed = allowedOrigins.some((o) => {
      if (o instanceof RegExp) return o.test(origin);
      return o === origin;
    });

    if (allowed) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle OPTIONS preflight explicitly for ALL routes.
// Without this, browsers send a preflight OPTIONS request and
// Express returns 404 before CORS headers are attached.
app.options('*', cors(corsOptions));

// ================== Other Middleware ==================
app.use(helmet({
  // Relax crossOriginResourcePolicy so the API can be consumed
  // by a browser app on a different origin
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

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

// ================== Health Checks ==================
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Citation Generator API is running' });
});

app.get('/', (req, res) => {
  res.send('Citation Generator Backend Running');
});

// ================== 404 Handler ==================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ================== Error Handler ==================
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;