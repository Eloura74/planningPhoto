# 📘 Application de Gestion de Planning Photographe

Application web complète pour la gestion automatisée des inscriptions de formations photographiques (solo et groupe).

## 🏗️ Architecture

### Backend
- **Node.js** avec Express
- **PostgreSQL** pour la base de données
- **JWT** pour l'authentification
- **Nodemailer** pour les notifications email

### Frontend
- **React** avec Vite
- **TailwindCSS** pour le styling
- **React Router** pour la navigation
- **Axios** pour les appels API

## 📋 Fonctionnalités

### Gestion des utilisateurs
- Inscription (élève solo ou membre de groupe)
- Connexion sécurisée avec JWT
- Rôles : ADMIN et STUDENT

### Gestion des créneaux
- Création de créneaux solo (14h-17h, capacité 1)
- Création de créneaux groupe (journée, capacité 3-5)
- Blocage automatique les mardis et jeudis pour le groupe
- Statuts : OPEN_SOLO, BLOCKED_FOR_GROUP, GROUP_PREBOOKING, GROUP_CONFIRMED, FULL, CANCELLED

### Réservations Solo
- Maximum 1 réservation par semaine
- Maximum 4 réservations par mois
- Délai minimum : 1 semaine avant
- Workflow : PENDING → CONFIRMED (par admin)

### Réservations Groupe
- Pré-réservation multiple par les membres du groupe
- Priorité sur les mardis et jeudis
- Validation finale par l'admin
- Libération automatique des créneaux non validés

### Dashboard Admin
- Vue d'ensemble des statistiques
- Validation des séances groupe
- Libération des créneaux pour solo
- Blocage/suppression de créneaux
- Historique des actions

### Calendrier
- Vue mensuelle interactive
- Code couleur par statut :
  - 🟢 Vert : Disponible solo
  - 🔴 Rouge : Réservé groupe
  - 🔵 Bleu : Groupe confirmé
  - 🟡 Jaune : En attente
  - ⚫ Gris : Complet/Réservé

## 🚀 Installation

### Prérequis
- Node.js (v18+)
- PostgreSQL (v14+)
- npm ou yarn

### Configuration de la base de données

1. Créer la base de données PostgreSQL :
```sql
CREATE DATABASE planning_db;
```

2. Configurer les variables d'environnement dans `backend/.env` :
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planning_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
```

### Installation du Backend

```bash
cd backend
npm install
npm run migrate
npm run dev
```

Le backend sera accessible sur `http://localhost:5000`

### Installation du Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

### Configuration Email (Optionnel)

Pour activer les notifications email, configurez les variables dans `backend/.env` :
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
EMAIL_FROM=noreply@planning.com
```

## 📚 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Utilisateurs
- `GET /api/users/me` - Profil utilisateur
- `GET /api/users` - Liste des utilisateurs (admin)
- `PUT /api/users/:id` - Modifier utilisateur (admin)

### Créneaux
- `GET /api/slots` - Liste des créneaux
- `GET /api/slots/:id` - Détail d'un créneau
- `POST /api/slots` - Créer un créneau (admin)
- `PATCH /api/slots/:id` - Modifier un créneau (admin)
- `DELETE /api/slots/:id` - Supprimer un créneau (admin)

### Réservations
- `POST /api/bookings/solo` - Réserver solo
- `POST /api/bookings/group` - Pré-réserver groupe
- `GET /api/bookings/my` - Mes réservations
- `GET /api/bookings/slot/:slotId` - Réservations d'un créneau
- `GET /api/bookings/group/:slotId` - Pré-réservations groupe
- `PATCH /api/bookings/:id/confirm` - Confirmer réservation (admin)
- `DELETE /api/bookings/:id` - Annuler réservation
- `DELETE /api/bookings/group/:slotId` - Annuler pré-réservation groupe

### Admin
- `POST /api/admin/validate-group` - Valider séance groupe
- `POST /api/admin/release-slots` - Libérer créneaux pour solo
- `POST /api/admin/block-slot` - Bloquer un créneau
- `POST /api/admin/availability` - Définir disponibilité
- `GET /api/admin/availability` - Get disponibilités
- `GET /api/admin/history` - Historique des actions
- `GET /api/admin/dashboard` - Statistiques dashboard

## 🎯 Règles Métier

### Priorité Groupe
- Les mardis et jeudis sont réservés au groupe
- Les créneaux sont bloqués pour les solos tant que non validés
- Après validation admin, les créneaux non retenus sont libérés pour les solos

### Contraintes Solo
- 1 réservation maximum par semaine
- 4 réservations maximum par mois
- Réservation minimum 1 semaine à l'avance

### Cycle Mensuel
1. Admin définit ses disponibilités
2. Mardis/jeudis → réservés au groupe
3. Élèves groupe → pré-réservation
4. Admin → valide certaines dates
5. Autres dates → libérées pour solo

## 🔐 Sécurité

- Mot de passe hashé avec bcryptjs
- Tokens JWT avec expiration
- Middleware d'authentification
- Protection des routes admin
- Validation des entrées

## 📝 Structure du Projet

```
PlanningFabien/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── index.js
│   │   │   └── migrate.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── slots/
│   │   │   ├── bookings/
│   │   │   ├── admin/
│   │   │   ├── notifications/
│   │   │   └── common/
│   │   └── index.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Calendar.jsx
│   │   │   └── BookingModal.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## 🧪 Tests

Pour tester l'application :

1. Créer un compte admin via l'API ou directement en base de données
2. Créer des créneaux via le dashboard admin
3. Tester les réservations solo avec les contraintes
4. Tester les pré-réservations groupe
5. Valider les séances groupe et vérifier la libération des créneaux

## 📧 Notifications

L'application envoie des emails pour :
- Création de compte
- Réservation solo
- Validation admin
- Annulation
- Modification de créneau

## 🚧 Améliorations Futures (V2)

- Intégration paiement
- Multi-formateur
- Multi-groupe
- Intégration WhatsApp
- IA avancée de planification
- Notifications SMS
- Calendrier synchronisation (Google Calendar, Outlook)

## 📄 Licence

ISC

## 👤 Auteur

Cognition AI - Généré via Windsurf /master workflow
