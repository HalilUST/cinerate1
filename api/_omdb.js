// api/_omdb.js — OMDB API Helper
const http = require("http");
const https = require("https");
const { URL } = require("url");

const OMDB_KEY = process.env.OMDB_API_KEY || "6968d03d";
const OMDB_BASE = "https://www.omdbapi.com/";

/**
 * OMDB API'ye istek yap
 */
async function fetchOmdb(params) {
  return new Promise((resolve, reject) => {
    const url = new URL(OMDB_BASE);
    url.searchParams.append("apikey", OMDB_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

    const client = url.protocol === "https:" ? https : http;
    client
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const obj = JSON.parse(data);
            if (obj.Response === "False") {
              reject(new Error(obj.Error || "OMDB hata"));
            } else {
              resolve(obj);
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Film başlığına göre ara
 */
async function searchFilm(baslik) {
  try {
    const result = await fetchOmdb({ s: baslik, type: "movie" });
    if (!result.Search || result.Search.length === 0) return null;
    // İlk sonuç
    return {
      imdbId: result.Search[0].imdbID,
      baslik: result.Search[0].Title,
      yil: parseInt(result.Search[0].Year),
      poster: result.Search[0].Poster !== "N/A" ? result.Search[0].Poster : null,
    };
  } catch (e) {
    console.error("OMDB arama hatası:", e.message);
    return null;
  }
}

/**
 * IMDB ID'sine göre detay al
 */
async function getFilmDetail(imdbId) {
  try {
    const result = await fetchOmdb({ i: imdbId, type: "movie" });
    return {
      imdbId: result.imdbID,
      baslik: result.Title,
      yil: parseInt(result.Year),
      tur: result.Genre,
      plot: result.Plot !== "N/A" ? result.Plot : null,
      poster: result.Poster !== "N/A" ? result.Poster : null,
      rating: result.imdbRating !== "N/A" ? parseFloat(result.imdbRating) : null,
      oyuncular: result.Actors !== "N/A" ? result.Actors : null, // "Actor1, Actor2, Actor3" formatı
      budget: result.BoxOffice !== "N/A" ? result.BoxOffice : null,
      yapimci: result.Director !== "N/A" ? result.Director : null,
    };
  } catch (e) {
    console.error("OMDB detay hatası:", e.message);
    return null;
  }
}

module.exports = { searchFilm, getFilmDetail };
