# Cahier des charges — App de suivi de musculation (PWA perso)

## 0. Contexte
App de suivi de musculation dans l'esprit de Hevy / Strong, pour un **usage strictement personnel**, sur **iPhone**, **gratuite**.
- Livrée sous forme de **PWA** installée via Safari → Partager → « Sur l'écran d'accueil ».
- Hébergement gratuit : **GitHub Pages** (déploiement automatique via GitHub Actions).
- Interface **entièrement en français**, unités en **kg**.
- Pas de compte, pas de serveur, pas de backend : **tout est stocké en local** sur le téléphone.

## 1. Stack technique
- **Vite + React + TypeScript**
- **Tailwind CSS**
- **Dexie.js** (IndexedDB) pour les données
- **vite-plugin-pwa** pour le service worker (fonctionnement **100 % hors ligne**) et le manifest
- **Recharts** (ou équivalent léger) pour les graphiques
- Tests unitaires avec **Vitest** sur toute la logique de calcul (1RM, niveaux, progression, disques)

### Contraintes iOS à respecter
- Mobile-first, pensé pour une main, **gros boutons** (zones tactiles ≥ 44 px), respect des safe areas (encoche, barre du bas).
- Mode sombre par défaut (salle de sport), mode clair dispo.
- Icônes et `apple-touch-icon` corrects, affichage `standalone`.
- iOS peut purger le stockage d'une PWA : demander `navigator.storage.persist()` et proposer un **export de sauvegarde** facile (voir §9), avec un rappel si aucune sauvegarde depuis 14 jours.
- Le chrono de repos doit être basé sur un **horodatage** (pas un compteur), pour rester juste quand l'app passe en arrière-plan. Vibration/son à la fin si l'app est ouverte.

## 2. Profil utilisateur
- Sexe, poids de corps (avec historique), date de naissance (optionnelle).
- Le poids de corps sert au calcul des niveaux de force (§7).

## 3. Salles de sport (fonctionnalité clé)
Les machines n'ont pas la même charge réelle d'une marque à l'autre (Gym80, Panatta, Matrix…). Les performances sur machine doivent donc être **séparées par salle**.

- Salles préconfigurées : **On Air** (salle principale, **par défaut**), **SUAPS** (salle de la fac), **Basic**. Possibilité d'en ajouter, renommer, supprimer.
- Chaque salle peut avoir sa liste de **disques disponibles** et de **barres** (pour le calculateur de disques).
- Au démarrage d'une séance, la salle par défaut est présélectionnée et changeable en un tap.

### Deux catégories d'exercices
- **Poids libres / poids du corps** (barre, haltères, kettlebell, tractions, dips…) : records **communs à toutes les salles**.
- **Machines / poulies / guidées** : records **propres à chaque salle**. Champ optionnel « marque / modèle » de la machine par salle.
- Option : **lier** la même machine entre deux salles (même marque, même modèle) pour fusionner leurs records.

## 4. Socle fonctionnel (v1)
1. **Bibliothèque d'exercices** préremplie (≈ 80 exercices courants en français), avec : nom, catégorie (libre / machine), équipement, muscles principaux et secondaires. Ajout d'exercices personnalisés.
2. **Séances, modèles et programmes** : créer des modèles réutilisables, démarrer une séance vide ou depuis un modèle.
3. **Saisie des séries** : reps, poids, RPE ou RIR (optionnel), type de série (échauffement, normale, dégressive, échec), notes par exercice et par séance. Affichage de la perf de la dernière fois à côté de chaque série.
4. **Chrono de repos** automatique après validation d'une série, durée réglable par exercice.
5. **Supersets** (regroupement de 2+ exercices).
6. **Historique** des séances, filtrable par salle.
7. **Records** (voir §6).
8. **Graphiques de progression** par exercice (1RM estimé, charge max, volume), filtrables par salle pour les machines.
9. **Progression automatique** : pour chaque exercice, suggestion de charge/reps pour la prochaine séance, basée sur l'historique **dans la salle du jour**. Méthode par défaut : double progression (fourchette de reps, ex. 8–12 ; si toutes les séries atteignent le haut de la fourchette → augmenter la charge du plus petit incrément dispo). Afficher la suggestion, ne jamais l'imposer.
10. **Calculateur de disques** : pour une charge cible, quels disques mettre de chaque côté, selon la barre et les disques de la salle sélectionnée.
11. **Mode salle** : écran de séance épuré, très gros boutons, valider une série en un tap, +/- rapides sur poids et reps, écran maintenu allumé si possible (Wake Lock API).

## 5. Calcul du 1RM
- 1RM estimé avec la formule d'**Epley** (`poids × (1 + reps / 30)`), calculée uniquement sur les séries de **1 à 10 reps** (au-delà, estimation peu fiable → ignorée pour le 1RM).
- Séries d'échauffement exclues des records.
- Logique isolée dans un module testé.

## 6. Onglet Performance
### Sélecteur de salle
En haut : sélecteur **On Air / SUAPS / Basic / …**. Les exercices machine affichent les valeurs de la salle choisie ; les poids libres affichent toujours la même valeur.

### Records par exercice
Pour chaque exercice :
- **1RM réel** (charge la plus lourde réussie sur 1 rep)
- **1RM estimé** (meilleur Epley)
- **Charge max** soulevée, toutes reps confondues
- **Max de reps** au total, et **record de reps par charge** (« 80 kg : 9 reps »)
- **Date** de chaque record + mini-courbe d'évolution
- Détection et mise en avant des **nouveaux records** en fin de séance

### Carte du corps (niveaux de force)
- Silhouette **SVG face + dos**, chaque muscle étant une zone cliquable (pectoraux, deltoïdes avant/latéraux/arrière, biceps, triceps, avant-bras, abdos, obliques, trapèzes, grand dorsal, lombaires, fessiers, quadriceps, ischio-jambiers, mollets, adducteurs).
- Chaque muscle est coloré selon le niveau : **Débutant → Novice → Intermédiaire → Avancé → Élite** (5 couleurs, dégradé clair → intense, + légende). **Gris** si aucune donnée.
- Niveau d'un muscle = niveau du **meilleur exercice de référence** qui le cible en muscle principal.
- Au tap sur un muscle : exercices pris en compte, perfs, niveau actuel, **charge à atteindre pour le niveau suivant**.
- **Seuls les poids libres** (et exercices au poids du corps lestés si des standards existent) comptent pour la carte : les machines n'ont pas de standard fiable. Elles restent dans les records mais pas dans les niveaux.

## 7. Standards de force (données)
- Niveaux calculés à partir du **1RM estimé**, du **sexe** et du **poids de corps** (interpolation entre les tranches de poids).
- Sources à utiliser, par ordre de priorité :
  1. **Standards du Dr Lon Kilgore** (publiés sur ExRx.net) pour les grands mouvements à la barre (squat, développé couché, soulevé de terre, développé militaire, power clean…).
  2. **Strength Level** (strengthlevel.com) pour les autres exercices en poids libres (curl barre, rowing, shrug, etc.). Données déclaratives, donc à considérer comme indicatives.
- Rechercher et vérifier ces données, puis les stocker dans un fichier `src/data/strengthStandards.json` versionné, **avec la source et la date de récupération pour chaque exercice**. Si une donnée ne peut pas être vérifiée, ne pas l'inventer : laisser l'exercice hors de la carte et me le signaler.
- Afficher dans l'app une petite note « D'où viennent ces niveaux ? » avec les sources.

## 8. Mensurations (optionnel en v1 si le temps le permet)
Poids de corps et mensurations avec historique et graphique.

## 9. Sauvegarde
- **Export** complet en JSON (et CSV des séances) via le partage iOS / téléchargement.
- **Import** d'une sauvegarde JSON (avec confirmation, fusion ou remplacement).
- Le modèle de données doit être **versionné** (migrations Dexie) pour ne jamais perdre de données lors des mises à jour.

## 10. Hors périmètre v1 (pour plus tard)
Détection de plateau / deload, volume hebdo par muscle sur la carte, générateur d'échauffement, photos de progression, récap hebdo/mensuel, import depuis Hevy/Strong.

## 11. Façon de travailler
- Commencer par **proposer un plan** (architecture, modèle de données, étapes) et attendre ma validation avant de coder.
- Avancer par petites étapes fonctionnelles, avec un **commit Git** à chaque étape.
- Me dire comment lancer l'app en local et la tester sur mon iPhone via le Wi-Fi.
- À la fin : configurer le **déploiement GitHub Pages** et me guider pas à pas (création du dépôt, activation de Pages, installation sur l'iPhone).
- Me poser des questions plutôt que de deviner quand un choix est ambigu.
