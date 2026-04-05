const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
const configurePassport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const citationRoutes = require('./routes/citation.routes');
const projectRoutes = require('./routes/project.routes');
const bibliographyRoutes = require('./routes/bibliography.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// --------------- Security Middleware ---------------
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// --------------- Passport (Google OAuth) ---------------
configurePassport();
app.use(passport.initialize());

// --------------- Body Parser (increased limit for avatar uploads) ---------------
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// --------------- Swagger API Docs ---------------
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Citation Generator API Docs' }));

// --------------- API Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/citations', citationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bibliography', bibliographyRoutes);
app.use('/api/user', userRoutes);

// --------------- Root Health Check ---------------
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Citation Generator API is running' });
});

// --------------- 404 Handler ---------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// --------------- Global Error Handler ---------------
app.use(errorHandler);

module.exports = app;
