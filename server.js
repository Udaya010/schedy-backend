require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const app        = express();

// ── Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.static('../')); // serves your HTML file

// ── Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ── Routes
app.use('/api/v1/auth',                  require('./routes/auth'));
app.use('/api/v1/providers',             require('./routes/providers'));
app.use('/api/v1/bookings',              require('./routes/bookings'));
app.use('/api/v1/slots',                 require('./routes/slots'));
app.use('/api/v1/business-applications', require('./routes/business'));
app.use('/api/v1/newsletter',            require('./routes/newsletter'));

// ── Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Error handler
app.use((err, req, res, next) => {
  console.error('[Schedy Error]', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('[Schedy] Server running on port', process.env.PORT || 3000);
});