# Plan de réalisation

Référence : [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md). Ce document fixe les choix techniques et les décisions prises avec toi ; il est mis à jour quand une décision change.

## 1. Architecture

**Stack** : Vite + React + TypeScript (strict), Tailwind v4, Dexie 4 (`useLiveQuery`), vite-plugin-pwa, Recharts, Vitest, React Router en **HashRouter** (compatible GitHub Pages et hors ligne sans configuration serveur).

Pas de gestionnaire d'état global : **la base Dexie est la seule source de vérité**. Une séance en cours est enregistrée à chaque tap et survit à une fermeture de l'app par iOS.

```
src/
  domain/      logique pure (ni React ni Dexie), testée avec Vitest
    oneRm.ts         Epley, séries de 1 à 10 reps, échauffements exclus
    load.ts          charge effective (lest + poids de corps du jour pour les exercices lestés)
    records.ts       1RM réel/estimé, charge max, reps max, reps par charge, nouveaux records
    recordScope.ts   portée des records : libre / machine par salle / machine liée entre salles
    progression.ts   double progression avec la fourchette et l'incrément choisis par l'utilisateur
    plates.ts        calculateur de disques selon barre et disques de la salle
    strengthLevel.ts interpolation poids de corps × sexe, niveau suivant, charge à atteindre
    backup.ts, csv.ts  export, validation, fusion ou remplacement à l'import
  db/          schema.ts (versions et migrations Dexie), seed.ts
  data/        exercises.fr.json, strengthStandards.json, muscles.ts
  features/    workout/ history/ performance/ exercises/ templates/ gyms/ profile/ backup/
  components/  composants d'interface (boutons ≥ 44 px, feuilles, steppers +/-…)
  hooks/       useRestTimer, useWakeLock, useActiveWorkout
```

**Onglets** (barre flottante en pastille) : **Accueil** · **Entraînement** · **Performance** · **Profil**.
- Accueil : fil des dernières séances (c'est aussi l'historique, filtrable par salle).
- Entraînement : démarrer une séance vide, modèles rangés en dossiers, bibliothèque d'exercices, choix de la salle (avec logo). Un dossier peut servir de **programme** : l'app y marque la prochaine séance de la rotation.
- Profil : poids de corps, salles, sauvegarde, réglages.

**Direction graphique** (inspirée de Hevy, sans la copier) : grands titres, cartes arrondies sur fond très sombre, boutons pleins de couleur d'accent, police Inter (embarquée, hors ligne), chiffres à chasse fixe. Couleur d'accent au choix dans les réglages.

## 2. Modèle de données (Dexie, version 1)

| Table | Champs principaux |
|---|---|
| `profile` (ligne unique) | sexe, date de naissance ?, réglages : **RIR activé (oui/non)**, **son de fin de repos (oui/non)**, repos par défaut, salle par défaut, date de dernière sauvegarde |
| `bodyweights` | id, date, kg |
| `gyms` | id, nom, ordre, **logo ? (image)**, couleur, `plates: {kg, paires}[]`, `bars: {nom, kg}[]`, incrément des haltères |
| `exercises` | id, nom, catégorie (`libre` / `machine`), équipement, muscles principaux et secondaires, `loadMode` (`charge` / `lest`), **fourchette de reps ?**, repos, `standardKey ?`, personnalisé, archivé |
| `machineSetups` | exercice × salle : marque/modèle ?, **incrément ?**, `linkGroupId ?` |
| `templates` | nom, notes, blocs `[{exerciseId, supersetId ?, séries cibles, fourchette de reps ?, repos}]` |
| `folders` | nom, ordre, liste ordonnée de modèles, rotation activée (programme) et prochain modèle |
| `workouts` | salle, modèle d'origine ?, début, fin, notes, statut, blocs d'exercices (ordre, superset, notes), `restEndsAt` |
| `sets` | séance, bloc, exercice, salle (dupliquée exprès), type (échauffement / normale / dégressive / échec), reps, kg, RIR ?, horodatage de validation. Index `[exerciseId+gymId]` et date |

Principes :
- **Records recalculés** à partir des `sets` (jamais stockés) : toujours justes, même après modification d'une ancienne séance.
- Thème et couleur d'accent : préférences de l'appareil, en `localStorage` (appliquées avant le premier rendu).
- **`recordScope(exercice, salle)`** est la seule fonction qui décide si des performances sont communes ou séparées par salle.
- **Chrono de repos** : on stocke l'heure de fin (`restEndsAt`), l'affichage calcule `restEndsAt − maintenant`.

## 3. Décisions validées

| Sujet | Décision |
|---|---|
| Haltères | On saisit le poids d'**un seul** haltère. |
| Exercices lestés (tractions, dips…) | On saisit **uniquement le lest**. Pour le volume, le 1RM et les niveaux, la charge effective = **lest + poids de corps** (dernière pesée à la date de la séance). |
| Effort | **RIR** uniquement, désactivable dans les réglages (champ masqué). |
| Son de fin de repos | **Désactivable** dans les réglages. Pas de vibration : Safari iOS ne la gère pas. |
| Incrément des machines | **Libre**, par machine et par salle, décimales acceptées (ex. 2,27 kg à Basic). Pas de valeur imposée : sans incrément renseigné, la suggestion dit « augmente la charge » sans chiffre. |
| Fourchettes de reps | **Saisies par toi**, par exercice (modifiables dans un modèle). Sans fourchette, pas de suggestion de progression, seulement la perf de la dernière fois. |
| Silhouette SVG | Tracés repris d'une **librairie open source** (licence vérifiée et citée). |
| Programmes | Un dossier de modèles en rotation (ex. Upper / Lower), l'app marque la « Prochaine » séance. |
| Records pendant la séance | Dès qu'une série validée bat un record, elle est **marquée immédiatement** : **record de charge** (charge la plus lourde jamais réussie) et/ou **record de volume** (meilleur charge × reps sur une seule série). Échauffements exclus, charge effective pour les exercices lestés, par salle pour les machines. Les records apparaissent aussi sur les cartes du fil d'accueil. |
| Logos de salle | Logo **ajouté depuis ta pellicule** dans les réglages de la salle ; à défaut, pastille de couleur avec l'initiale. Affiché dans le sélecteur de salle. |

## 4. Étapes (un commit par étape)

| # | Étape | Contenu |
|---|---|---|
| 0 | Socle | Vite, Tailwind, PWA (manifest, icônes, apple-touch-icon, standalone), safe areas, thème sombre/clair, barre d'onglets, Vitest, ESLint/Prettier |
| 1 | Logique métier + tests | `domain/` complet (hors standards de force) |
| 2 | Base de données | Schéma v1, seed (On Air par défaut, SUAPS, Basic, ~80 exercices), profil et poids de corps, `storage.persist()` |
| 3 | Salles et exercices | CRUD salles (logo, disques, barres), marque et incrément machine par salle, lien entre salles ; bibliothèque et exercices perso |
| 4 | Séance | Séance vide, marquage des records en direct, sélecteur de salle avec logos, saisie des séries, perf précédente, chrono de repos, supersets, notes, **mode salle** (Wake Lock) |
| 5 | Modèles et programmes | |
| 6 | Accueil et historique | Fil des séances avec records, filtre par salle, détail, modification |
| 7 | Records et graphiques | Onglet Performance, sélecteur de salle, records datés, courbes, nouveaux records en fin de séance |
| 8 | Progression et disques | Suggestion pour la salle du jour, calculateur de disques |
| 9 | Standards de force | Recherche et vérification → `strengthStandards.json` (source + date), rapport des données non vérifiables |
| 10 | Carte du corps | SVG face/dos, 5 niveaux + gris, fiche au tap, note sur les sources |
| 11 | Sauvegarde | Export JSON/CSV, import fusion/remplacement, rappel à 14 jours |
| 12 | Mensurations (optionnel) | |
| 13 | Déploiement | GitHub Actions → GitHub Pages, guide d'installation sur iPhone |

## 5. Limites iOS connues
- Pas de vibration (`navigator.vibrate` absent de Safari iOS) ; le son est débloqué au premier tap de la séance.
- Aucune alerte quand l'app est en arrière-plan (il faudrait un serveur de notifications) ; le chrono reste juste au retour.
- Service worker et persistance du stockage uniquement en HTTPS : l'installation hors ligne se teste réellement sur GitHub Pages.
