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

  // Mevcut puanlar tablosundaki puan kolonunu NUMERIC'e güncelle (eğer SMALLINT ise)
  await db.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='puanlar' AND column_name='puan' AND data_type='smallint'
      ) THEN
        ALTER TABLE puanlar ALTER COLUMN puan TYPE NUMERIC(3,1);
        ALTER TABLE puanlar DROP CONSTRAINT IF EXISTS puanlar_puan_check;
        ALTER TABLE puanlar ADD CONSTRAINT puanlar_puan_check CHECK (puan BETWEEN 0.5 AND 5);
      END IF;
    END$$;
  `).catch(()=>{});

  // Yeni alanlar ekle (migration)
  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='filmler' AND column_name='poster') THEN
        ALTER TABLE filmler ADD COLUMN poster VARCHAR(500);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='filmler' AND column_name='plot') THEN
        ALTER TABLE filmler ADD COLUMN plot TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='filmler' AND column_name='oyuncular') THEN
        ALTER TABLE filmler ADD COLUMN oyuncular VARCHAR(500);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='filmler' AND column_name='rating') THEN
        ALTER TABLE filmler ADD COLUMN rating NUMERIC(3,1);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='filmler' AND column_name='imdb_id') THEN
        ALTER TABLE filmler ADD COLUMN imdb_id VARCHAR(20);
      END IF;
    END$$;
  `).catch(()=>{});

  await db.query(`
    CREATE TABLE IF NOT EXISTS filmler (
      id      INT PRIMARY KEY,
      baslik  VARCHAR(255) NOT NULL,
      yil     SMALLINT NOT NULL,
      emoji   VARCHAR(10),
      poster  VARCHAR(500),
      plot    TEXT,
      oyuncular VARCHAR(500),
      rating  NUMERIC(3,1),
      imdb_id VARCHAR(20)
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

    CREATE TABLE IF NOT EXISTS yanitlar (
      id         SERIAL PRIMARY KEY,
      yorum_id   INT NOT NULL REFERENCES yorumlar(id) ON DELETE CASCADE,
      user_id    VARCHAR(100) NOT NULL,
      metin      VARCHAR(1000) NOT NULL,
      tarih      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS votes (
      id         SERIAL PRIMARY KEY,
      yorum_id   INT NOT NULL REFERENCES yorumlar(id) ON DELETE CASCADE,
      user_id    VARCHAR(100) NOT NULL,
      tip        SMALLINT NOT NULL CHECK (tip IN (1, -1)),
      UNIQUE (yorum_id, user_id)
    );
  `);

  const filmler = [
    // IMDb Top Rated Filmler (50 adet)
    [101, "The Shawshank Redemption", 1994, "🏛️", "tt0111161"],
    [102, "The Godfather", 1972, "👔", "tt0068646"],
    [103, "The Dark Knight", 2008, "🦇", "tt0468569"],
    [104, "The Godfather Part II", 1974, "👔", "tt0071562"],
    [105, "12 Angry Men", 1957, "⚖️", "tt0050083"],
    [106, "Schindler's List", 1993, "📜", "tt0108052"],
    [107, "The Lord of the Rings: The Return of the King", 2003, "💍", "tt0167260"],
    [108, "Pulp Fiction", 1994, "🎰", "tt0110912"],
    [109, "The Lord of the Rings: The Fellowship of the Ring", 2001, "💍", "tt0121765"],
    [110, "Forrest Gump", 1994, "🏃", "tt0109830"],
    [111, "Inception", 2010, "🌀", "tt1375666"],
    [112, "Fight Club", 1999, "🥊", "tt0137523"],
    [113, "The Matrix", 1999, "💊", "tt0133093"],
    [114, "Goodfellas", 1990, "🔫", "tt0099685"],
    [115, "The Empire Strikes Back", 1980, "⭐", "tt0080684"],
    [116, "One Flew Over the Cuckoo's Nest", 1975, "🏥", "tt0073486"],
    [117, "Se7en", 1995, "🔢", "tt0114369"],
    [118, "It's a Wonderful Life", 1946, "🎄", "tt0038650"],
    [119, "The Silence of the Lambs", 1991, "🐑", "tt0102926"],
    [120, "Saving Private Ryan", 1998, "⚔️", "tt0120815"],
    [121, "City of God", 2002, "🏙️", "tt0317248"],
    [122, "Interstellar", 2014, "🌌", "tt0816692"],
    [123, "The Green Mile", 1999, "⚡", "tt0120689"],
    [124, "Star Wars", 1977, "⭐", "tt0076759"],
    [125, "Terminator 2: Judgment Day", 1991, "🤖", "tt0103064"],
    [126, "Back to the Future", 1985, "⏰", "tt0088763"],
    [127, "Spirited Away", 2001, "👻", "tt0245429"],
    [128, "Psycho", 1960, "🔪", "tt0054215"],
    [129, "Parasite", 2019, "🪱", "tt6751668"],
    [130, "Léon: The Professional", 1994, "💼", "tt0110413"],
    [131, "The Pianist", 2002, "🎹", "tt0253474"],
    [132, "Gladiator", 2000, "⚔️", "tt0172495"],
    [133, "American History X", 1998, "🔥", "tt0120586"],
    [134, "The Departed", 2006, "👮", "tt0407887"],
    [135, "The Prestige", 2006, "🎩", "tt0482571"],
    [136, "Whiplash", 2014, "🥁", "tt2582802"],
    [137, "The Intouchables", 2011, "♿", "tt1675434"],
    [138, "Casablanca", 1942, "✈️", "tt0034583"],
    [139, "Modern Times", 1936, "🤖", "tt0027977"],
    [140, "Once Upon a Time in the West", 1968, "🤠", "tt0064116"],
    [141, "Cinema Paradiso", 1988, "🎥", "tt0095765"],
    [142, "Rear Window", 1954, "👀", "tt0047396"],
    [143, "Alien", 1979, "👽", "tt0078748"],
    [144, "Apocalypse Now", 1979, "🌴", "tt0078788"],
    [145, "Memento", 2000, "🧠", "tt0209144"],
    [146, "Raiders of the Lost Ark", 1981, "🏺", "tt0082971"],
    [147, "The Great Dictator", 1940, "🎭", "tt0032553"],
    [148, "Django Unchained", 2012, "🔗", "tt1853728"],
    [149, "Paths of Glory", 1957, "⚔️", "tt0050825"],
    [150, "The Lives of Others", 2006, "👂", "tt0405094"],
  ];
  for (const [id, baslik, yil, emoji, imdbId] of filmler) {
    await db.query(
      `INSERT INTO filmler (id,baslik,yil,emoji,imdb_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [id, baslik, yil, emoji, imdbId]
    );
  }
  return db;
}

module.exports = { getPool, initDB };
