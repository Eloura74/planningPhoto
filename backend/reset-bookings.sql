-- Script pour nettoyer toutes les réservations et événements
-- À exécuter dans la console PostgreSQL de Render

-- Supprimer toutes les réservations
DELETE FROM bookings;

-- Supprimer toutes les pré-réservations groupe
DELETE FROM group_prebookings;

-- Supprimer toutes les disponibilités d'événements (votes)
DELETE FROM event_availabilities;

-- Supprimer tous les événements
DELETE FROM events;

-- Supprimer tous les créneaux (slots)
DELETE FROM slots;

-- Supprimer l'historique
DELETE FROM history;

-- Vérification
SELECT 'Bookings restants:' as info, COUNT(*) as count FROM bookings
UNION ALL
SELECT 'Group prebookings restants:', COUNT(*) FROM group_prebookings
UNION ALL
SELECT 'Event availabilities restants:', COUNT(*) FROM event_availabilities
UNION ALL
SELECT 'Events restants:', COUNT(*) FROM events
UNION ALL
SELECT 'Slots restants:', COUNT(*) FROM slots
UNION ALL
SELECT 'History restants:', COUNT(*) FROM history;
