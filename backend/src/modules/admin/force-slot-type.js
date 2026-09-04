const pool = require("../../database");
const { createHistory } = require("../common/historyService");

/**
 * Permet à l'admin de forcer le type d'un slot (SOLO ou GROUP)
 * avec les horaires appropriés
 */
const forceSlotType = async (slotId, newType, adminId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Récupérer le slot actuel
    const slotResult = await client.query("SELECT * FROM slots WHERE id = $1", [
      slotId,
    ]);

    if (slotResult.rows.length === 0) {
      throw new Error("Slot non trouvé");
    }

    const slot = slotResult.rows[0];
    const oldType = slot.type;
    const oldStatus = slot.status;

    // Déterminer le nouveau statut et les horaires
    let newStatus, startTime, endTime;

    if (newType === "SOLO") {
      newStatus = "OPEN_SOLO";
      startTime = "14:00";
      endTime = "17:00";
    } else if (newType === "GROUP") {
      newStatus = "BLOCKED_FOR_GROUP";
      startTime = "10:00";
      endTime = "17:00";
    } else {
      throw new Error("Type invalide. Utilisez SOLO ou GROUP");
    }

    // Vérifier s'il y a des réservations confirmées
    const bookingsResult = await client.query(
      "SELECT COUNT(*) as count FROM bookings WHERE slot_id = $1 AND status = 'CONFIRMED'",
      [slotId],
    );

    const hasConfirmedBookings = parseInt(bookingsResult.rows[0].count) > 0;

    if (hasConfirmedBookings) {
      throw new Error(
        "Impossible de changer le type : des réservations sont confirmées. Annulez-les d'abord.",
      );
    }

    // Mettre à jour le slot
    await client.query(
      `UPDATE slots 
       SET type = $1, status = $2, start_time = $3, end_time = $4
       WHERE id = $5`,
      [newType, newStatus, startTime, endTime, slotId],
    );

    // Supprimer les pré-réservations groupe si on passe en SOLO
    if (newType === "SOLO" && oldType === "GROUP") {
      await client.query("DELETE FROM group_prebookings WHERE slot_id = $1", [
        slotId,
      ]);
    }

    // Supprimer les bookings solo en attente si on passe en GROUP
    if (newType === "GROUP" && oldType === "SOLO") {
      await client.query(
        "DELETE FROM bookings WHERE slot_id = $1 AND status = 'REQUESTED'",
        [slotId],
      );
    }

    // Historique
    await createHistory(
      "SLOT",
      slotId,
      "FORCE_TYPE_CHANGE",
      {
        oldType,
        newType,
        oldStatus,
        newStatus,
        oldTime: `${slot.start_time}-${slot.end_time}`,
        newTime: `${startTime}-${endTime}`,
      },
      adminId,
      `Type forcé par admin: ${oldType} → ${newType}`,
    );

    await client.query("COMMIT");

    return {
      success: true,
      message: `Slot converti en ${newType} (${startTime}-${endTime})`,
      slot: {
        id: slotId,
        type: newType,
        status: newStatus,
        start_time: startTime,
        end_time: endTime,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { forceSlotType };
