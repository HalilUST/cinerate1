// api/_db.js — Tüm API route'ları bu dosyayı kullanır
const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    // Vercel'in Neon DB'si CREATE_DATABASE_URL adıyla geliyor
    const connectionString = process.env.DATABASE_URL || process.env.CREATE_DATABASE_URL;

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

async function initDB() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS filmler (
      id      INT PRIMARY KEY,
      baslik  VARCHAR(255) NOT NULL,
      yil     SMALLINT NOT NULL,
      emoji   VARCHAR(10)
    );

    CREATE TABLE IF NOT EXISTS yorumlar (
      id         SERIAL PRIMARY KEY,
      film_id    INT NOT NULL REFERENCES filmler(id) ON DELETE CASCADE,
      user_id    VARCHAR(100) NOT NULL,
      metin      VARCHAR(1000) NOT NULL,
      tarih      TIMESTAMPTZ DEFAULT NOW(),
      guncelleme TIMESTAMPTZ,
      begeniler  INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS puanlar (
      id       SERIAL PRIMARY KEY,
      film_id  INT NOT NULL REFERENCES filmler(id) ON DELETE CASCADE,
      user_id  VARCHAR(100) NOT NULL,
      puan     NUMERIC(3,1) NOT NULL CHECK (puan BETWEEN 0.5 AND 5),
      UNIQUE (film_id, user_id)
    );
  `);

  const filmler = [
    [101, "Esaretin Bedeli",                        1994, "🏛️"],
    [102, "Yüzüklerin Efendisi: Yüzük Kardeşliği", 2001, "💍"],
    [103, "Kara Şövalye",                           2008, "🦇"],
    [104, "Pulp Fiction",                           1994, "🎰"],
    [105, "Forrest Gump",                           1994, "🏃"],
  ];
  for (const [id, baslik, yil, emoji] of filmler) {
    await db.query(
      `INSERT INTO filmler (id,baslik,yil,emoji) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [id, baslik, yil, emoji]
    );
  }
  return db;
}

module.exports = { getPool, initDB };
