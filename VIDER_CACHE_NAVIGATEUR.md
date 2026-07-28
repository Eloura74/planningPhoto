# 🔄 Vider le Cache du Navigateur

**Problème**: Les modifications ne s'affichent pas malgré le déploiement

---

## ⚡ SOLUTION RAPIDE

### Sur Chrome/Edge (Windows)

**Méthode 1: Rechargement forcé**
```
Ctrl + Shift + R
```
ou
```
Ctrl + F5
```

**Méthode 2: Vider le cache**
1. Appuyer sur `F12` (ouvrir DevTools)
2. Clic droit sur le bouton **Actualiser** 🔄
3. Choisir **"Vider le cache et actualiser de manière forcée"**

**Méthode 3: Paramètres**
1. `Ctrl + Shift + Delete`
2. Cocher **"Images et fichiers en cache"**
3. Période: **Dernière heure**
4. Cliquer **"Effacer les données"**

---

## 🎯 Vérifier que ça Marche

Après avoir vidé le cache:

1. Recharger la page: `Ctrl + Shift + R`
2. Aller sur le calendrier admin
3. Le slot du **2 septembre 14:00** doit être **DORÉ** (pas gris)

---

## 🔧 Si Ça Ne Marche Toujours Pas

### Vérifier la Version Déployée

1. Aller sur **Vercel.com**
2. Votre projet > **Deployments**
3. Vérifier que le dernier déploiement est **"Ready"**
4. Cliquer dessus
5. Vérifier le commit: "Fix: Calendar legend colors..."

### Forcer le Redéploiement

Si le cache persiste:
```bash
git commit --allow-empty -m "Force redeploy"
git push
```

---

**Créé le 28/07/2026**
