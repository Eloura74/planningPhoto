# 🚀 Guide de Démarrage Rapide

## Étape 1: Configuration de PostgreSQL

### Option A: Docker (Recommandé pour le développement)

```bash
docker run --name planning-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=planning_db -p 5432:5432 -d postgres:14
```

### Option B: Installation locale

1. Installer PostgreSQL depuis https://www.postgresql.org/download/
2. Créer la base de données :
```sql
CREATE DATABASE planning_db;
```

## Étape 2: Configuration Backend

1. Naviguer vers le dossier backend :
```bash
cd backend
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer le fichier `.env` (déjà créé avec des valeurs par défaut)

4. Exécuter les migrations :
```bash
npm run migrate
```

5. Démarrer le serveur backend :
```bash
npm run dev
```

Le backend sera accessible sur `http://localhost:5000`

## Étape 3: Configuration Frontend

1. Naviguer vers le dossier frontend (nouveau terminal) :
```bash
cd frontend
```

2. Installer les dépendances :
```bash
npm install
```

3. Démarrer le serveur de développement :
```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

## Étape 4: Créer un compte Admin

### Via API (curl) :

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com",
    "phone": "0123456789",
    "password": "admin123",
    "role": "ADMIN",
    "isGroupMember": false
  }'
```

### Via Base de Données :

```sql
INSERT INTO users (name, email, phone, role, is_group_member, password_hash)
VALUES (
  'Admin',
  'admin@example.com',
  '0123456789',
  'ADMIN',
  false,
  '$2a$10$YourHashedPasswordHere'
);
```

## Étape 5: Tester l'Application

### Test 1: Connexion Admin

1. Aller sur `http://localhost:3000/login`
2. Se connecter avec : admin@example.com / admin123
3. Vérifier l'accès au dashboard admin via le bouton "Admin"

### Test 2: Création de Créneaux

1. Dans le dashboard admin, utiliser l'API pour créer des créneaux :
```bash
curl -X POST http://localhost:5000/api/slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2024-02-06",
    "startTime": "14:00",
    "endTime": "17:00",
    "type": "SOLO",
    "capacityMin": 1,
    "capacityMax": 1
  }'
```

### Test 3: Inscription Élève

1. Se déconnecter
2. S'inscrire comme élève sur `http://localhost:3000/register`
3. Cocher "Membre du groupe" si nécessaire

### Test 4: Réservation Solo

1. Se connecter comme élève
2. Aller sur le calendrier
3. Cliquer sur un créneau vert (disponible solo)
4. Réserver
5. Vérifier que le statut passe à "En attente"

### Test 5: Réservation Groupe

1. Créer un créneau groupe pour un mardi ou jeudi :
```bash
curl -X POST http://localhost:5000/api/slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2024-02-06",
    "startTime": "10:00",
    "endTime": "18:00",
    "type": "GROUP",
    "capacityMin": 3,
    "capacityMax": 5
  }'
```

2. Se connecter comme membre de groupe
3. Pré-réserver le créneau
4. Vérifier que le créneau est bloqué pour les solos

### Test 6: Validation Admin

1. Se connecter comme admin
2. Aller sur le dashboard admin
3. Valider une séance groupe
4. Vérifier que les créneaux non validés sont libérés

## 🔧 Dépannage

### Erreur de connexion PostgreSQL

- Vérifier que PostgreSQL est en cours d'exécution
- Vérifier les identifiants dans `backend/.env`
- Vérifier que la base de données `planning_db` existe

### Erreur de migration

- Supprimer et recréer la base de données
- Réexécuter `npm run migrate`

### Erreur CORS

- Vérifier que le backend est en cours d'exécution sur le port 5000
- Vérifier que le frontend est en cours d'exécution sur le port 3000

### Erreur d'authentification

- Vérifier que le token JWT est correctement stocké dans localStorage
- Vérifier que le secret JWT dans `.env` est cohérent

## 📊 Scripts de Test

### Script de création de données de test

Créer un fichier `backend/scripts/seed.js` :

```javascript
const pool = require('../src/database');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await pool.query('INSERT INTO users (name, email, phone, role, is_group_member, password_hash) VALUES ($1, $2, $3, $4, $5, $6)', 
    ['Admin', 'admin@example.com', '0123456789', 'ADMIN', false, passwordHash]);
  
  await pool.query('INSERT INTO users (name, email, phone, role, is_group_member, password_hash) VALUES ($1, $2, $3, $4, $5, $6)', 
    ['Élève Solo', 'solo@example.com', '0123456788', 'STUDENT', false, passwordHash]);
  
  await pool.query('INSERT INTO users (name, email, phone, role, is_group_member, password_hash) VALUES ($1, $2, $3, $4, $5, $6)', 
    ['Élève Groupe', 'groupe@example.com', '0123456787', 'STUDENT', true, passwordHash]);
  
  console.log('Seed completed');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
```

Exécuter avec :
```bash
node backend/scripts/seed.js
```

## ✅ Checklist de Validation

- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Migration de la base de données réussie
- [ ] Connexion admin fonctionnelle
- [ ] Création de créneaux fonctionnelle
- [ ] Inscription élève fonctionnelle
- [ ] Réservation solo fonctionnelle
- [ ] Pré-réservation groupe fonctionnelle
- [ ] Validation admin fonctionnelle
- [ ] Libération des créneaux fonctionnelle
- [ ] Annulation de réservation fonctionnelle
