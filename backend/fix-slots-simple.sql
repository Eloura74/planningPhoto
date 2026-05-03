-- Supprimer tous les slots non confirmés de mai 2026
DELETE FROM slots 
WHERE date >= '2026-05-01' 
AND date <= '2026-05-31'
AND status NOT IN ('SOLO_CONFIRMED', 'GROUP_CONFIRMED');

-- Créer les créneaux GROUPE pour les mardis
INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max)
VALUES 
  (gen_random_uuid(), '2026-05-06', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5),
  (gen_random_uuid(), '2026-05-13', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5),
  (gen_random_uuid(), '2026-05-20', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5),
  (gen_random_uuid(), '2026-05-27', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5)
ON CONFLICT DO NOTHING;

-- Créer les créneaux GROUPE pour les jeudis
INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max)
VALUES 
  (gen_random_uuid(), '2026-05-01', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5),
  (gen_random_uuid(), '2026-05-08', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5),
  (gen_random_uuid(), '2026-05-15', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5),
  (gen_random_uuid(), '2026-05-22', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5),
  (gen_random_uuid(), '2026-05-29', '09:00', '17:00', 'MIXED', 'OPEN_TUESDAY', 3, 5)
ON CONFLICT DO NOTHING;

-- Afficher le résultat
SELECT date, start_time, type, status 
FROM slots 
WHERE date >= '2026-05-01' AND date <= '2026-05-31'
ORDER BY date;
