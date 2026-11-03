# Standards de force : données brutes (récupérées le 2 novembre 2026)

- `exrx_*.json` : tables de Dr Lon Kilgore publiées sur ExRx.net (en kg, 18-39 ans) : squat, développé couché, soulevé de terre, développé militaire, épaulé.
- `sl_*.json` : Strength Level (strengthlevel.com), 39 exercices, tableaux « par poids de corps », hommes et femmes.
  - `load: "added"` (dips, tractions pronation et supination, muscle-ups) : lest au 1RM, à ajouter au poids de corps.
  - `perDumbbell: true` : poids d'un seul haltère (indiqué sur la page).
  - Données vérifiées par somme de contrôle contre la page.
- Non trouvés : kettlebell swing, rowing landmine. En reps seulement (pas de 1RM) : pompes, crunchs, relevés de genoux, extension lombaire.

## Génération

`python3 data-sources/strength-standards/build.py` produit `src/data/strengthStandards.json` (44 standards reliés à 44 exercices de la bibliothèque).

- Classes ouvertes de Kilgore (« 145+ », « 90+ ») écartées : pas de poids de corps précis.
- Dips, tractions, muscle-ups : seuils convertis en charge totale (poids de corps + lest).
- Exercices de la bibliothèque sans standard : machines et poulies (pas de standard fiable), rowing penché aux haltères (pas d'équivalent exact), et les exercices cités ci-dessus.
