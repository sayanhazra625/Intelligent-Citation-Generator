const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ================== TRUST PROXY ==================
// REQUIRED on Render (and any platform behind a load balancer/proxy).
// Render forwards requests through its own infrastructure and sets the
// X-Forwarded-For header. Without this, express-rate-limit throws:
//   ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// '1' means trust the first proxy hop (Render's load balancer).
// Do NOT use 'true' — that trusts ALL proxies including user-controlled ones,
// which lets users spoof their IP and bypass rate limiting entirely.
app.set('trust proxy', 1);

// ================== CORS (must come before everything else) ==================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://intelligent-citation-generator.vercel.app',
  /^https:\/\/intelligent-citation-generator.*\.vercel\.app$/,
  process.env.FRONTEND_URL?.replace(/\/$/, ''), // strip trailing slash if present
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (allowed) return callback(null, true);
    console.warn(`[CORS] Blocked: ${origin}`);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ================== Other Middleware ==================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ================== Routes ==================
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const citationRoutes = require('./routes/citation.routes');
const projectRoutes = require('./routes/project.routes');
const bibliographyRoutes = require('./routes/bibliography.routes');

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
app.get('/', (req, res) => res.send('Citation Generator Backend Running'));

// ================== 404 ==================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ================== Error Handler ==================
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;