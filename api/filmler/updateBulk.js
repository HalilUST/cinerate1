// api/filmler/updateBulk.js
// POST /api/filmler/updateBulk — Mevcut filmleri OMDB verisiyle güncelle (ADMIN ONLY)
const { initDB } = require("../_db");
const { getFilmDetail } = require("../_omdb");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.status(405).end();

  const token = req.headers["x-admin-token"];
  if (token !== "fienix1905gs") return res.status(403).json({ hata: "Admin token gerekli" });

  try {
    const db = await initDB();

    // Bilinen filmlerin IMDb ID'leri
    const filmMap = [
      { id: 101, imdbId: "tt0111161", baslik: "Esaretin Bedeli" },          // The Shawshank Redemption
      { id: 102, imdbId: "tt0121765", baslik: "Yüzüklerin Efendisi" },     // Lord of the Rings Fellowship
      { id: 103, imdbId: "tt0468569", baslik: "Kara Şövalye" },            // The Dark Knight
      { id: 104, imdbId: "tt0110912", baslik: "Pulp Fiction" },
      { id: 105, imdbId: "tt0109830", baslik: "Forrest Gump" },
    ];

    const results = [];
    for (const film of filmMap) {
      const detail = await getFilmDetail(film.imdbId);
      if (detail) {
        await db.query(
          `UPDATE filmler SET poster=$1, plot=$2, oyuncular=$3, rating=$4, imdb_id=$5 
           WHERE id=$6`,
          [detail.poster, detail.plot, detail.oyuncular, detail.rating, detail.imdbId, film.id]
        );
        results.push({ id: film.id, baslik: film.baslik, success: true });
      } else {
        results.push({ id: film.id, baslik: film.baslik, success: false });
      }
    }

    res.json({ message: "Güncelleme tamamlandı", results });
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
};
