const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@planning.com",
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error: error.message };
  }
};

const sendAccountCreationEmail = async (email, name) => {
  const html = `
    <h2>Bienvenue ${name} !</h2>
    <p>Votre compte a été créé avec succès.</p>
    <p>Vous pouvez maintenant vous connecter à l'application.</p>
  `;
  return sendEmail(email, "Compte créé", html);
};

const sendBookingConfirmationEmail = async (
  email,
  name,
  slotDate,
  slotTime,
) => {
  const html = `
    <h2>Réservation confirmée</h2>
    <p>Bonjour ${name},</p>
    <p>Votre réservation a été confirmée pour le ${slotDate} à ${slotTime}.</p>
  `;
  return sendEmail(email, "Réservation confirmée", html);
};

const sendBookingPendingEmail = async (email, name, slotDate, slotTime) => {
  const html = `
    <h2>Réservation en attente</h2>
    <p>Bonjour ${name},</p>
    <p>Votre réservation est en attente de validation pour le ${slotDate} à ${slotTime}.</p>
  `;
  return sendEmail(email, "Réservation en attente", html);
};

const sendBookingCancelledEmail = async (email, name, slotDate, slotTime) => {
  const html = `
    <h2>Réservation annulée</h2>
    <p>Bonjour ${name},</p>
    <p>Votre réservation pour le ${slotDate} à ${slotTime} a été annulée.</p>
  `;
  return sendEmail(email, "Réservation annulée", html);
};

const sendGroupValidationEmail = async (email, name, slotDate) => {
  const html = `
    <h2>Séance groupe validée</h2>
    <p>Bonjour ${name},</p>
    <p>La séance groupe du ${slotDate} a été validée par le formateur.</p>
  `;
  return sendEmail(email, "Séance groupe validée", html);
};

const sendSoloRequestEmail = async (email, name, slotDate, slotTime) => {
  const html = `
    <h2>Demande de réservation solo</h2>
    <p>Bonjour ${name},</p>
    <p>Votre demande de réservation solo pour le ${slotDate} à ${slotTime} a été enregistrée.</p>
    <p>Elle est en attente de validation par le formateur.</p>
  `;
  return sendEmail(email, "Demande de réservation solo", html);
};

const sendSoloRefusedEmail = async (
  email,
  name,
  slotDate,
  slotTime,
  reason,
) => {
  const html = `
    <h2>Réservation solo refusée</h2>
    <p>Bonjour ${name},</p>
    <p>Votre demande de réservation solo pour le ${slotDate} à ${slotTime} a été refusée.</p>
    ${reason ? `<p>Raison : ${reason}</p>` : ""}
  `;
  return sendEmail(email, "Réservation solo refusée", html);
};

const sendCancellationByStudentEmail = async (
  email,
  name,
  slotDate,
  slotTime,
) => {
  const html = `
    <h2>Annulation de réservation</h2>
    <p>Bonjour ${name},</p>
    <p>Votre réservation pour le ${slotDate} à ${slotTime} a été annulée.</p>
  `;
  return sendEmail(email, "Annulation de réservation", html);
};

const sendCancellationByAdminEmail = async (
  email,
  name,
  slotDate,
  slotTime,
  reason,
) => {
  const html = `
    <h2>Réservation annulée par le formateur</h2>
    <p>Bonjour ${name},</p>
    <p>Votre réservation pour le ${slotDate} à ${slotTime} a été annulée par le formateur.</p>
    ${reason ? `<p>Raison : ${reason}</p>` : ""}
  `;
  return sendEmail(email, "Réservation annulée", html);
};

const sendSlotModificationEmail = async (
  email,
  name,
  oldDate,
  oldTime,
  newDate,
  newTime,
) => {
  const html = `
    <h2>Modification de créneau</h2>
    <p>Bonjour ${name},</p>
    <p>Le créneau initialement prévu le ${oldDate} à ${oldTime} a été modifié.</p>
    <p>Nouveau créneau : ${newDate} à ${newTime}</p>
  `;
  return sendEmail(email, "Modification de créneau", html);
};

const sendGroupCancellationEmail = async (email, name, slotDate, reason) => {
  const html = `
    <h2>Annulation de séance groupe</h2>
    <p>Bonjour ${name},</p>
    <p>La séance groupe du ${slotDate} a été annulée.</p>
    ${reason ? `<p>Raison : ${reason}</p>` : ""}
  `;
  return sendEmail(email, "Annulation de séance groupe", html);
};

const sendAdminNotification = async (adminEmail, eventType, details) => {
  const html = `
    <h2>Notification système - ${eventType}</h2>
    <p>Une action a été effectuée sur le système.</p>
    <p>Détails : ${details}</p>
  `;
  return sendEmail(adminEmail, `Notification : ${eventType}`, html);
};

const sendAdminSoloRequestNotification = async (
  adminEmail,
  studentName,
  slotDate,
  slotTime,
) => {
  const html = `
    <h2>Nouvelle demande de réservation solo</h2>
    <p>L'étudiant ${studentName} a demandé une réservation pour le ${slotDate} à ${slotTime}.</p>
    <p>Veuillez valider ou refuser cette demande.</p>
  `;
  return sendEmail(adminEmail, "Nouvelle demande solo", html);
};

const sendAdminGroupLowParticipationNotification = async (
  adminEmail,
  slotDate,
  participantCount,
) => {
  const html = `
    <h2>Alerte : Seuil groupe non atteint</h2>
    <p>La séance groupe du ${slotDate} n'a que ${participantCount} participants (minimum 3 requis).</p>
    <p>Veuillez prendre une décision.</p>
  `;
  return sendEmail(adminEmail, "Alerte seuil groupe", html);
};

const sendAdminSlotFullNotification = async (
  adminEmail,
  slotDate,
  slotTime,
) => {
  const html = `
    <h2>Créneau complet</h2>
    <p>Le créneau du ${slotDate} à ${slotTime} est maintenant complet (5 participants).</p>
  `;
  return sendEmail(adminEmail, "Créneau complet", html);
};

module.exports = {
  sendEmail,
  sendAccountCreationEmail,
  sendBookingConfirmationEmail,
  sendBookingPendingEmail,
  sendBookingCancelledEmail,
  sendGroupValidationEmail,
  sendSoloRequestEmail,
  sendSoloRefusedEmail,
  sendCancellationByStudentEmail,
  sendCancellationByAdminEmail,
  sendSlotModificationEmail,
  sendGroupCancellationEmail,
  sendAdminNotification,
  sendAdminSoloRequestNotification,
  sendAdminGroupLowParticipationNotification,
  sendAdminSlotFullNotification,
};
