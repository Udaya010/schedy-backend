const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { Pool } = require('pg');
const pool     = new Pool({ connectionString: process.env.DATABASE_URL });
const auth     = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !email || !password)
    return res.status(400).json({ message: 'firstName, email and password are required' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length)
      return res.status(409).json({ message: 'An account with this email already exists' });

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, first_name, last_name, email, role',
      [firstName, lastName || '', email, hash, 'customer']
    );
    const user = result.rows[0];
    res.status(201).json({
      token: signToken(user),
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role }
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      token: signToken(user),
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role }
    });
  } catch(e) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// GET /api/v1/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role } });
  } catch(e) {
    res.status(500).json({ message: 'Could not fetch profile' });
  }
});

module.exports = router;