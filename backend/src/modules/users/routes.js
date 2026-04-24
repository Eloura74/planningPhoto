const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../common/authMiddleware");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
} = require("./service");

router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/:id/toggle-status",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await toggleUserStatus(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

module.exports = router;
