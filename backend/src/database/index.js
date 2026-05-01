const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../../database.sqlite");
let db = null;

// Initialiser la base de données
async function initDatabase() {
  const SQL = await initSqlJs();

  // Charger la base existante ou créer une nouvelle
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log("✓ Base de données SQLite chargée:", dbPath);
  } else {
    db = new SQL.Database();
    console.log("✓ Nouvelle base de données SQLite créée:", dbPath);
  }

  // Activer les clés étrangères
  db.run("PRAGMA foreign_keys = ON;");

  return db;
}

// Sauvegarder la base de données
function saveDatabase() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, data);
  }
}

// Sauvegarder toutes les 5 secondes
setInterval(saveDatabase, 5000);

// Sauvegarder avant de quitter
process.on("exit", saveDatabase);
process.on("SIGINT", () => {
  saveDatabase();
  process.exit();
});

// Adapter l'interface pour être compatible avec pg
const pool = {
  query: async (sql, params = []) => {
    // Attendre que la DB soit initialisée
    if (!db) {
      await initDatabase();
    }

    try {
      // Convertir les placeholders PostgreSQL ($1, $2) en SQLite (?)
      let sqliteSql = sql;
      if (params.length > 0) {
        sqliteSql = sql.replace(/\$\d+/g, "?");
      }

      // Gérer RETURNING (non supporté par SQLite)
      const isReturning = sqliteSql.toUpperCase().includes("RETURNING");

      if (isReturning) {
        // Retirer RETURNING et exécuter la requête
        const withoutReturning = sqliteSql.split(/RETURNING/i)[0];
        db.run(withoutReturning, params);
        saveDatabase();

        // Récupérer le dernier ID inséré
        const tableName = extractTableName(withoutReturning);
        const result = db.exec(
          `SELECT * FROM ${tableName} WHERE rowid = last_insert_rowid()`,
        );

        if (result.length > 0) {
          const rows = result[0].values.map((row) => {
            const obj = {};
            result[0].columns.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          });
          return { rows, rowCount: rows.length };
        }
        return { rows: [], rowCount: 0 };
      }

      // Requêtes SELECT
      const result = db.exec(sqliteSql, params);

      if (result.length === 0) {
        return { rows: [], rowCount: 0 };
      }

      const rows = result[0].values.map((row) => {
        const obj = {};
        result[0].columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });

      // Sauvegarder si c'est une requête de modification
      if (!sqliteSql.trim().toUpperCase().startsWith("SELECT")) {
        saveDatabase();
      }

      return { rows, rowCount: rows.length };
    } catch (error) {
      console.error("Erreur SQL:", error.message);
      console.error("Requête:", sql);
      console.error("Params:", params);
      throw error;
    }
  },
};

// Fonction helper pour extraire le nom de table
function extractTableName(sql) {
  const match = sql.match(/(?:INSERT INTO|UPDATE|DELETE FROM)\s+([\w_]+)/i);
  return match ? match[1] : "";
}

// Initialiser au démarrage
initDatabase().catch(console.error);

module.exports = pool;
