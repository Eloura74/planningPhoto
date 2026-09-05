# 📚 Guide Administrateur - Planning Photo

## 🎯 Nouveautés et Améliorations

### ✅ Corrections Appliquées (Sept 2026)

1. **Cartes du Dashboard Cliquables**
   - 👥 Utilisateurs → Navigue vers `/admin/users`
   - 📅 Créneaux → Change l'onglet vers "Créneaux"
   - ⏳ En attente → Scroll vers la section réservations
   - 👨‍👩‍👧‍👦 Pré-réservations → Scroll vers la section réservations

2. **Gestion Complète des Créneaux**
   - ✅ Création de créneaux personnalisés
   - ✅ Modification (date, horaires, type)
   - ✅ Conversion SOLO ↔ GROUPE
   - ✅ Suppression
   - ✅ Affichage dans le calendrier

3. **Affichage des Dates Corrigé**
   - Format français : "lun. 15 sept. 2026"
   - Pré-remplissage correct lors de la modification

---

## 📅 Gestion des Créneaux

### Accéder à la Gestion des Créneaux

1. Connectez-vous en tant qu'admin
2. Allez sur le **Dashboard Admin**
3. Cliquez sur l'onglet **📅 Créneaux**

### Créer un Nouveau Créneau

1. Cliquez sur **➕ Nouveau Créneau**
2. Remplissez le formulaire :
   - **Date** : Sélectionnez la date (format JJ/MM/AAAA)
   - **Heure de début** : Ex: 14:00
   - **Heure de fin** : Ex: 17:00
   - **Type** :
     - **SOLO** : Créneau individuel (14h-17h par défaut)
     - **GROUPE** : Créneau groupe (10h-17h par défaut)
3. Cliquez sur **Créer**

**Le créneau apparaîtra immédiatement dans :**
- ✅ La liste des créneaux
- ✅ Le calendrier
- ✅ Les statistiques du dashboard

### Modifier un Créneau

1. Dans la liste des créneaux, cliquez sur **✏️ Modifier**
2. La date et les horaires se pré-remplissent automatiquement
3. Modifiez les champs souhaités
4. Cliquez sur **Enregistrer**

**Vous pouvez modifier :**
- La date
- Les horaires (début et fin)
- Le type (SOLO ↔ GROUPE)

### Convertir un Créneau (SOLO ↔ GROUPE)

**Méthode Rapide :**
1. Dans la liste, cliquez sur le bouton de couleur :
   - **🟢 Vert** : Convertir en SOLO (14h-17h)
   - **🟠 Orange** : Convertir en GROUPE (10h-17h)
2. Confirmez la conversion

**Effet de la conversion :**
- **SOLO → GROUPE** : Horaires passent de 14h-17h à 10h-17h
- **GROUPE → SOLO** : Horaires passent de 10h-17h à 14h-17h
- Le statut s'ajuste automatiquement

### Supprimer un Créneau

1. Cliquez sur **🗑️ Supprimer**
2. Confirmez la suppression

**⚠️ Attention :** La suppression est définitive et supprime aussi les réservations associées.

---

## 📊 Comprendre les Statuts

### Statuts SOLO
- **OPEN_SOLO** (Vert) : Disponible pour réservation solo
- **SOLO_CONFIRMED** (Violet) : Réservation solo confirmée

### Statuts GROUPE
- **BLOCKED_FOR_GROUP** (Orange) : Réservé aux pré-inscriptions groupe
- **GROUP_CONFIRMED** (Violet) : Groupe confirmé (3+ participants)
- **OPEN_TUESDAY** (Orange) : Mardi/Jeudi disponible pour groupe

### Codes Couleur dans le Calendrier
- 🟢 **Vert** : Disponible solo
- 🟠 **Orange** : Disponible groupe
- 🟣 **Violet** : Confirmé
- 🔴 **Rouge** : Demandes en attente (admin uniquement)
- ⚫ **Gris** : Complet

---

## 🎯 Cas d'Usage Pratiques

### Créer un Créneau Exceptionnel

**Exemple :** Vous voulez ouvrir un dimanche en solo

1. Allez dans **📅 Créneaux**
2. Cliquez sur **➕ Nouveau Créneau**
3. Sélectionnez le dimanche souhaité
4. Type : **SOLO**
5. Horaires : **14:00 - 17:00**
6. Créez

→ Le créneau apparaîtra dans le calendrier même si c'est un dimanche.

### Bloquer un Jour pour un Groupe

**Exemple :** Un groupe veut réserver un mercredi

1. Créez un créneau pour ce mercredi
2. Type : **GROUPE**
3. Horaires : **10:00 - 17:00**

→ Le créneau sera orange dans le calendrier et disponible pour pré-inscriptions groupe.

### Modifier les Horaires d'un Créneau Existant

**Exemple :** Passer un créneau de 14h-17h à 10h-17h

1. Cliquez sur **✏️ Modifier**
2. Changez **Heure de début** : 10:00
3. Enregistrez

→ Les horaires sont mis à jour partout (liste + calendrier).

---

## 🔄 Workflow Complet

### Gestion d'une Demande Solo

1. **Dashboard** → Carte "En attente" (rouge si demandes)
2. Cliquez sur la carte → Scroll vers les réservations
3. Validez ou refusez la demande
4. Le créneau passe en **SOLO_CONFIRMED** (violet)

### Gestion d'un Groupe

1. **Dashboard** → Carte "Pré-réservations"
2. Vérifiez le nombre de participants
3. Si ≥ 3 participants : Validez le groupe
4. Le créneau passe en **GROUP_CONFIRMED** (violet)

---

## 🛠️ Dépannage

### Le créneau n'apparaît pas dans le calendrier

**Solution :**
1. Attendez 5 minutes (temps de déploiement)
2. Rechargez la page (`Ctrl + Shift + R`)
3. Vérifiez que le créneau est bien dans la liste **📅 Créneaux**

### Erreur lors de la modification

**Solution :**
- Vérifiez que la date est au format correct
- Vérifiez que les horaires sont valides (début < fin)
- Rechargez la page et réessayez

### Les statistiques ne se mettent pas à jour

**Solution :**
- Les stats se rafraîchissent automatiquement toutes les 10 secondes
- Ou rechargez la page

---

## 📱 Navigation Rapide

### Depuis le Dashboard Admin

- **📊 Dashboard** : Vue d'ensemble
- **📅 Créneaux** : Gestion des créneaux
- **👥 Utilisateurs** : Gestion des utilisateurs
- **🎉 Événements** : Gestion des événements
- **📆 Calendrier** : Vue calendrier complète

### Raccourcis Clavier

- `Ctrl + Shift + R` : Recharger sans cache
- `F12` : Ouvrir la console (pour debug)

---

## 🎓 Bonnes Pratiques

### Création de Créneaux

✅ **À FAIRE :**
- Créer des créneaux au moins 1 semaine à l'avance
- Vérifier le calendrier avant de créer
- Utiliser les types appropriés (SOLO pour individuel, GROUPE pour groupe)

❌ **À ÉVITER :**
- Créer des créneaux dans le passé
- Créer des créneaux qui se chevauchent
- Supprimer des créneaux avec des réservations confirmées

### Gestion des Réservations

✅ **À FAIRE :**
- Traiter les demandes dans les 24h
- Confirmer les groupes dès 3 participants
- Communiquer avec les utilisateurs

❌ **À ÉVITER :**
- Laisser des demandes en attente trop longtemps
- Valider un groupe avec moins de 3 participants
- Annuler des confirmations sans raison

---

## 📞 Support

En cas de problème technique :
1. Vérifiez ce guide
2. Rechargez la page
3. Vérifiez la console (F12)
4. Contactez le support technique

---

**Version :** 2.0 - Septembre 2026  
**Dernière mise à jour :** 04/09/2026
