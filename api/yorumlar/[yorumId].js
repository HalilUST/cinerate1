// api/yorumlar/[yorumId].js
// PUT    /api/yorumlar/5   → yorumu düzenle
// DELETE /api/yorumlar/5   → yorumu sil
// POST   /api/yorumlar/5/begen → beğen (query: action=begen)
const { initDB } = require("../_db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT,DELETE,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const yorumId = Number(req.query.yorumId);
  const db = await initDB();

  // ── BEĞEN ─────────────────────────────────────────────────
  if (req.method === "POST" && req.query.action === "begen") {
    try {
      const { rows } = await db.query(
        "UPDATE yorumlar SET begeniler=begeniler+1 WHERE id=$1 RETURNING begeniler AS beg",
        [yorumId]
      );
      if (!rows.length) return res.status(404).json({ hata: "Yorum bulunamadı" });
      return res.json(rows[0]);
    } catch (e) { return res.status(500).json({ hata: e.message }); }
  }

  // ── DÜZENLE ───────────────────────────────────────────────
  if (req.method === "PUT") {
    const { userId, metin } = req.body;
    if (!metin?.trim()) return res.status(400).json({ hata: "Metin boş olamaz" });
    try {
      const check = await db.query("SELECT user_id FROM yorumlar WHERE id=$1", [yorumId]);
      if (!check.rows.length) return res.status(404).json({ hata: "Yorum bulunamadı" });
      if (check.rows[0].user_id !== userId)
        return res.status(403).json({ hata: "Bu yorumu düzenleme yetkiniz yok" });

      const { rows } = await db.query(
        `UPDATE yorumlar SET metin=$1, guncelleme=NOW()
         WHERE id=$2 RETURNING id, film_id AS "filmId", user_id AS "userId", metin, tarih, guncelleme`,
        [metin.trim(), yorumId]
      );
      return res.json(rows[0]);
    } catch (e) { return res.status(500).json({ hata: e.message }); }
  }

  // ── SİL ──────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { userId } = req.body;
    try {
      const check = await db.query("SELECT user_id FROM yorumlar WHERE id=$1", [yorumId]);
      if (!check.rows.length) return res.status(404).json({ hata: "Yorum bulunamadı" });
      if (check.rows[0].user_id !== userId)
        return res.status(403).json({ hata: "Bu yorumu silme yetkiniz yok" });

      await db.query("DELETE FROM yorumlar WHERE id=$1", [yorumId]);
      return res.json({ mesaj: "Yorum silindi" });
    } catch (e) { return res.status(500).json({ hata: e.message }); }
  }

  res.status(405).end();
};
