const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");
const { createHistory } = require("../common/historyService");
const sendEmail = async (to, subject, html) => {
  try {
    // Désactivé temporairement - erreur d'authentification Gmail
    console.log(`Email non envoyé (désactivé): ${to} - ${subject}`);
    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error: error.message };
  }
};

const {
  sendBookingConfirmationEmail,
  sendSoloRequestEmail,
  sendAdminSoloRequestNotification,
  sendCancellationByStudentEmail,
  sendCancellationByAdminEmail,
} = require("../notifications/service");

const getUserWeeklyBookings = async (userId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM bookings 
     WHERE user_id = $1 AND slot_id IN (
       SELECT id FROM slots WHERE date >= $2 AND date <= $3
     ) AND status != $4`,
    [userId, startDate, endDate, "CANCELLED"],
  );
  return parseInt(result.rows[0].count);
};

const getUserMonthlyBookings = async (userId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM bookings 
     WHERE user_id = $1 AND slot_id IN (
       SELECT id FROM slots WHERE date >= $2 AND date <= $3
     ) AND status != $4`,
    [userId, startDate, endDate, "CANCELLED"],
  );
  return parseInt(result.rows[0].count);
};

const createSoloBooking = async (userId, slotId) => {
  try {
    console.log("createSoloBooking appelé avec:", { userId, slotId });

    // Vérifier si le slot existe, sinon le créer (slot virtuel)
    let slot = await pool.query("SELECT * FROM slots WHERE id = $1", [slotId]);

    let slotData;
    if (slot.rows.length === 0) {
      // Slot virtuel - extraire date et heure de l'ID (format: YYYY-MM-DD_HH:MM)
      console.log("🔍 Slot virtuel détecté, slotId:", slotId);
      const [date, startTime] = slotId.split("_");
      const endTime = startTime === "09:00" ? "12:00" : "17:00";
      console.log(
        "🔍 Date extraite:",
        date,
        "StartTime:",
        startTime,
        "EndTime:",
        endTime,
      );

      // IMPORTANT : Chercher d'abord si un slot existe déjà avec cette date/heure
      const existingSlot = await pool.query(
        "SELECT * FROM slots WHERE date = $1 AND start_time = $2 AND end_time = $3 AND type = 'SOLO'",
        [date, startTime, endTime],
      );

      if (existingSlot.rows.length > 0) {
        // Utiliser le slot existant
        slotData = existingSlot.rows[0];
        slotId = slotData.id;
        console.log("🔍 Slot existant trouvé par date/heure:", slotData);
      } else {
        // Créer le slot
        const newSlotId = uuidv4();
        console.log("🔍 Création du slot avec ID:", newSlotId);
        await pool.query(
          "INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [newSlotId, date, startTime, endTime, "SOLO", "OPEN_SOLO", 1, 1],
        );
        console.log("🔍 Slot inséré, récupération...");

        // Récupérer le slot créé
        const newSlot = await pool.query("SELECT * FROM slots WHERE id = $1", [
          newSlotId,
        ]);
        console.log("🔍 Résultat SELECT:", newSlot.rows);
        slotData = newSlot.rows[0];
        console.log("🔍 slotData après SELECT:", slotData);
        slotId = newSlotId; // Utiliser le vrai ID maintenant
      }
    } else {
      slotData = slot.rows[0];
      console.log("🔍 Slot existant trouvé:", slotData);
    }

    console.log("🔍 Slot final avant vérifications:", slotData);

    if (!slotData) {
      throw new Error("Erreur: slot non trouvé après création/récupération");
    }

    if (slotData.status !== "OPEN_SOLO" && slotData.status !== "OPEN_TUESDAY") {
      throw new Error("Slot not available for solo booking");
    }

    if (slotData.type !== "SOLO" && slotData.type !== "MIXED") {
      throw new Error("Slot is not available for solo booking");
    }

    // Règle 1 : Vérifier que l'utilisateur n'a pas déjà réservé ce créneau (par date + heure)
    const existingSoloBooking = await pool.query(
      `SELECT b.* FROM bookings b 
       JOIN slots s ON b.slot_id = s.id 
       WHERE b.user_id = $1 
       AND s.date = $2 
       AND s.start_time = $3 
       AND s.end_time = $4
       AND b.status NOT IN ('CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_ADMIN')`,
      [userId, slotData.date, slotData.start_time, slotData.end_time],
    );

    if (existingSoloBooking.rows.length > 0) {
      throw new Error("Vous avez déjà réservé ce créneau");
    }

    // Règle 2 : Anti-concurrence - Vérifier que l'utilisateur n'a pas déjà une réservation solo le même jour
    const sameDayBookings = await pool.query(
      "SELECT b.*, s.date FROM bookings b JOIN slots s ON b.slot_id = s.id WHERE b.user_id = $1 AND b.status NOT IN ('CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_ADMIN') AND s.date = $2",
      [userId, slotData.date],
    );

    if (sameDayBookings.rows.length > 0) {
      throw new Error("Vous avez déjà une réservation solo pour cette date");
    }

    const existingBooking = await pool.query(
      "SELECT * FROM bookings WHERE slot_id = $1 AND status NOT IN ('CANCELLED', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_STUDENT')",
      [slotId],
    );

    if (existingBooking.rows.length > 0) {
      throw new Error("Slot already booked");
    }

    const bookingId = uuidv4();
    const result = await pool.query(
      "INSERT INTO bookings (id, user_id, slot_id, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [bookingId, userId, slotId, "REQUESTED"],
    );

    await pool.query("UPDATE slots SET status = $1 WHERE id = $2", [
      "SOLO_PENDING",
      slotId,
    ]);
    await createHistory(
      "BOOKING",
      bookingId,
      "CREATE",
      {
        userId,
        slotId,
        type: "SOLO",
      },
      null,
      "Demande de réservation solo créée",
    );

    // Envoyer notification à l'étudiant
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (user.rows.length > 0) {
      await sendSoloRequestEmail(
        user.rows[0].email,
        user.rows[0].name,
        slotData.date,
        `${slotData.start_time} - ${slotData.end_time}`,
      );

      // Envoyer notification à l'admin
      const admin = await pool.query(
        "SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1",
      );
      if (admin.rows.length > 0) {
        await sendEmail(
          admin.rows[0].email,
          "Nouvelle demande de réservation solo",
          `Bonjour ${admin.rows[0].name},<br><br>Une nouvelle demande de réservation solo a été créée pour le ${slotData.date} à ${slotData.start_time} - ${slotData.end_time} par ${user.rows[0].name}.<br><br>Cordialement, l'équipe`,
        );
      }
    }

    console.log("Réservation créée avec succès:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Erreur dans createSoloBooking:", error.message);
    throw error;
  }
};

const createGroupPrebooking = async (userId, slotId) => {
  // Vérifier si le slot existe, sinon le créer (slot virtuel)
  let slot = await pool.query("SELECT * FROM slots WHERE id = $1", [slotId]);

  let slotData;
  if (slot.rows.length === 0) {
    // Slot virtuel - extraire date et heure de l'ID (format: YYYY-MM-DD_HH:MM)
    const [date, startTime] = slotId.split("_");
    // Créneaux groupe toute la journée : 9h-17h
    const endTime = "17:00";

    // IMPORTANT : Chercher d'abord si un slot groupe existe déjà avec cette date
    const existingGroupSlot = await pool.query(
      "SELECT * FROM slots WHERE date = $1 AND type = 'GROUP'",
      [date],
    );

    if (existingGroupSlot.rows.length > 0) {
      // Utiliser le slot existant
      slotData = existingGroupSlot.rows[0];
      slotId = slotData.id;
      console.log("🔍 Slot groupe existant trouvé par date:", slotData);
    } else {
      // Créer le slot
      const newSlotId = uuidv4();
      try {
        console.log("🔍 Création slot virtuel:", {
          newSlotId,
          date,
          startTime,
          endTime,
        });
        await pool.query(
          "INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [
            newSlotId,
            date,
            startTime,
            endTime,
            "GROUP",
            "BLOCKED_FOR_GROUP",
            3,
            5,
          ],
        );
      } catch (error) {
        console.error("❌ Erreur INSERT slot:", error.message);
        console.error("Paramètres:", { newSlotId, date, startTime, endTime });
        throw error;
      }

      // Récupérer le slot créé
      const newSlot = await pool.query("SELECT * FROM slots WHERE id = $1", [
        newSlotId,
      ]);
      slotData = newSlot.rows[0];
      slotId = newSlotId; // Utiliser le vrai ID maintenant
    }
  } else {
    slotData = slot.rows[0];
  }

  // Vérifier que c'est bien un mardi ou jeudi
  const slotDate =
    slotData.date instanceof Date
      ? slotData.date
      : new Date(slotData.date + "T00:00:00");
  const dayOfWeek = slotDate.getDay();

  if (dayOfWeek !== 2 && dayOfWeek !== 4) {
    throw new Error(
      `Les pré-réservations groupe ne sont possibles que les mardis et jeudis`,
    );
  }

  // Vérifier que le slot est disponible pour le groupe
  if (
    slotData.status !== "BLOCKED_FOR_GROUP" &&
    slotData.status !== "GROUP_PREBOOKING_OPEN" &&
    slotData.status !== "GROUP_PREBOOKING" &&
    slotData.status !== "OPEN_TUESDAY" &&
    slotData.status !== "MIXED"
  ) {
    throw new Error("Slot not available for group pre-booking");
  }

  // Vérifier par date + heure pour éviter les doublons avec slots virtuels
  const existingPrebooking = await pool.query(
    `SELECT gp.* FROM group_prebookings gp
     JOIN slots s ON gp.slot_id = s.id
     WHERE gp.user_id = $1 
     AND s.date = $2 
     AND s.start_time = $3`,
    [userId, slotData.date, slotData.start_time],
  );

  if (existingPrebooking.rows.length > 0) {
    throw new Error("Already pre-booked for this slot");
  }

  // Vérifier le nombre de participants (max 5)
  const currentPrebookings = await pool.query(
    "SELECT COUNT(*) as count FROM group_prebookings WHERE slot_id = $1",
    [slotId],
  );
  const currentCount = parseInt(currentPrebookings.rows[0].count);
  if (currentCount >= 5) {
    throw new Error("Ce créneau est complet (maximum 5 participants)");
  }

  const prebookingId = uuidv4();
  await pool.query(
    "INSERT INTO group_prebookings (id, user_id, slot_id) VALUES ($1, $2, $3)",
    [prebookingId, userId, slotId],
  );

  const prebookings = await pool.query(
    "SELECT COUNT(*) as count FROM group_prebookings WHERE slot_id = $1",
    [slotId],
  );

  const count = parseInt(prebookings.rows[0].count);

  if (
    count >= slotData.capacity_min &&
    slotData.status === "BLOCKED_FOR_GROUP"
  ) {
    await pool.query("UPDATE slots SET status = $1 WHERE id = $2", [
      "GROUP_PREBOOKING",
      slotId,
    ]);
  }

  await createHistory(
    "GROUP_PREBOOKING",
    prebookingId,
    "CREATE",
    {
      userId,
      slotId,
    },
    null,
    "Pré-réservation groupe créée",
  );

  return { id: prebookingId, userId, slotId };
};

const getBookingsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT b.*, s.date, s.start_time, s.end_time, s.type, s.status as slot_status 
     FROM bookings b 
     JOIN slots s ON b.slot_id = s.id 
     WHERE b.user_id = $1 AND b.status NOT IN ('CANCELLED', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_STUDENT')
     ORDER BY s.date DESC, s.start_time DESC`,
    [userId],
  );
  return result.rows;
};

const getBookingsBySlot = async (slotId) => {
  const result = await pool.query(
    `SELECT b.*, u.name, u.email 
   FROM bookings b 
   JOIN users u ON b.user_id = u.id 
   WHERE b.slot_id = $1 AND b.status != 'CANCELLED'`,
    [slotId],
  );
  return result.rows;
};

const confirmBooking = async (bookingId, adminId) => {
  // Récupérer la réservation avant de la modifier
  const bookingResult = await pool.query(
    "SELECT * FROM bookings WHERE id = $1",
    [bookingId],
  );
  if (bookingResult.rows.length === 0) {
    throw new Error("Booking not found");
  }
  const booking = bookingResult.rows[0];

  // Mettre à jour le statut
  await pool.query(
    "UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    ["CONFIRMED", bookingId],
  );

  await createHistory(
    "BOOKING",
    bookingId,
    "CONFIRM",
    {},
    null,
    "Réservation confirmée par admin",
  );

  // Send confirmation email
  const user = await pool.query("SELECT * FROM users WHERE id = $1", [
    booking.user_id,
  ]);
  const slot = await pool.query("SELECT * FROM slots WHERE id = $1", [
    booking.slot_id,
  ]);

  if (user.rows.length > 0 && slot.rows.length > 0) {
    const userData = user.rows[0];
    const slotData = slot.rows[0];

    // Mettre à jour le statut du créneau
    await pool.query("UPDATE slots SET status = $1 WHERE id = $2", [
      slotData.type === "SOLO" ? "SOLO_CONFIRMED" : "GROUP_CONFIRMED",
      booking.slot_id,
    ]);

    await sendBookingConfirmationEmail(
      userData.email,
      userData.name,
      slotData.date,
      `${slotData.start_time} - ${slotData.end_time}`,
    );
  }

  // Récupérer la réservation mise à jour
  const updatedBooking = await pool.query(
    "SELECT * FROM bookings WHERE id = $1",
    [bookingId],
  );
  return updatedBooking.rows[0];
};

const cancelBooking = async (bookingId, cancelledBy, reason = null) => {
  const booking = await pool.query("SELECT * FROM bookings WHERE id = $1", [
    bookingId,
  ]);
  if (booking.rows.length === 0) {
    throw new Error("Booking not found");
  }

  const bookingData = booking.rows[0];
  const isCancelledByAdmin = cancelledBy.role === "ADMIN";
  const status = isCancelledByAdmin
    ? "CANCELLED_BY_ADMIN"
    : "CANCELLED_BY_STUDENT";

  const result = await pool.query(
    "UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP, cancellation_reason = $2 WHERE id = $3 RETURNING *",
    [status, reason, bookingId],
  );

  console.log("Avant UPDATE slot - slot_id:", bookingData.slot_id);
  const slotBefore = await pool.query("SELECT * FROM slots WHERE id = $1", [
    bookingData.slot_id,
  ]);
  console.log("Slot avant suppression:", slotBefore.rows[0]);

  const updateResult = await pool.query(
    "UPDATE slots SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    ["OPEN_SOLO", bookingData.slot_id],
  );
  console.log("UPDATE slot result:", updateResult);

  const slotAfter = await pool.query("SELECT * FROM slots WHERE id = $1", [
    bookingData.slot_id,
  ]);
  console.log("Slot après suppression:", slotAfter.rows[0]);

  await createHistory(
    "BOOKING",
    bookingId,
    "CANCEL",
    { cancelledBy: cancelledBy.id, reason },
    null,
    `Annulation par ${isCancelledByAdmin ? "admin" : "élève"}`,
  );

  // Envoyer notification
  const user = await pool.query("SELECT * FROM users WHERE id = $1", [
    bookingData.user_id,
  ]);
  const slot = await pool.query("SELECT * FROM slots WHERE id = $1", [
    bookingData.slot_id,
  ]);

  if (user.rows.length > 0 && slot.rows.length > 0) {
    const userData = user.rows[0];
    const slotData = slot.rows[0];

    if (isCancelledByAdmin) {
      await sendCancellationByAdminEmail(
        userData.email,
        userData.name,
        slotData.date,
        `${slotData.start_time} - ${slotData.end_time}`,
        reason,
      );
    } else {
      await sendCancellationByStudentEmail(
        userData.email,
        userData.name,
        slotData.date,
        `${slotData.start_time} - ${slotData.end_time}`,
      );
    }
  }

  return result.rows[0];
};

const getGroupPrebookingsBySlot = async (slotId, userId = null) => {
  // Récupérer les pré-réservations groupe
  let prebookingsQuery =
    "SELECT gp.id, gp.user_id, gp.slot_id, gp.created_at, u.name as user_name, u.email as user_email, 'GROUP_PREBOOKING' as status FROM group_prebookings gp JOIN users u ON gp.user_id = u.id WHERE gp.slot_id = $1";
  const prebookingsParams = [slotId];

  if (userId) {
    prebookingsQuery += " AND gp.user_id = $2";
    prebookingsParams.push(userId);
  }

  const prebookings = await pool.query(prebookingsQuery, prebookingsParams);

  // Récupérer aussi les bookings confirmés pour ce slot (groupe)
  let bookingsQuery =
    "SELECT b.id, b.user_id, b.slot_id, b.created_at, u.name as user_name, u.email as user_email, b.status FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.slot_id = $1 AND b.status = 'CONFIRMED'";
  const bookingsParams = [slotId];

  if (userId) {
    bookingsQuery += " AND b.user_id = $2";
    bookingsParams.push(userId);
  }

  const bookings = await pool.query(bookingsQuery, bookingsParams);

  // Combiner les deux listes
  return [...prebookings.rows, ...bookings.rows];
};

const deleteGroupPrebooking = async (userId, slotId) => {
  const slot = await pool.query("SELECT * FROM slots WHERE id = $1", [slotId]);
  if (slot.rows.length === 0) {
    throw new Error("Slot not found");
  }

  const slotData = slot.rows[0];

  // Règle : Modification interdite 1 semaine avant
  const slotDate = new Date(slotData.date);
  const today = new Date();
  const daysDifference = Math.ceil((slotDate - today) / (1000 * 60 * 60 * 24));
  if (daysDifference < 7) {
    throw new Error(
      "La modification des pré-choix est interdite moins d'une semaine avant la séance",
    );
  }

  // Vérifier que la fenêtre de pré-réservation est ouverte
  const { isGroupPrebookingOpen } = require("../availabilityPeriods/service");
  const isOpen = await isGroupPrebookingOpen();
  if (!isOpen) {
    throw new Error("La fenêtre de pré-réservation groupe est fermée");
  }

  const result = await pool.query(
    "DELETE FROM group_prebookings WHERE user_id = $1 AND slot_id = $2 RETURNING *",
    [userId, slotId],
  );

  const remaining = await pool.query(
    "SELECT COUNT(*) as count FROM group_prebookings WHERE slot_id = $1",
    [slotId],
  );

  if (parseInt(remaining.rows[0].count) === 0) {
    await pool.query("UPDATE slots SET status = $1 WHERE id = $2", [
      "BLOCKED_FOR_GROUP",
      slotId,
    ]);
  }

  // Alerte admin si seuil < 3 après suppression
  const newCount = parseInt(remaining.rows[0].count);
  if (newCount > 0 && newCount < 3) {
    await createHistory(
      "GROUP_ALERT",
      slotId,
      "LOW_PARTICIPATION",
      {
        slotId,
        participantCount: newCount,
        threshold: 3,
      },
      null,
      `Alerte : Seuil groupe non atteint (${newCount}/3) pour créneau ${slotData.date}`,
    );
  }

  await createHistory(
    "GROUP_PREBOOKING",
    `${userId}-${slotId}`,
    "DELETE",
    {
      userId,
      slotId,
    },
    null,
    "Suppression pré-réservation groupe",
  );

  return result.rows[0];
};

const getSlotsWithLowGroupParticipation = async () => {
  const result = await pool.query(`
  SELECT s.*, COUNT(gp.id) as participant_count
  FROM slots s
  LEFT JOIN group_prebookings gp ON s.id = gp.slot_id
  WHERE s.type = 'GROUP'
  AND s.status IN ('GROUP_PREBOOKING', 'GROUP_PREBOOKING_OPEN', 'GROUP_CONFIRMED')
  GROUP BY s.id
  HAVING COUNT(gp.id) > 0 AND COUNT(gp.id) < 3
  ORDER BY s.date ASC
`);
  return result.rows;
};

module.exports = {
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
};
