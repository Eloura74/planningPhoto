# 🚀 Guide de Déploiement Complet

## Architecture de déploiement

- **Frontend** : Vercel (React + Vite)
- **Backend** : Render (Express + SQLite)

---

## 📦 ÉTAPE 1 : Déployer le Backend sur Render

### 1.1 Créer un compte Render
1. Allez sur https://render.com
2. Créez un compte gratuit (avec GitHub)

### 1.2 Créer un nouveau Web Service
1. Cliquez sur **"New +"** → **"Web Service"**
2. Connectez votre repository GitHub `planningPhoto`
3. Configurez :
   - **Name** : `planning-backend`
   - **Region** : Frankfurt (EU)
   - **Branch** : `main`
   - **Root Directory** : `backend`
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `node src/index.js`
   - **Instance Type** : Free

### 1.3 Ajouter les variables d'environnement
Dans la section **Environment** de Render, ajoutez :

```
PORT=5000
JWT_SECRET=votre-secret-production-aleatoire-123456
NODE_ENV=production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=faber.quentin@gmail.com
EMAIL_PASS=votre-mot-de-passe-app-gmail
EMAIL_FROM=noreply@planning.com
```

### 1.4 Déployer
1. Cliquez sur **"Create Web Service"**
2. Attendez 2-3 minutes que le déploiement se termine
3. **Copiez l'URL** fournie (ex: `https://planning-backend.onrender.com`)

---

## 🌐 ÉTAPE 2 : Déployer le Frontend sur Vercel

### 2.1 Configurer le projet Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet `planningPhoto`
3. Allez dans **Settings** → **General**
4. Configurez :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

### 2.2 Ajouter les variables d'environnement

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez :
   - **Name** : `VITE_API_URL`
   - **Value** : `https://planning-backend.onrender.com/api` (remplacez par votre URL Render)
   - Cochez : **Production**, **Preview**, **Development**
3. Cliquez sur **Save**

### 2.3 Redéployer

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Cliquez sur **Redeploy**
4. Attendez 1-2 minutes

---

## ✅ ÉTAPE 3 : Vérifier le déploiement

### 3.1 Tester le Backend
Ouvrez dans votre navigateur :
```
https://planning-backend.onrender.com/api/auth/login
```
Vous devriez voir une erreur JSON (c'est normal, c'est un POST endpoint).

### 3.2 Tester le Frontend
1. Ouvrez votre URL Vercel (ex: `https://planning-photo.vercel.app`)
2. Essayez de vous connecter avec :
   - **Email** : `fabien.licata@gmail.com`
   - **Mot de passe** : `admin1412`

---

## 🔧 Configuration locale pour développement

### Backend local
```bash
cd backend
npm install
npm run dev
```
Le backend sera sur `http://localhost:5000`

### Frontend local
Créez `frontend/.env` :
```env
VITE_API_URL=http://localhost:5000/api
```

Puis lancez :
```bash
cd frontend
npm install
npm run dev
```
Le frontend sera sur `http://localhost:5173`

---

## 🐛 Résolution de problèmes

### Le backend ne démarre pas sur Render
- Vérifiez les logs dans Render Dashboard
- Assurez-vous que `JWT_SECRET` est défini
- Vérifiez que le Start Command est `node src/index.js`

### Le frontend ne se connecte pas au backend
- Vérifiez que `VITE_API_URL` est correctement configuré dans Vercel
- Vérifiez que l'URL se termine par `/api` (sans slash final)
- Ouvrez la console du navigateur pour voir les erreurs

### Erreur CORS
Le backend accepte toutes les origines (`cors()`). Si problème, vérifiez les logs.

### Base de données réinitialisée sur Render
⚠️ **Important** : Render Free Tier utilise un système de fichiers éphémère.
La base SQLite sera **réinitialisée** à chaque redéploiement.

**Solutions** :
1. Utiliser une base PostgreSQL persistante (Neon, Supabase)
2. Passer au plan payant Render avec disque persistant

---

## 📱 Accès à l'application

- **Frontend** : `https://votre-projet.vercel.app`
- **Backend API** : `https://planning-backend.onrender.com/api`
- **Admin** : `fabien.licata@gmail.com` / `admin1412`

---

## 🔄 Mises à jour

Pour déployer des modifications :

1. **Commitez et pushez** sur GitHub :
   ```bash
   git add .
   git commit -m "Votre message"
   git push
   ```

2. **Render** : Se redéploie automatiquement
3. **Vercel** : Se redéploie automatiquement

---

## 📊 Monitoring

- **Render** : Logs en temps réel dans le Dashboard
- **Vercel** : Analytics et logs dans le Dashboard
