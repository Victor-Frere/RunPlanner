# 🏃 RunPlanner Pro

Application web interactive de gestion et de suivi de plan d'entraînement basée sur votre fichier [`planning_entrainement.tsx`](planning_entrainement.tsx).

---

## 🚀 Comment lancer le site ?

### Option 1 : Le plus simple (1 clic)
Double-cliquez sur le fichier **`Lancer-Site.bat`** sur votre bureau.
Le site web va démarrer et s'ouvrir automatiquement dans votre navigateur à l'adresse **http://localhost:5173**.

### Option 2 : En ligne de commande
Dans un terminal ouvert dans ce dossier :
```bash
npm run dev
```

---

## ✨ Fonctionnalités incluses

1. **Mode Visualisation :**
   - Sélecteur de semaine (ex. semaine du 12/10/2026).
   - Indicateurs en direct : Volume total de la semaine et Sortie longue.
   - Grille interactive des 7 jours de la semaine avec icônes dynamiques (Footing, Côtes, Seuil, VMA, Sortie longue, Repos).
   - Panneau de détails en cliquant sur n'importe quel jour.

2. **Mode Édition :**
   - **Tableau de bord de graphiques dynamiques :**
     - Évolution du volume (Volume total et Sortie la plus longue).
     - Temps de soutien au Seuil (minutes).
     - Distances spécifiques (Côtes et VMA en km).
   - Accordéon semaine par semaine avec édition en direct du volume, des détails de séance et des types.
   - Bouton **"Ajouter la semaine suivante"** pour générer automatiquement la suite du calendrier.

3. **Sauvegarde et Sécurité des données :**
   - **Sauvegarde automatique locale (`localStorage`) :** Toutes vos modifications sont conservées même après fermeture du navigateur ou redémarrage du PC.
   - **Bouton Exporter :** Téléchargez une copie de sauvegarde de votre planning au format JSON.
   - **Bouton Importer :** Rechargez facilement un planning sauvegardé.
   - **Bouton Réinitialiser :** Restaurez les données de départ à tout moment en un clic.

---

## 🌐 Déploiement en ligne (optionnel)

Si vous souhaitez héberger votre site sur internet gratuitement (ex: Vercel, Netlify, GitHub Pages) :
1. Créez un dépôt sur GitHub et déposez ce dossier.
2. Connectez le dépôt à [Vercel](https://vercel.com) ou [Netlify](https://netlify.com).
3. Le site sera automatiquement compilé et accessible depuis n'importe quel appareil (ordinateur, smartphone, tablette).
