# 📖 Guide d'utilisation Rapide

## 🚀 Première mise en place

### 1. Créer l'administrateur par défaut

```bash
cd backend
npm run seed
```

Cela crée un compte admin avec :
- **Email** : admin@example.com
- **Mot de passe** : admin123

### 2. Se connecter en tant qu'administrateur

1. Ouvrez l'application : http://localhost:3000
2. Cliquez sur "Se connecter"
3. Entrez : admin@example.com / admin123
4. Vous verrez le bouton "Admin" apparaître dans la barre de navigation

## 👤 Créer un client (élève)

### Via l'interface admin

1. Connectez-vous en tant qu'admin
2. Cliquez sur le bouton **"Utilisateurs"** (bouton violet)
3. Cliquez sur **"+ Créer un utilisateur"**
4. Remplissez le formulaire :
   - **Nom** : Nom de l'élève
   - **Email** : Email de l'élève
   - **Téléphone** : (optionnel)
   - **Mot de passe** : Mot de passe temporaire
   - **Rôle** : Élève (par défaut)
   - **Membre du groupe** : Cochez si l'élève fait partie du groupe
5. Cliquez sur "Créer"

### Via l'inscription (auto-inscription)

Les élèves peuvent aussi s'inscrire eux-mêmes :
1. Cliquez sur "S'inscrire" sur la page de connexion
2. Remplissez le formulaire
3. Cochez "Membre du groupe" si applicable

## 📅 Synchroniser les disponibilités (créer des créneaux)

### Créer un créneau manuellement

1. Connectez-vous en tant qu'admin
2. Allez sur le **Dashboard Admin**
3. Cliquez sur **"+ Créer un créneau"**
4. Remplissez le formulaire :
   - **Date** : Sélectionnez la date
   - **Type** : Solo ou Groupe
   - **Heure début/fin** : Selon le type
     - Solo : 14h00 - 17h00 (recommandé)
     - Groupe : 10h00 - 18h00 (recommandé)
   - **Capacité** (pour groupe uniquement) :
     - Min : 3
     - Max : 5
5. Cliquez sur "Créer"

### Comportement automatique

- **Mardi/Jeudi** : Si type = Groupe, le créneau sera automatiquement bloqué pour les solos
- **Autres jours** : Les créneaux sont ouverts aux solos par défaut

## 🔄 Processus mensuel type

### Pour le groupe

1. **Créer les créneaux groupe** pour le mois (mardis et jeudis)
   - Ces créneaux seront en statut "BLOCKED_FOR_GROUP"
   
2. **Les élèves du groupe** se pré-réservent
   - Ils accèdent au calendrier
   - Sélectionnent plusieurs dates préférées
   - Leurs choix sont privés

3. **L'admin valide**
   - Dans le Dashboard Admin, section "Gestion des créneaux groupe"
   - Voit les pré-réservations de chaque créneau
   - Sélectionne les créneaux à valider
   - Clique sur "Valider"
   
4. **Libération automatique**
   - Les créneaux validés passent en "GROUP_CONFIRMED"
   - Les créneaux non validés sont libérés pour les solos

### Pour les solos

1. **Créer les créneaux solo** (jours autres que mardi/jeudi)
   - Ou attendre la libération après validation groupe
   
2. **Les élèves solos réservent**
   - 1 réservation max par semaine
   - 4 réservations max par mois
   - Minimum 1 semaine à l'avance
   
3. **L'admin confirme**
   - Les résérations sont en attente (PENDING)
   - L'admin peut confirmer ou annuler

## 🎨 Légende du calendrier

- 🟢 **Vert** : Disponible solo
- 🔴 **Rouge** : Réservé groupe (bloqué pour solo)
- 🔵 **Bleu** : Groupe confirmé
- 🟡 **Jaune** : En attente de validation
- ⚫ **Gris** : Complet/Réservé

## ⚙️ Actions disponibles

### En tant qu'admin

- **Créer des créneaux** : Définir les disponibilités
- **Valider groupe** : Confirmer les séances groupe
- **Libérer créneaux** : Rendre les créneaux disponibles pour solo
- **Bloquer créneaux** : Supprimer/annuler un créneau
- **Gérer utilisateurs** : Créer/modifier des comptes élèves
- **Voir historique** : Consulter les actions passées

### En tant qu'élève

- **Voir calendrier** : Consulter les disponibilités
- **Réserver solo** : Réserver un créneau solo
- **Pré-réserver groupe** : Indiquer ses préférences (membres groupe)
- **Annuler** : Annuler ses réservations
- **Voir profil** : Consulter ses informations

## 🔧 Dépannage

### Problème : Pas de bouton "Admin"

**Solution** : Vérifiez que vous êtes connecté avec le compte admin (admin@example.com)

### Problème : Impossible de créer un créneau

**Solution** : Vérifiez que vous êtes sur le Dashboard Admin et non sur le calendrier élève

### Problème : Les élèves ne peuvent pas réserver

**Solution** : 
- Vérifiez que le créneau est en statut "OPEN_SOLO"
- Pour les mardis/jeudis, validez d'abord les créneaux groupe

### Problème : Le script seed ne fonctionne pas

**Solution** : Assurez-vous que PostgreSQL est en cours d'exécution et que la base de données existe

## 📞 Support

Pour toute question ou problème, consultez :
- README.md pour l'installation
- SETUP_GUIDE.md pour la configuration
- CAHIER_DES_CHARGES.md pour les spécifications
