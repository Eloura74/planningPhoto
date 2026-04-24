const jwt = require("jsonwebtoken");
const pool = require("../../database");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // Vérifier si l'utilisateur est actif (désactivé temporairement pour le debug)
    try {
      const user = await pool.query(
        "SELECT is_active FROM users WHERE id = $1",
        [decoded.userId],
      );
      if (user.rows.length > 0 && !user.rows[0].is_active) {
        return res.status(403).json({ error: "Account is deactivated" });
      }
    } catch (e) {
      // Ignorer l'erreur si la colonne n'existe pas
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
