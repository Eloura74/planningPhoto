const axios = require('axios');

/**
 * Service WhatsApp gratuit via CallMeBot
 * 
 * Configuration requise:
 * 1. Ajouter le contact CallMeBot: +34 644 44 71 67
 * 2. Envoyer "I allow callmebot to send me messages"
 * 3. Copier l'API Key reçue dans .env: CALLMEBOT_API_KEY=xxxxx
 */

const sendWhatsAppNotification = async (message) => {
  // Vérifier si WhatsApp est activé
  if (!process.env.CALLMEBOT_API_KEY) {
    console.log('⚠️ WhatsApp non configuré (CALLMEBOT_API_KEY manquant)');
    return;
  }

  try {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    const phone = '33782080607'; // Numéro de Fabien (sans le +)
    
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    
    await axios.get(url);
    console.log('✅ WhatsApp envoyé à Fabien');
  } catch (error) {
    console.error('❌ Erreur WhatsApp:', error.message);
    // Ne pas bloquer l'application si WhatsApp échoue
  }
};

/**
 * Notifier l'admin d'une nouvelle réservation solo
 */
const notifyAdminNewSoloBooking = async (userName, slotDate, slotTime) => {
  const dateFormatted = new Date(slotDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const message = `📸 *Nouvelle réservation SOLO*\n\n` +
                  `👤 Élève: ${userName}\n` +
                  `📅 Date: ${dateFormatted}\n` +
                  `🕐 Horaire: ${slotTime}\n\n` +
                  `Connectez-vous au dashboard pour valider.`;
  
  await sendWhatsAppNotification(message);
};

/**
 * Notifier l'admin d'une nouvelle pré-réservation groupe
 */
const notifyAdminNewGroupPrebooking = async (userName, slotDate, slotTime, participants) => {
  const dateFormatted = new Date(slotDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const statusEmoji = participants >= 3 ? '✅' : '⚠️';
  const statusText = participants >= 3 
    ? 'Seuil atteint - Vous pouvez valider !' 
    : 'Seuil non atteint - Attendez plus de participants.';

  const message = `👥 *Nouvelle pré-réservation GROUPE*\n\n` +
                  `👤 Membre: ${userName}\n` +
                  `📅 Date: ${dateFormatted}\n` +
                  `🕐 Horaire: ${slotTime}\n` +
                  `👥 Participants: ${participants}/5\n\n` +
                  `${statusEmoji} ${statusText}`;
  
  await sendWhatsAppNotification(message);
};

/**
 * Notifier l'admin d'une annulation par un élève
 */
const notifyAdminCancellation = async (userName, slotDate, slotTime, type) => {
  const dateFormatted = new Date(slotDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const typeText = type === 'SOLO' ? 'solo' : 'groupe';

  const message = `⚠️ *Annulation de réservation ${typeText}*\n\n` +
                  `👤 Élève: ${userName}\n` +
                  `📅 Date: ${dateFormatted}\n` +
                  `🕐 Horaire: ${slotTime}\n\n` +
                  `Le créneau est à nouveau disponible.`;
  
  await sendWhatsAppNotification(message);
};

module.exports = {
  sendWhatsAppNotification,
  notifyAdminNewSoloBooking,
  notifyAdminNewGroupPrebooking,
  notifyAdminCancellation,
};
