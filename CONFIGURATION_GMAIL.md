# 📧 Configuration Gmail pour l'envoi d'emails

## Étapes pour configurer Gmail

### 1. Activer la validation en 2 étapes
1. Allez sur https://myaccount.google.com/security
2. Activez la **validation en 2 étapes**

### 2. Créer un mot de passe d'application
1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez **"Autre (nom personnalisé)"**
3. Entrez **"Planning Photo"**
4. Cliquez sur **"Générer"**
5. **Copiez le mot de passe généré** (16 caractères sans espaces)

### 3. Configurer les variables d'environnement sur Render

1. Allez sur **Render → planningPhoto → Environment**
2. Ajoutez ces 2 variables :

```
GMAIL_USER=votre-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**⚠️ IMPORTANT :**
- Utilisez le **mot de passe d'application**, PAS votre mot de passe Gmail normal
- Supprimez les espaces du mot de passe d'application (16 caractères collés)

### 4. Redémarrer le service

Après avoir ajouté les variables, Render redémarrera automatiquement le backend.

## Test

Une fois configuré, les emails seront envoyés automatiquement :
- ✅ Confirmation de réservation SOLO
- ✅ Confirmation de réservation GROUPE
- ✅ Confirmation d'événement

## Dépannage

Si les emails ne partent pas :
1. Vérifiez les logs Render pour voir les erreurs
2. Vérifiez que le mot de passe d'application est correct
3. Vérifiez que la validation en 2 étapes est activée
