const router   = require('express').Router();
const { Pool } = require('pg');
const pool     = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/v1/providers
router.get('/', async (req, res) => {
  const { search, category, suburb, sort, minRating, maxPrice, available, limit = 6, offset = 0 } = req.query;

  let where  = ['approved = true'];
  let params = [];
  let i = 1;

  if (search)    { where.push(`(name ILIKE $${i} OR category ILIKE $${i})`); params.push('%'+search+'%'); i++; }
  if (category)  { where.push(`category = $${i}`);    params.push(category);    i++; }
  if (suburb)    { where.push(`suburb = $${i}`);      params.push(suburb);      i++; }
  if (minRating) { where.push(`rating >= $${i}`);     params.push(minRating);   i++; }
  if (maxPrice)  { where.push(`price < $${i}`);       params.push(maxPrice);    i++; }
  if (available) { where.push(`available = true`); }

  const orderMap = { rating: 'rating DESC', 'price-low': 'price ASC', 'price-high': 'price DESC', bookings: 'total_bookings DESC' };
  const orderBy  = orderMap[sort] || 'rating DESC';

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  params.push(parseInt(limit), parseInt(offset));

  try {
    const result = await pool.query(
      `SELECT id, name, category, suburb, price, rating, reviews, total_bookings AS bookings,
              services, image_url, available
       FROM providers ${whereStr}
       ORDER BY ${orderBy}
       LIMIT $${i} OFFSET $${i+1}`,
      params
    );
    res.json({ providers: result.rows });
  } catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Could not fetch providers' });
  }
});

module.exports = router;