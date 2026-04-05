const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(helmet());

// ✅ CORS setup (IMPORTANT)
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

// ✅ Health check route (REQUIRED for Render)
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// ✅ Basic route (optional)
app.get('/', (req, res) => {
  res.send('API is running...');
});

// 👉 Add your routes here
// app.use('/api/xyz', require('./routes/xyz'));

module.exports = app;