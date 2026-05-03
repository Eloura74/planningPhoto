-- Supprimer TOUS les slots de mai 2026 (même confirmés)
-- ATTENTION : Cela va supprimer toutes les réservations de mai !

DELETE FROM group_prebookings 
WHERE slot_id IN (
  SELECT id FROM slots WHERE date >= '2026-05-01' AND date <= '2026-05-31'
);

DELETE FROM bookings 
WHERE slot_id IN (
  SELECT id FROM slots WHERE date >= '2026-05-01' AND date <= '2026-05-31'
);

DELETE FROM slots 
WHERE date >= '2026-05-01' AND date <= '2026-05-31';

-- Vérifier qu'il ne reste rien
SELECT COUNT(*) as remaining_slots FROM slots WHERE date >= '2026-05-01' AND date <= '2026-05-31';
