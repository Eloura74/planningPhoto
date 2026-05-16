const SibApiV3Sdk = require("sib-api-v3-sdk");

// Configuration Brevo (ex-Sendinblue)
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "noreply@planningphoto.com";
const FROM_NAME = "Planning Photo";

// Envoyer un email de confirmation de réservation SOLO
const sendSoloBookingConfirmation = async (
  userEmail,
  userName,
  slotDate,
  slotTime,
) => {
  console.log("📧 Tentative d'envoi d'email à:", userEmail);
  console.log("📧 FROM_EMAIL:", FROM_EMAIL);
  console.log("📧 BREVO_API_KEY configuré:", !!process.env.BREVO_API_KEY);

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
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email: userEmail, name: userName }];
    sendSmtpEmail.subject = "✅ Réservation confirmée - Planning Photo";
    sendSmtpEmail.htmlContent = htmlContent;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email envoyé avec succès à:", userEmail);
    console.log("✅ Message ID:", data.messageId);
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
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email: userEmail, name: userName }];
    sendSmtpEmail.subject = "✅ Séance Groupe Confirmée - Planning Photo";
    sendSmtpEmail.htmlContent = htmlContent;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email groupe envoyé à:", userEmail);
    console.log("✅ Message ID:", data.messageId);
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

// Envoyer un email d'annulation par l'admin à l'utilisateur
const sendCancellationByAdmin = async (
  userEmail,
  userName,
  slotDate,
  slotTime,
  slotType,
  reason,
) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">❌ Réservation Annulée</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Nous vous informons que votre réservation a été annulée par l'administrateur.</p>
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p><strong>📅 Date :</strong> ${new Date(slotDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <p><strong>🕐 Horaire :</strong> ${slotTime}</p>
        <p><strong>📍 Type :</strong> ${slotType === "SOLO" ? "Séance Solo" : "Séance Groupe"}</p>
        ${reason ? `<p><strong>💬 Raison :</strong> ${reason}</p>` : ""}
      </div>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email: userEmail, name: userName }];
    sendSmtpEmail.subject = "❌ Réservation annulée - Planning Photo";
    sendSmtpEmail.htmlContent = htmlContent;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email d'annulation envoyé à l'utilisateur:", userEmail);
    console.log("✅ Message ID:", data.messageId);
  } catch (error) {
    console.error("❌ Erreur envoi email d'annulation:", error.message);
  }
};

// Envoyer un email de notification à l'admin quand un utilisateur annule
const sendCancellationNotificationToAdmin = async (
  userName,
  userEmail,
  slotDate,
  slotTime,
  slotType,
) => {
  const adminEmail = process.env.BREVO_FROM_EMAIL; // Email de l'admin

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">⚠️ Annulation de Réservation</h2>
      <p>Bonjour,</p>
      <p>Un utilisateur a annulé sa réservation.</p>
      <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p><strong>👤 Utilisateur :</strong> ${userName} (${userEmail})</p>
        <p><strong>📅 Date :</strong> ${new Date(slotDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <p><strong>🕐 Horaire :</strong> ${slotTime}</p>
        <p><strong>📍 Type :</strong> ${slotType === "SOLO" ? "Séance Solo" : "Séance Groupe"}</p>
      </div>
      <p>Le créneau est maintenant disponible pour d'autres réservations.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email: adminEmail, name: "Admin" }];
    sendSmtpEmail.subject = "⚠️ Annulation de réservation - Planning Photo";
    sendSmtpEmail.htmlContent = htmlContent;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email de notification envoyé à l'admin:", adminEmail);
    console.log("✅ Message ID:", data.messageId);
  } catch (error) {
    console.error(
      "❌ Erreur envoi email de notification à l'admin:",
      error.message,
    );
  }
};

module.exports = {
  sendSoloBookingConfirmation,
  sendGroupBookingConfirmation,
  sendEventConfirmation,
  sendCancellationByAdmin,
  sendCancellationNotificationToAdmin,
};
