# Déploiement et installation sur iPhone

L'app est publiée gratuitement sur **GitHub Pages** par GitHub Actions (`.github/workflows/deploy.yml`) :
à chaque `git push` sur `main`, les tests tournent, l'app est construite puis mise en ligne.

## 1. Créer le dépôt GitHub (une seule fois)

1. Va sur <https://github.com/new>.
2. Nom du dépôt : `muscu` (l'adresse de l'app sera `https://<ton-compte>.github.io/muscu/`).
3. Visibilité : **Public** (GitHub Pages est gratuit uniquement pour les dépôts publics).
   Le dépôt ne contient aucune de tes séances : elles restent sur ton téléphone.
4. Ne coche rien d'autre (pas de README, pas de .gitignore), puis **Create repository**.

## 2. Activer GitHub Pages

Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions**.

## 3. Envoyer le code

Dans le Terminal (remplace `<ton-compte>`) :

```bash
cd "$HOME/Desktop/ /APP"
git remote add origin https://github.com/<ton-compte>/muscu.git
git push -u origin main
```

GitHub demande de te connecter (fenêtre du navigateur ou jeton d'accès personnel).
Ensuite, onglet **Actions** du dépôt : le déploiement « Déploiement GitHub Pages » prend 1 à 2 minutes.
L'adresse s'affiche à la fin (et dans Settings → Pages).

## 4. Installer sur l'iPhone

1. Ouvre l'adresse dans **Safari** (pas un autre navigateur).
2. Bouton **Partager** → **Sur l'écran d'accueil** → **Ajouter**.
3. Ouvre l'app **depuis son icône** : c'est là que tes données seront enregistrées
   (Safari et l'app installée ne partagent pas leurs données).

## 5. Premier lancement

1. **Profil** : sexe et une pesée (pour les niveaux et les exercices lestés).
2. Envoie tes exports Hevy sur l'iPhone (AirDrop ou iCloud Drive → Fichiers).
3. **Profil → Données → Importer depuis Hevy** : choisis les deux fichiers, vérifie les exercices
   à associer, coche les routines (Legs, Push, Pull, Lower, Upper) dans le dossier 🍂, importe.
4. **Profil → Données → Sauvegarde** : exporte une première sauvegarde dans Fichiers.

## Mises à jour

Chaque `git push` sur `main` republie l'app. Sur l'iPhone, la nouvelle version s'installe
d'elle-même au lancement suivant (ferme et rouvre l'app si besoin). Tes données sont conservées
(migrations de la base).

## Tester en local

```bash
npm run dev -- --host
```

Puis, sur l'iPhone (même Wi-Fi) : `http://<adresse-IP-du-Mac>:5173`. Sans HTTPS, iOS n'active pas
le mode hors ligne : les données saisies ainsi restent à part de l'app installée.
