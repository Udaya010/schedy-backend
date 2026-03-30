const router   = require('express').Router();
const { Pool } = require('pg');
const pool     = new Pool({ connectionString: process.env.DATABASE_URL });
const auth     = require('../middleware/auth');

// POST /api/v1/bookings
router.post('/', async (req, res) => {
  const { category, specificService, suburb, date, time, firstName, lastName, email, phone, notes, price, paymentMethod, providerId } = req.body;

  if (!category || !date || !time || !email)
    return res.status(400).json({ message: 'category, date, time and email are required' });

  const reference = 'SCH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const result = await pool.query(
      `INSERT INTO bookings
       (reference, category, specific_service, suburb, date, time,
        first_name, last_name, email, phone, notes, price, payment_method, provider_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'confirmed')
       RETURNING id, reference, status, created_at`,
      [reference, category, specificService, suburb, date, time,
       firstName, lastName, email, phone, notes, price, paymentMethod, providerId || null]
    );
    res.status(201).json({ ...result.rows[0] });
  } catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Could not create booking' });
  }
});

// GET /api/v1/bookings  (requires login)
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date().toISOString().split('T')[0];
    const rows = await pool.query(
      `SELECT reference, specific_service AS service, suburb, date, time, status, price
       FROM bookings WHERE email = $1 ORDER BY date DESC`,
      [req.user.email]
    );

    const upcoming  = rows.rows.filter(b => b.date >= now && b.status === 'confirmed');
    const past      = rows.rows.filter(b => b.date <  now && b.status === 'confirmed');
    const cancelled = rows.rows.filter(b => b.status === 'cancelled');

    res.json({ bookings: { upcoming, past, cancelled } });
  } catch(e) {
    res.status(500).json({ message: 'Could not fetch bookings' });
  }
});

// PATCH /api/v1/bookings/:reference/cancel
router.patch('/:reference/cancel', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE reference = $1 AND email = $2`,
      [req.params.reference, req.user.email]
    );
    res.json({ message: 'Booking cancelled successfully' });
  } catch(e) {
    res.status(500).json({ message: 'Could not cancel booking' });
  }
});

module.exports = router;