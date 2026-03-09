// server.js — Lokal development server (Express)
const express = require("express");
const path = require("path");

// API Routes'ları import et
const searchFilm = require("./api/filmler/search");
const puanla = require("./api/filmler/[filmId]/puanla");
const yorumlar = require("./api/filmler/[filmId]/yorumlar");
const yorumIslem = require("./api/yorumlar/[yorumId]");
const updateBulk = require("./api/filmler/updateBulk");

// Demo filmler
const DEMO_FILMLER = [
  { id:101, baslik:"Esaretin Bedeli", yil:1994, emoji:"🏛️", poster:null, plot:null, oyuncular:null, rating:null, imdb_id:null, ortalamaPuan:null, toplamOy:0, toplamYorum:0 },
  { id:102, baslik:"Yüzüklerin Efendisi: Yüzük Kardeşliği", yil:2001, emoji:"💍", poster:null, plot:null, oyuncular:null, rating:null, imdb_id:null, ortalamaPuan:null, toplamOy:0, toplamYorum:0 },
  { id:103, baslik:"Kara Şövalye", yil:2008, emoji:"🦇", poster:null, plot:null, oyuncular:null, rating:null, imdb_id:null, ortalamaPuan:null, toplamOy:0, toplamYorum:0 },
  { id:104, baslik:"Pulp Fiction", yil:1994, emoji:"🎰", poster:null, plot:null, oyuncular:null, rating:null, imdb_id:null, ortalamaPuan:null, toplamOy:0, toplamYorum:0 },
  { id:105, baslik:"Forrest Gump", yil:1994, emoji:"🏃", poster:null, plot:null, oyuncular:null, rating:null, imdb_id:null, ortalamaPuan:null, toplamOy:0, toplamYorum:0 },
];

const PORT = 3001;
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Routes
// GET /api/filmler — Demo data döndür
app.get("/api/filmler", (req, res) => {
  res.json(DEMO_FILMLER);
});

// GET /api/filmler/search?q=...
app.get("/api/filmler/search", searchFilm);

// POST /api/filmler/updateBulk
app.post("/api/filmler/updateBulk", updateBulk);

// POST /api/filmler/:filmId/puanla
app.post("/api/filmler/:filmId/puanla", (req, res) => {
  req.query.filmId = req.params.filmId;
  puanla(req, res);
});

// GET/POST /api/filmler/:filmId/yorumlar
app.get("/api/filmler/:filmId/yorumlar", (req, res) => {
  req.query.filmId = req.params.filmId;
  yorumlar(req, res);
});
app.post("/api/filmler/:filmId/yorumlar", (req, res) => {
  req.query.filmId = req.params.filmId;
  yorumlar(req, res);
});

// PUT/DELETE/POST /api/yorumlar/:yorumId
app.put("/api/yorumlar/:yorumId", (req, res) => {
  req.query.yorumId = req.params.yorumId;
  yorumIslem(req, res);
});
app.delete("/api/yorumlar/:yorumId", (req, res) => {
  req.query.yorumId = req.params.yorumId;
  yorumIslem(req, res);
});
app.post("/api/yorumlar/:yorumId", (req, res) => {
  req.query.yorumId = req.params.yorumId;
  yorumIslem(req, res);
});

// Root — index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Lokal server http://localhost:${PORT}`);
  console.log(`📖 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/filmler`);
});
