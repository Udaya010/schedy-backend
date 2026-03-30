const router   = require('express').Router();
const { Pool } = require('pg');
const pool     = new Pool({ connectionString: process.env.DATABASE_URL });

// POST /api/v1/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: 'Valid email is required' });

  try {
    await pool.query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [email]
    );
    res.json({ subscribed: true });
  } catch(e) {
    res.status(500).json({ message: 'Could not subscribe' });
  }
});

module.exports = router;