const router   = require('express').Router();
const { Pool } = require('pg');
const pool     = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/v1/slots?date=&category=&suburb=
router.get('/', async (req, res) => {
  const { date, category, suburb } = req.query;
  if (!date) return res.status(400).json({ message: 'date is required' });

  try {
    // Get booked slots for this date/category/suburb
    const booked = await pool.query(
      `SELECT time FROM bookings
       WHERE date = $1 AND category = $2
       AND status NOT IN ('cancelled')`,
      [date, category || '']
    );

    const bookedTimes = new Set(booked.rows.map(r => r.time));

    const allTimes = [
      '8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM',
      '11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM',
      '2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'
    ];

    const slots = allTimes.map(time => ({
      time,
      available: !bookedTimes.has(time)
    }));

    res.json({ slots });
  } catch(e) {
    res.status(500).json({ message: 'Could not fetch time slots' });
  }
});

module.exports = router;