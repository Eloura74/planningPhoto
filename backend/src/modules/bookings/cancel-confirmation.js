const pool = require("../../database");
const { createHistory } = require("../history/service");

/**
 * Annule une confirmation de réservation (remet en attente)
 * - Pour SOLO : booking CONFIRMED → REQUESTED, slot reste OPEN_SOLO
 * - Pour GROUPE : bookings CONFIRMED → supprimés, slot GROUP_CONFIRMED → BLOCKED_FOR_GROUP
 */
const cancelConfirmation = async (bookingId, adminId) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    // Récupérer la réservation
    const bookingResult = await client.query(
      `SELECT b.*, s.type, s.status as slot_status, s.id as slot_id
       FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new Error("Réservation non trouvée");
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "CONFIRMED") {
      throw new Error("Seules les réservations confirmées peuvent être annulées");
    }

    if (booking.type === "SOLO") {
      // SOLO : Remettre en REQUESTED
      await client.query(
        "UPDATE bookings SET status = $1 WHERE id = $2",
        ["REQUESTED", bookingId]
      );

      await createHistory(
        "BOOKING",
        bookingId,
        "CANCEL_CONFIRMATION",
        { previousStatus: "CONFIRMED", newStatus: "REQUESTED" },
        adminId,
        "Confirmation annulée par admin - remis en attente"
      );

    } else if (booking.type === "GROUP") {
      // GROUPE : Supprimer tous les bookings confirmés du slot et remettre en BLOCKED_FOR_GROUP
      const slotId = booking.slot_id;

      // Récupérer tous les bookings confirmés de ce slot
      const confirmedBookings = await client.query(
        "SELECT id, user_id FROM bookings WHERE slot_id = $1 AND status = 'CONFIRMED'",
        [slotId]
      );

      // Supprimer tous les bookings confirmés
      await client.query(
        "DELETE FROM bookings WHERE slot_id = $1 AND status = 'CONFIRMED'",
        [slotId]
      );

      // Remettre le slot en BLOCKED_FOR_GROUP
      await client.query(
        "UPDATE slots SET status = $1 WHERE id = $2",
        ["BLOCKED_FOR_GROUP", slotId]
      );

      // Historique
      await createHistory(
        "SLOT",
        slotId,
        "CANCEL_GROUP_CONFIRMATION",
        {
          previousStatus: "GROUP_CONFIRMED",
          newStatus: "BLOCKED_FOR_GROUP",
          deletedBookings: confirmedBookings.rows.length
        },
        adminId,
        `Confirmation groupe annulée - ${confirmedBookings.rows.length} réservation(s) supprimée(s)`
      );
    }

    await client.query("COMMIT");

    return {
      success: true,
      message: booking.type === "SOLO" 
        ? "Confirmation annulée - réservation remise en attente"
        : "Confirmation groupe annulée - slot remis en pré-réservation"
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { cancelConfirmation };
