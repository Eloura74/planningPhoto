const { Resend } = require("resend");

// Configuration Resend (alternative à Gmail pour Render)
const resend = new Resend(process.env.RESEND_API_KEY);

// Fallback email si RESEND_API_KEY n'est pas configuré
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  process.env.GMAIL_USER ||
  "noreply@planningphoto.com";

// Envoyer un email de confirmation de réservation SOLO
const sendSoloBookingConfirmation = async (
  userEmail,
  userName,
  slotDate,
  slotTime,
) => {
  console.log("📧 Tentative d'envoi d'email à:", userEmail);
  console.log("📧 FROM_EMAIL:", FROM_EMAIL);
  console.log("📧 RESEND_API_KEY configuré:", !!process.env.RESEND_API_KEY);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d4af37;">📸 Réservation Confirmée</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Votre réservation a été confirmée avec succès !</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📅 Date :</strong> ${new Date(slotDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <p><strong>🕐 Horaire :</strong> ${slotTime}</p>
        <p><strong>📍 Type :</strong> Séance Solo</p>
      </div>
      <p>Merci de votre confiance !</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      subject: "✅ Réservation confirmée - Planning Photo",
      html: htmlContent,
    });

    if (error) {
      console.error("❌ ERREUR ENVOI EMAIL:", error);
      return;
    }

    console.log("✅ Email envoyé avec succès à:", userEmail);
    console.log("✅ Email ID:", data.id);
  } catch (error) {
    console.error("❌ ERREUR ENVOI EMAIL:", error);
    console.error("❌ Détails:", error.message);
  }
};

// Envoyer un email de confirmation de réservation GROUPE
const sendGroupBookingConfirmation = async (
  userEmail,
  userName,
  slotDate,
  slotTime,
  participants,
) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d4af37;">🎉 Séance Groupe Confirmée</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>La séance groupe a été confirmée !</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📅 Date :</strong> ${new Date(slotDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <p><strong>🕐 Horaire :</strong> ${slotTime}</p>
        <p><strong>👥 Participants :</strong> ${participants} personne(s)</p>
      </div>
      <p>À bientôt !</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      subject: "✅ Séance Groupe Confirmée - Planning Photo",
      html: htmlContent,
    });

    if (error) {
      console.error("❌ Erreur envoi email groupe:", error);
      return;
    }

    console.log("✅ Email groupe envoyé à:", userEmail);
    console.log("✅ Email ID:", data.id);
  } catch (error) {
    console.error("❌ Erreur envoi email groupe:", error.message);
  }
};

// Envoyer un email de confirmation d'événement
const sendEventConfirmation = async (
  userEmail,
  userName,
  eventName,
  confirmedDates,
) => {
  const datesFormatted = confirmedDates
    .map((date) =>
      new Date(date).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    )
    .join("<br>");

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: `🎉 Événement confirmé : ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4af37;">🎉 Événement Confirmé</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>L'événement <strong>${eventName}</strong> a été confirmé !</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>📅 Date(s) confirmée(s) :</strong></p>
          <p>${datesFormatted}</p>
        </div>
        <p>Rendez-vous sur le calendrier pour voir les détails !</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email événement envoyé à:", userEmail);
  } catch (error) {
    console.error("❌ Erreur envoi email événement:", error.message);
  }
};

module.exports = {
  sendSoloBookingConfirmation,
  sendGroupBookingConfirmation,
  sendEventConfirmation,
};
