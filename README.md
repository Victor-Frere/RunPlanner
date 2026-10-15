# 🏃 RunPlanner Pro

Application web interactive de gestion et de suivi de plan d'entraînement en **temps réel** basée sur votre fichier [`planning_entrainement.tsx`](planning_entrainement.tsx).

---

## ⚡ Synchronisation en Temps Réel pour tout le monde (Supabase)

Toutes les modifications apportées par un entraîneur ou un athlète peuvent désormais être reflétées **instantanément en direct sur tous les écrans** (smartphone, tablette, PC) sans recharger la page.

### 🟢 Comment activer le Temps Réel (1 minute) :
1. Créez un compte et un projet gratuit sur **[supabase.com](https://supabase.com)**.
2. Dans le menu de gauche de Supabase, ouvrez **SQL Editor**, collez le contenu du fichier [`supabase_setup.sql`](supabase_setup.sql) et cliquez sur **Run**.
3. Récupérez vos identifiants dans **Project Settings → Data API** :
   - `Project URL`
   - `Project API Key` (Anon / Public)
4. Sur le site web, cliquez sur le bouton **« Activer le Temps Réel »** ou l'icône ☁️ dans l'en-tête, collez vos identifiants et cliquez sur **Enregistrer et Connecter**.

*Note : Si le cloud n'est pas configuré, le site continue de fonctionner normalement avec sauvegarde locale automatique (`localStorage`).*

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

1. **Synchronisation mondiale en temps réel :**
   - Mises à jour instantanées répercutées chez tous les utilisateurs connectés.
   - Badge d'état dans l'en-tête (🟢 En direct, 🔄 Envoi en direct, 🟡 Hors ligne).
   - Notification toast discrète lorsqu'un utilisateur distant met à jour le plan.

2. **Mode Visualisation :**
   - Sélecteur de semaine (ex. semaine du 12/10/2026).
   - Indicateurs en direct : Volume total de la semaine et Sortie longue.
   - Grille interactive des 7 jours de la semaine avec icônes dynamiques (Footing, Côtes, Seuil, VMA, Sortie longue, Repos).
   - Panneau de détails en cliquant sur n'importe quel jour.

3. **Mode Édition :**
   - **Tableau de bord de graphiques dynamiques :**
     - Évolution du volume (Volume total et Sortie la plus longue).
     - Temps de soutien au Seuil (minutes).
     - Distances spécifiques (Côtes et VMA en km).
   - Accordéon semaine par semaine avec édition en direct du volume, des détails de séance et des types.
   - Bouton **"Ajouter la semaine suivante"** pour générer automatiquement la suite du calendrier.

4. **Sauvegarde et Sécurité des données :**
   - **Base de données Cloud (Supabase) :** Partagée entre tous vos appareils.
   - **Sauvegarde locale de secours (`localStorage`) :** Fonctionne même sans connexion internet.
   - **Bouton Exporter :** Téléchargez une copie de sauvegarde de votre planning au format JSON.
   - **Bouton Importer :** Rechargez facilement un planning sauvegardé.
   - **Bouton Réinitialiser :** Restaurez les données de départ à tout moment en un clic.

---

## 🌐 Déploiement en ligne gratuit (Vercel / Netlify / GitHub Pages)

Pour donner accès au site à n'importe qui sur Internet :
1. Rendez-vous sur [Vercel](https://vercel.com) ou [Netlify](https://netlify.com).
2. Importez votre dépôt GitHub : `https://github.com/Victor-Frere/RunPlanner.git`.
3. Ajoutez vos deux variables d'environnement dans les paramètres de déploiement (Environment Variables) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Cliquez sur **Deploy** : le site est en ligne 24h/24 avec synchronisation en temps réel pour tous vos coureurs !
