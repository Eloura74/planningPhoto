const express = require("express");
const router = express.Router();
const pool = require("../../database");
const { authenticate, requireAdmin } = require("../common/authMiddleware");
const {
  createSoloBooking,
  createGroupPrebooking,
  getBookingsByUser,
  getBookingsBySlot,
  confirmBooking,
  cancelBooking,
  getUserWeeklyBookings,
  getUserMonthlyBookings,
  getGroupPrebookingsBySlot,
  deleteGroupPrebooking,
  getSlotsWithLowGroupParticipation,
} = require("./service");

// Route pour récupérer toutes les réservations (admin seulement)
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    // Récupérer les bookings solo
    const soloBookings = await pool.query(`
      SELECT 
        b.id,
        b.status,
        b.created_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        s.id as slot_id,
        s.date as slot_date,
        s.start_time as slot_start_time,
        s.end_time as slot_end_time,
        s.type as slot_type,
        'SOLO' as booking_type
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN slots s ON b.slot_id = s.id
      ORDER BY s.date DESC, s.start_time DESC
    `);

    // Récupérer les pré-réservations groupe
    const groupBookings = await pool.query(`
      SELECT 
        gp.id,
        'GROUP_PREBOOKING' as status,
        gp.created_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        s.id as slot_id,
        s.date as slot_date,
        s.start_time as slot_start_time,
        s.end_time as slot_end_time,
        s.type as slot_type,
        'GROUP' as booking_type
      FROM group_prebookings gp
      JOIN users u ON gp.user_id = u.id
      JOIN slots s ON gp.slot_id = s.id
      ORDER BY s.date DESC, s.start_time DESC
    `);

    // Combiner les deux listes
    const allBookings = [...soloBookings.rows, ...groupBookings.rows];
    allBookings.sort((a, b) => {
      // Convertir les dates en string pour la comparaison
      const dateA =
        a.slot_date instanceof Date
          ? a.slot_date.toISOString().split("T")[0]
          : a.slot_date;
      const dateB =
        b.slot_date instanceof Date
          ? b.slot_date.toISOString().split("T")[0]
          : b.slot_date;
      const dateCompare = dateB.localeCompare(dateA);
      if (dateCompare !== 0) return dateCompare;
      return b.slot_start_time.localeCompare(a.slot_start_time);
    });

    console.log("🔍 Admin bookings loaded:", allBookings.length, "total");
    res.json(allBookings);
  } catch (error) {
    console.error("❌ Error loading admin bookings:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/solo", authenticate, async (req, res) => {
  try {
    const { slotId } = req.body;

    // Toutes les vérifications sont maintenant dans createSoloBooking
    // pour supporter les slots virtuels
    const booking = await createSoloBooking(req.userId, slotId);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/group", authenticate, async (req, res) => {
  try {
    const { slotId } = req.body;
    const prebooking = await createGroupPrebooking(req.userId, slotId);
    res.status(201).json(prebooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/my", authenticate, async (req, res) => {
  try {
    const bookings = await getBookingsByUser(req.userId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/pending", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const statusFilter = status ? `AND b.status = '${status}'` : "";
    const result = await pool.query(`
      SELECT b.*, u.name as user_name, u.email as user_email, s.date as slot_date, s.start_time, s.end_time, s.type as slot_type
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN slots s ON b.slot_id = s.id
      WHERE s.type = 'SOLO' ${statusFilter} AND b.status NOT IN ('CANCELLED', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_STUDENT')
      ORDER BY s.date DESC, b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/slot/:slotId", authenticate, async (req, res) => {
  try {
    const bookings = await getBookingsBySlot(req.params.slotId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/group/:slotId", authenticate, async (req, res) => {
  try {
    let { slotId } = req.params;
    console.log("🔍 GET /group/:slotId - slotId:", slotId);

    // Si c'est un ID virtuel (format YYYY-MM-DD_HH:MM), chercher le slot réel
    if (slotId.includes("_")) {
      const [date, startTime] = slotId.split("_");
      const realSlot = await pool.query(
        "SELECT id FROM slots WHERE date = $1 AND start_time = $2",
        [date, startTime],
      );
      if (realSlot.rows.length > 0) {
        slotId = realSlot.rows[0].id;
        console.log("🔍 Found real slot ID:", slotId);
      } else {
        console.log(
          "⚠️ No real slot found for virtual ID, returning empty array",
        );
        return res.json([]);
      }
    }

    const userData = await pool.query(
      "SELECT role, is_group_member FROM users WHERE id = $1",
      [req.userId],
    );
    const { role, is_group_member } = userData.rows[0] || {};
    console.log("🔍 User role:", role, "is_group_member:", is_group_member);

    let bookings;
    if (role === "ADMIN" || is_group_member) {
      // Admin et membres du groupe voient tous les participants (affinités)
      bookings = await getGroupPrebookingsBySlot(slotId);
      console.log("🔍 Bookings found:", bookings.length, bookings);
    } else {
      // Les élèves solo ne voient que leurs propres pré-réservations
      bookings = await getGroupPrebookingsBySlot(slotId, req.userId);
    }
    res.json(bookings);
  } catch (error) {
    console.error("❌ Error in GET /group/:slotId:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/confirm", authenticate, requireAdmin, async (req, res) => {
  try {
    const booking = await confirmBooking(req.params.id, {
      id: req.userId,
      role: "ADMIN",
    });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    console.log("DELETE booking appelé avec ID:", req.params.id);
    const { reason } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE id = ?", [
      req.userId,
    ]);
    const cancelledBy = {
      id: req.userId,
      role: user.rows[0]?.role || "STUDENT",
    };
    console.log("CancelledBy:", cancelledBy);
    const booking = await cancelBooking(req.params.id, cancelledBy, reason);
    console.log("Réservation supprimée:", booking);
    res.json(booking);
  } catch (error) {
    console.error("Erreur DELETE booking:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(400).json({ error: error.message });
  }
});

router.delete("/group/:slotId", authenticate, async (req, res) => {
  try {
    const prebooking = await deleteGroupPrebooking(
      req.userId,
      req.params.slotId,
    );
    res.json(prebooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get(
  "/low-participation",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const slots = await getSlotsWithLowGroupParticipation();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

module.exports = router;
