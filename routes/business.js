const router   = require('express').Router();
const { Pool } = require('pg');
const pool     = new Pool({ connectionString: process.env.DATABASE_URL });

// POST /api/v1/business-applications
router.post('/', async (req, res) => {
  const { businessName, category, ownerName, suburb, email, phone, abn, website, description } = req.body;

  if (!businessName || !category || !ownerName || !suburb || !email || !phone)
    return res.status(400).json({ message: 'All required fields must be filled' });

  try {
    await pool.query(
      `INSERT INTO business_applications
       (business_name, category, owner_name, suburb, email, phone, abn, website, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
      [businessName, category, ownerName, suburb, email, phone, abn || null, website || null, description || null]
    );
    res.status(201).json({ message: 'Application received. We will be in touch within 48 hours.' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Could not submit application' });
  }
});

module.exports = router;