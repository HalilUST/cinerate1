// api/filmler.js  →  GET /api/filmler?page=1&limit=20&sort=rating
const { initDB } = require("./_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).end();

  try {
    const db = await initDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || 'rating'; // rating, year, title
    const offset = (page - 1) * limit;

    let orderBy = 'f.rating DESC NULLS LAST';
    if (sort === 'year') orderBy = 'f.yil DESC';
    if (sort === 'title') orderBy = 'f.baslik ASC';

    const { rows } = await db.query(`
      SELECT f.*,
        ROUND(AVG(p.puan)::NUMERIC, 1)  AS "ortalamaPuan",
        COUNT(DISTINCT p.id)::INT        AS "toplamOy",
        COUNT(DISTINCT y.id)::INT        AS "toplamYorum"
      FROM filmler f
      LEFT JOIN puanlar  p ON p.film_id = f.id
      LEFT JOIN yorumlar y ON y.film_id = f.id
      GROUP BY f.id, f.poster, f.plot, f.oyuncular, f.rating, f.imdb_id
      ORDER BY ${orderBy}
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Toplam film sayısı
    const totalResult = await db.query('SELECT COUNT(*) as total FROM filmler');
    const total = parseInt(totalResult.rows[0].total);

    res.json({
      filmler: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
};
