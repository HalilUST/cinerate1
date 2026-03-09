// api/filmler/search.js
// GET /api/filmler/search?q=baslik  →  OMDB'den ara ve detay döndür
const { getFilmDetail, searchFilm } = require("../_omdb");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).end();

  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ hata: "q (film adı) parametresi gerekli" });

  try {
    // Önce ara
    const found = await searchFilm(q);
    if (!found) return res.status(404).json({ hata: "Film bulunamadı" });

    // Sonra detay al
    const detail = await getFilmDetail(found.imdbId);
    if (!detail) return res.status(500).json({ hata: "Detay alınamadı" });

    res.json(detail);
  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
};
