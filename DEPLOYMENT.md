# Guide de Déploiement

## Architecture
Ce projet est composé de :
- **Frontend** : React + Vite (déployé sur Vercel)
- **Backend** : Express + SQLite (déployé sur Render ou autre service)

## Déploiement du Frontend sur Vercel

### 1. Configuration du Root Directory
1. Allez dans votre projet Vercel
2. Cliquez sur **Settings** → **General**
3. Modifiez **Root Directory** de `./` à `frontend`
4. Cliquez sur **Save**

### 2. Configuration des Variables d'Environnement
1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez la variable suivante :
   - **Key**: `VITE_API_URL`
   - **Value**: URL de votre backend déployé (ex: `https://votre-backend.onrender.com/api`)
3. Sélectionnez **Production**, **Preview**, et **Development**
4. Cliquez sur **Save**

### 3. Relancer le déploiement
1. Allez dans l'onglet **Deployments**
2. Cliquez sur **Redeploy** pour relancer le déploiement avec les nouvelles configurations

## Déploiement du Backend sur Render

### 1. Créer un compte sur Render
- Allez sur https://render.com et créez un compte gratuit

### 2. Créer un nouveau Web Service
1. Cliquez sur **New** → **Web Service**
2. Connectez votre compte GitHub
3. Sélectionnez le repository `planningPhoto`
4. Configurez les paramètres :
   - **Name**: planning-backend (ou autre nom)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Instance Type**: Free

### 3. Configuration des Variables d'Environnement
Ajoutez les variables suivantes dans la section **Environment Variables** :
```
PORT=5000
JWT_SECRET=votre-secret-key-production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-app-password
EMAIL_FROM=noreply@planning.com
```

### 4. Déployer
Cliquez sur **Create Web Service** pour lancer le déploiement.

### 5. Récupérer l'URL du backend
Une fois le déploiement terminé, Render vous fournira une URL comme :
`https://planning-backend.onrender.com`

## Configuration finale

### 1. Mettre à jour Vercel
1. Allez dans votre projet Vercel
2. **Settings** → **Environment Variables**
3. Modifiez `VITE_API_URL` avec l'URL de votre backend Render :
   ```
   VITE_API_URL=https://planning-backend.onrender.com/api
   ```
4. Relancez le déploiement

### 2. Vérifier le CORS
Assurez-vous que le backend accepte les requêtes depuis votre domaine Vercel. Vérifiez le fichier `backend/src/index.js` pour la configuration CORS.

## Développement Local

Pour le développement local, créez un fichier `frontend/.env` :
```
VITE_API_URL=http://localhost:5000/api
```

Lancez le backend :
```bash
cd backend
npm install
node src/index.js
```

Lancez le frontend :
```bash
cd frontend
npm install
npm run dev
```

## Résolution des problèmes courants

### Erreur 404 sur les appels API
- Vérifiez que `VITE_API_URL` est correctement configurée dans Vercel
- Vérifiez que le backend est déployé et accessible
- Vérifiez les logs du backend pour voir les erreurs

### Erreur CORS
- Vérifiez la configuration CORS dans `backend/src/index.js`
- Assurez-vous que l'origine de Vercel est autorisée

### Erreur de connexion à la base de données
- Render utilise un système de fichiers éphémère, donc SQLite sera réinitialisé à chaque déploiement
- Pour la production, envisagez d'utiliser une base de données persistante (PostgreSQL, MySQL)
