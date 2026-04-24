# 📘 CAHIER DES CHARGES — APPLICATION DE GESTION DE PLANNING PHOTOGRAPHE

## 1. Contexte & Objectif

### 1.1 Contexte
Le client est un **photographe formateur indépendant** proposant :
- Des formations **individuelles (solo)**
- Des formations **collectives (groupe unique)**

La gestion actuelle via Excel + WhatsApp est devenue :
- Chronophage
- Difficile à maintenir
- Source d'erreurs

### 1.2 Objectif
Créer une application web permettant :
- La gestion automatisée des inscriptions
- La priorisation du groupe sur certains jours
- La réservation autonome des élèves
- La gestion dynamique des disponibilités du formateur

## 2. Périmètre Fonctionnel

### Inclus (MVP)
- Gestion utilisateurs (admin + élèves)
- Gestion des créneaux
- Réservations solo
- Pré-réservations groupe
- Validation admin
- Gestion des indisponibilités
- Notifications email
- Historique des actions
- Vue calendrier

### Hors périmètre (V1)
- Paiement
- Multi-formateur
- Multi-groupe
- Intégration WhatsApp
- IA avancée de planification

## 3. Acteurs & Rôles

| Rôle | Description | Droits |
|------|-------------|--------|
| Admin | Formateur | Full accès |
| Élève Solo | Utilisateur individuel | Réserver / annuler |
| Élève Groupe | Membre du groupe | Pré-réserver + réserver solo |

## 4. Règles Métier

### 4.1 Types de Séances
| Type | Durée | Capacité |
|------|-------|----------|
| Solo | 14h–17h | 1 |
| Groupe | Journée (10h+) | min 3 / max 5 |

### 4.2 Priorité Groupe
- Le groupe est prioritaire **UNIQUEMENT les mardis et jeudis**
- Tant que non validé :
  - Créneaux **bloqués pour les solos**
- Après validation :
  - Créneaux non retenus → ouverts aux solos

### 4.3 Cycle Mensuel
1. Admin définit ses disponibilités
2. Mardis/jeudis → réservés au groupe
3. Élèves groupe → pré-réservation
4. Admin → valide certaines dates
5. Autres dates → libérées

### 4.4 Réservations

#### Solo
- Max : 1 / semaine
- Max : 4 / mois
- Délai : 1 semaine avant
- Statut : **PENDING → CONFIRMED (admin)**

#### Groupe
- Pré-réservation multiple
- Modification autorisée jusqu'à 1 semaine avant
- Validation finale par admin

### 4.5 Annulations
| Cas | Comportement |
|-----|--------------|
| Solo annule | Créneau redevient disponible |
| Groupe annule (1 élève) | Séance maintenue |
| Admin annule | Notification + reproposition |

### 4.6 Indisponibilités
- Admin peut :
  - Bloquer des dates
  - Supprimer des créneaux
- Impact :
  - Notification obligatoire
  - Gestion manuelle du remplacement

## 5. Modèle de Données (SQL)

```sql
-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT CHECK (role IN ('ADMIN', 'STUDENT')),
    is_group_member BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

-- SLOTS
CREATE TABLE slots (
    id UUID PRIMARY KEY,
    date DATE,
    start_time TIME,
    end_time TIME,
    type TEXT CHECK (type IN ('SOLO', 'GROUP')),
    status TEXT CHECK (
        status IN (
            'BLOCKED_FOR_GROUP',
            'GROUP_PREBOOKING',
            'GROUP_CONFIRMED',
            'OPEN_SOLO',
            'FULL',
            'CANCELLED'
        )
    ),
    capacity_min INT,
    capacity_max INT,
    created_at TIMESTAMP
);

-- BOOKINGS
CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    slot_id UUID REFERENCES slots(id),
    status TEXT CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMP
);

-- GROUP PREBOOKING
CREATE TABLE group_prebookings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    slot_id UUID REFERENCES slots(id),
    created_at TIMESTAMP
);

-- AVAILABILITY
CREATE TABLE availability (
    id UUID PRIMARY KEY,
    date DATE,
    is_available BOOLEAN
);

-- HISTORY
CREATE TABLE history (
    id UUID PRIMARY KEY,
    entity TEXT,
    entity_id UUID,
    action TEXT,
    payload JSONB,
    created_at TIMESTAMP
);
```

## 6. API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
```

### Slots
```
GET /api/slots
POST /api/slots
PATCH /api/slots/:id
DELETE /api/slots/:id
```

### Booking
```
POST /api/bookings/solo
POST /api/bookings/group
PATCH /api/bookings/:id
DELETE /api/bookings/:id
```

### Admin
```
POST /api/admin/validate-group
POST /api/admin/release-slots
POST /api/admin/block-slot
```

## 7. Logique Métier (Pseudo-code)

### Blocage Groupe
```
IF day IN (Tuesday, Thursday)
AND slot.status != GROUP_CONFIRMED
THEN slot = BLOCKED_FOR_GROUP
```

### Réservation Solo
```
IF slot.status != OPEN_SOLO
    REJECT

IF user.weekly_bookings >= 1
    REJECT

CREATE booking PENDING
```

### Validation Admin
```
ADMIN selects slots
→ status = GROUP_CONFIRMED

OTHER slots
→ status = OPEN_SOLO
```

## 8. Interface (Frontend)

### Écrans

#### 1. Dashboard Admin
- Calendrier global
- Liste des pré-réservations
- Actions :
  - Valider groupe
  - Modifier
  - Supprimer

#### 2. Calendrier Élève
- Vue mensuelle
- Couleurs :
  - Rouge = bloqué
  - Vert = dispo
  - Bleu = réservé
  - Jaune = pending

#### 3. Réservation
- Bouton réserver
- Statut affiché

#### 4. Profil
- Infos utilisateur

## 9. Notifications Email

**Triggers :**
- Création de compte
- Réservation solo
- Validation admin
- Annulation
- Modification
- Suppression créneau

## 10. Architecture Recommandée

### Backend
- Node.js (Express) OU FastAPI
- PostgreSQL

### Frontend
- React + Tailwind

### Structure
```
/backend
  /modules
    auth
    users
    slots
    bookings
    admin
    notifications

/frontend
  /pages
  /components
  /services
```

## 11. Plan de Développement

### Phase 1
- Auth
- DB
- CRUD slots

### Phase 2
- Réservation solo
- Règles basiques

### Phase 3
- Groupe + prébooking

### Phase 4
- Admin validation

### Phase 5
- Notifications

## 12. Prompts pour Agents IA

### Génération Backend
```
Generate a modular Node.js Express backend with PostgreSQL using the following entities:
Users, Slots, Bookings, GroupPrebookings, Availability, History.

Implement business rules:
- group priority Tuesday/Thursday
- solo booking constraints
- admin validation workflow

Use clean architecture and services layer.
```

### Génération Frontend
```
Create a React + Tailwind app with:
- calendar view
- slot booking UI
- admin dashboard
- status color system
- API integration

Focus on UX clarity for booking states.
```

## 13. Conclusion

Ce projet est :
- Complexe côté logique métier
- Simple côté UI si bien structuré

**La clé de réussite :**
👉 Isoler le moteur de règles
👉 Structurer les états
👉 Garder le contrôle admin
