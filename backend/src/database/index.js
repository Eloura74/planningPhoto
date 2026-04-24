const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../../planning.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erreur de connexion SQLite:", err.message);
  } else {
    console.log("Connecté à SQLite");
  }
});

// Adapter l'API pour ressembler à pg (pool.query)
const pool = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Convertir les paramètres nommés ($1, $2...) en paramètres positionnels (?, ?...)
      const convertedSql = sql.replace(/\$\d+/g, "?");

      db.all(convertedSql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({ rows });
        }
      });
    });
  },
  end: () => {
    return new Promise((resolve) => {
      db.close(() => resolve());
    });
  },
};

module.exports = pool;
