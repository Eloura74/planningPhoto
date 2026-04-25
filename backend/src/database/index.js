const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../../planning.db");
const db = new Database(dbPath);

console.log("Connecté à SQLite (better-sqlite3)");

// Adapter l'API pour ressembler à pg (pool.query)
const pool = {
  query: (sql, params = []) => {
    try {
      // Convertir les paramètres nommés ($1, $2...) en paramètres positionnels (?, ?...)
      const convertedSql = sql.replace(/\$\d+/g, "?");
      const stmt = db.prepare(convertedSql);
      const rows = stmt.all(...params);
      return { rows };
    } catch (err) {
      throw err;
    }
  },
  end: () => {
    db.close();
    return Promise.resolve();
  },
};

module.exports = pool;
