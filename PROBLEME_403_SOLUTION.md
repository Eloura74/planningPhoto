# 🔧 Solution pour l'erreur 403 (Forbidden)

## Problème

Après un redéploiement avec `DROP TABLE CASCADE`, tous les utilisateurs sont supprimés de la base de données. Les tokens JWT stockés dans le navigateur deviennent invalides.

## Symptômes

- Erreur 403 lors de l'accès aux pages
- Message "Forbidden" dans la console
- Impossible de charger les créneaux ou réservations

## Solution

### Pour les utilisateurs

1. **Se déconnecter** complètement de l'application
2. **Vider le cache du navigateur** (Ctrl+Shift+Del)
3. **Se réinscrire** sur `/register`
4. **Se connecter** avec les nouveaux identifiants

### Pour l'admin

1. **Se déconnecter**
2. **Vider le cache**
3. L'admin par défaut est recréé automatiquement :
   - Email: `fabien.licata@gmail.com`
   - Mot de passe: `admin1412`
4. **Se connecter** avec ces identifiants

### Recréer les utilisateurs

L'admin doit recréer tous les utilisateurs via `/admin/users` ou les utilisateurs doivent s'inscrire eux-mêmes.

## Prévention future

Pour éviter ce problème, utiliser des migrations sans `DROP TABLE CASCADE` en production.
