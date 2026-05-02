const express = require("express");
const router = express.Router();
const { register, login } = require("./service");

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role, isGroupMember } = req.body;
    const user = await register(
      name,
      email,
      phone,
      password,
      role,
      isGroupMember,
    );
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route temporaire pour activer l'admin (à supprimer après utilisation)
router.post("/activate-admin-emergency", async (req, res) => {
  try {
    const pool = require("../../database");
    await pool.query("UPDATE users SET is_active = true WHERE email = $1", [
      "fabien.licata@gmail.com",
    ]);
    res.json({ success: true, message: "Admin activé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route temporaire pour activer un utilisateur par email
router.post("/activate-user-emergency", async (req, res) => {
  try {
    const pool = require("../../database");
    const { email } = req.body;
    await pool.query("UPDATE users SET is_active = true WHERE email = $1", [
      email,
    ]);
    res.json({
      success: true,
      message: `Utilisateur ${email} activé avec succès`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
