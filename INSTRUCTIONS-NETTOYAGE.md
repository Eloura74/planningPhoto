# NETTOYAGE DES SLOTS DE MAI 2026

## Problème
Certains slots de mai existent dans la base de données avec le mauvais type (SOLO au lieu de GROUPE pour les mardis/jeudis).

## Solution
Supprimer TOUS les slots de mai pour que le système les recrée automatiquement avec les bons types.

## Instructions

### Option 1 : Via Render Dashboard (RECOMMANDÉ)

1. Allez sur **Render Dashboard**
2. Cliquez sur votre base de données PostgreSQL
3. Cliquez sur **"Shell"** (onglet en haut)
4. Copiez-collez les commandes suivantes **UNE PAR UNE** :

```sql
-- 1. Supprimer les pré-réservations groupe de mai
DELETE FROM group_prebookings 
WHERE slot_id IN (
  SELECT id FROM slots WHERE date >= '2026-05-01' AND date <= '2026-05-31'
);

-- 2. Supprimer les bookings de mai
DELETE FROM bookings 
WHERE slot_id IN (
  SELECT id FROM slots WHERE date >= '2026-05-01' AND date <= '2026-05-31'
);

-- 3. Supprimer tous les slots de mai
DELETE FROM slots 
WHERE date >= '2026-05-01' AND date <= '2026-05-31';

-- 4. Vérifier qu'il ne reste rien
SELECT COUNT(*) as remaining_slots FROM slots 
WHERE date >= '2026-05-01' AND date <= '2026-05-31';
```

5. La dernière commande doit afficher `0`
6. Rechargez le calendrier (Ctrl+Shift+R)
7. Le système va automatiquement créer les bons slots :
   - **Mardis/Jeudis** = ROUGE (groupe)
   - **Autres jours** = VERT (solo)

### Option 2 : Via psql (si vous avez accès)

```bash
psql <DATABASE_URL>
```

Puis exécutez les mêmes commandes SQL ci-dessus.

## Résultat attendu

Après le nettoyage et le rechargement du calendrier, vous devriez voir :

**ROUGE (Groupe) :**
- 1 mai (jeudi)
- 6 mai (mardi)
- 8 mai (jeudi)
- 13 mai (mardi)
- 15 mai (jeudi)
- 20 mai (mardi)
- 22 mai (jeudi)
- 27 mai (mardi)
- 29 mai (jeudi)

**VERT (Solo) :**
- Tous les autres jours (lundi, mercredi, vendredi, samedi)

## IMPORTANT

⚠️ Cette opération va supprimer TOUTES les réservations de mai 2026.
Si vous avez des réservations importantes, notez-les avant de continuer.
