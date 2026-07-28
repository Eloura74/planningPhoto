# 📱 INTÉGRATION WHATSAPP - Options Gratuites

**Date**: 28 juillet 2026  
**Objectif**: Envoyer notifications WhatsApp à Fabien (0782080607) gratuitement

---

## 🎯 OPTIONS GRATUITES DISPONIBLES

### 1️⃣ Twilio WhatsApp Sandbox (RECOMMANDÉ) ⭐

**Avantages**:
- ✅ **Gratuit** pour tests et usage limité
- ✅ Facile à configurer
- ✅ API officielle WhatsApp
- ✅ 1000 messages/mois gratuits

**Inconvénients**:
- ⚠️ Nécessite que le destinataire rejoigne le sandbox (une seule fois)
- ⚠️ Préfixe "join [code]" requis

**Configuration**:
```bash
npm install twilio
```

```javascript
// backend/src/services/whatsappService.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendWhatsAppNotification = async (message) => {
  try {
    await client.messages.create({
      from: 'whatsapp:+14155238886', // Numéro Twilio Sandbox
      to: 'whatsapp:+33782080607',   // Votre numéro
      body: message
    });
    console.log('✅ WhatsApp envoyé');
  } catch (error) {
    console.error('❌ Erreur WhatsApp:', error);
  }
};

module.exports = { sendWhatsAppNotification };
```

**Étapes d'activation**:
1. Créer compte Twilio gratuit: https://www.twilio.com/try-twilio
2. Aller dans "Messaging" > "Try it out" > "Send a WhatsApp message"
3. Scanner QR code avec WhatsApp
4. Envoyer "join [code]" au numéro Twilio
5. Copier Account SID et Auth Token dans `.env`

---

### 2️⃣ WhatsApp Business API (Gratuit via Meta)

**Avantages**:
- ✅ Complètement gratuit
- ✅ API officielle
- ✅ Pas de limite de messages

**Inconvénients**:
- ⚠️ Configuration complexe
- ⚠️ Nécessite vérification entreprise
- ⚠️ Délai d'approbation 1-2 semaines

**Configuration**:
1. Créer compte Meta Business: https://business.facebook.com
2. Ajouter WhatsApp Business API
3. Vérifier numéro de téléphone
4. Obtenir token d'accès

---

### 3️⃣ CallMeBot (ULTRA SIMPLE) ⭐⭐⭐

**Avantages**:
- ✅ **100% gratuit**
- ✅ **Aucune inscription**
- ✅ **Configuration en 2 minutes**
- ✅ Simple requête HTTP

**Inconvénients**:
- ⚠️ Limite 10 messages/minute
- ⚠️ Pas d'API officielle

**Configuration**:
```bash
# Aucune dépendance nécessaire !
```

```javascript
// backend/src/services/whatsappService.js
const axios = require('axios');

const sendWhatsAppNotification = async (message) => {
  try {
    const apiKey = process.env.CALLMEBOT_API_KEY; // Obtenu après activation
    const phone = '33782080607'; // Sans le +
    
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    
    await axios.get(url);
    console.log('✅ WhatsApp envoyé via CallMeBot');
  } catch (error) {
    console.error('❌ Erreur WhatsApp:', error);
  }
};

module.exports = { sendWhatsAppNotification };
```

**Étapes d'activation** (2 minutes):
1. Ajouter le numéro CallMeBot dans vos contacts: **+34 644 44 71 67**
2. Envoyer ce message WhatsApp: **"I allow callmebot to send me messages"**
3. Vous recevrez votre API Key en réponse
4. Ajouter l'API Key dans `.env`

---

### 4️⃣ WAHA (WhatsApp HTTP API) - Auto-hébergé

**Avantages**:
- ✅ Gratuit et open-source
- ✅ Contrôle total
- ✅ Pas de limite

**Inconvénients**:
- ⚠️ Nécessite serveur Docker
- ⚠️ Configuration technique
- ⚠️ Risque de ban WhatsApp

---

## 🏆 RECOMMANDATION FINALE

### Pour Démarrage Rapide: **CallMeBot** ⭐⭐⭐

**Pourquoi**:
- Configuration en 2 minutes
- Aucun code complexe
- Gratuit à vie
- Parfait pour notifications admin

**Code Complet**:

```javascript
// backend/src/services/whatsappService.js
const axios = require('axios');

const sendWhatsAppNotification = async (message) => {
  // Vérifier si WhatsApp est activé
  if (!process.env.CALLMEBOT_API_KEY) {
    console.log('⚠️ WhatsApp non configuré (CALLMEBOT_API_KEY manquant)');
    return;
  }

  try {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    const phone = '33782080607';
    
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    
    await axios.get(url);
    console.log('✅ WhatsApp envoyé à Fabien');
  } catch (error) {
    console.error('❌ Erreur WhatsApp:', error.message);
    // Ne pas bloquer l'application si WhatsApp échoue
  }
};

// Fonction helper pour formater les notifications
const notifyAdminNewBooking = async (userName, slotDate, slotTime, type) => {
  const emoji = type === 'SOLO' ? '📸' : '👥';
  const message = `${emoji} *Nouvelle réservation ${type}*\n\n` +
                  `👤 Élève: ${userName}\n` +
                  `📅 Date: ${slotDate}\n` +
                  `🕐 Horaire: ${slotTime}\n\n` +
                  `Connectez-vous au dashboard pour valider.`;
  
  await sendWhatsAppNotification(message);
};

module.exports = {
  sendWhatsAppNotification,
  notifyAdminNewBooking,
};
```

**Intégration dans bookings/service.js**:

```javascript
const { notifyAdminNewBooking } = require('../../services/whatsappService');

// Dans createSoloBooking, après l'email:
await notifyAdminNewBooking(
  user.name,
  new Date(slotData.date).toLocaleDateString('fr-FR'),
  slotTime,
  'SOLO'
);

// Dans createGroupPrebooking, après l'email:
await notifyAdminNewBooking(
  user.name,
  new Date(slotData.date).toLocaleDateString('fr-FR'),
  slotTime,
  'GROUPE'
);
```

---

## 📋 ÉTAPES D'INSTALLATION CALLMEBOT

### 1. Activation (2 minutes)

1. **Ajouter le contact CallMeBot**
   - Numéro: **+34 644 44 71 67**
   - Nom: CallMeBot

2. **Envoyer le message d'activation**
   - Ouvrir WhatsApp
   - Envoyer à CallMeBot: `I allow callmebot to send me messages`
   - Attendre la réponse avec votre API Key

3. **Configurer l'application**
   ```bash
   # .env
   CALLMEBOT_API_KEY=votre_api_key_reçue
   ```

### 2. Installation du code

```bash
cd backend
# Axios est déjà installé normalement, sinon:
npm install axios
```

### 3. Test

```bash
# Redémarrer le backend
npm run dev

# Tester avec une réservation
# Vous devriez recevoir un WhatsApp !
```

---

## 🎨 EXEMPLES DE MESSAGES

### Nouvelle réservation solo
```
📸 *Nouvelle réservation SOLO*

👤 Élève: Marie Dupont
📅 Date: Mercredi 5 août 2026
🕐 Horaire: 14:00 - 17:00

Connectez-vous au dashboard pour valider.
```

### Nouvelle pré-réservation groupe
```
👥 *Nouvelle pré-réservation GROUPE*

👤 Membre: Jean Martin
📅 Date: Mardi 10 août 2026
🕐 Horaire: 09:00 - 17:00
👥 Participants: 3/5

✅ Seuil atteint - Vous pouvez valider !
```

### Annulation
```
⚠️ *Annulation de réservation*

👤 Élève: Sophie Bernard
📅 Date: Jeudi 12 août 2026
🕐 Horaire: 14:00 - 17:00

Le créneau est à nouveau disponible.
```

---

## 💰 COMPARAISON COÛTS

| Service | Gratuit | Limite | Complexité |
|---------|---------|--------|------------|
| **CallMeBot** | ✅ Oui | 10/min | ⭐ Facile |
| **Twilio Sandbox** | ✅ 1000/mois | 1000/mois | ⭐⭐ Moyen |
| **WhatsApp Business** | ✅ Oui | Illimité | ⭐⭐⭐ Difficile |
| **WAHA** | ✅ Oui | Illimité | ⭐⭐⭐⭐ Expert |

---

## ⚠️ LIMITATIONS WHATSAPP

1. **Pas de spam**: Ne pas envoyer trop de messages
2. **Respect RGPD**: Consentement utilisateur requis
3. **Pas de marketing**: Uniquement notifications transactionnelles
4. **Risque de ban**: Si usage abusif

---

## 🚀 DÉPLOIEMENT

### Étape 1: Activer CallMeBot
```
1. Ajouter +34 644 44 71 67 dans contacts
2. Envoyer "I allow callmebot to send me messages"
3. Copier l'API Key reçue
```

### Étape 2: Configurer .env
```bash
CALLMEBOT_API_KEY=123456  # Votre clé reçue
```

### Étape 3: Créer le service
```bash
# Créer backend/src/services/whatsappService.js
# (code fourni ci-dessus)
```

### Étape 4: Intégrer dans bookings
```javascript
// Ajouter les appels notifyAdminNewBooking
// dans createSoloBooking et createGroupPrebooking
```

### Étape 5: Tester
```bash
npm run dev
# Faire une réservation test
# Vérifier réception WhatsApp
```

---

## ✅ CONCLUSION

**Solution recommandée**: **CallMeBot**
- ✅ Gratuit à vie
- ✅ Configuration 2 minutes
- ✅ Aucune dépendance complexe
- ✅ Parfait pour notifications admin

**Alternative**: **Twilio** si besoin de plus de fonctionnalités à l'avenir.

---

**Document créé le 28/07/2026**  
**Pour**: Planning Photographe - Notifications Admin
