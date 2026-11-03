"""Construit src/data/strengthStandards.json à partir des tables brutes de ce dossier.

Usage (depuis la racine du projet) : python3 data-sources/strength-standards/build.py

- ExRx (Kilgore) : tables en kg. La dernière classe « 145+ » / « 90+ » n'a pas de poids de corps
  précis : elle est écartée (le niveau est alors celui de la classe 145 kg / 90 kg).
- Strength Level : tables « par poids de corps ». Pour les exercices au poids du corps
  (dips, tractions, muscle-ups), la page donne le lest au 1RM : on stocke la charge totale
  (poids de corps + lest), comme l'app calcule le 1RM de ces exercices.
"""

import json
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "src" / "data" / "strengthStandards.json"
RETRIEVED_AT = "2026-11-02"

KILGORE = {
    "squat": ("Squat", "exrx_squat.json"),
    "bench-press": ("Développé couché", "exrx_bench.json"),
    "deadlift": ("Soulevé de terre", "exrx_deadlift.json"),
    "press": ("Développé militaire", "exrx_press.json"),
    "power-clean": ("Épaulé (power clean)", "exrx_clean.json"),
}

# Exercice de la bibliothèque → clé de standard.
EXERCISES = {
    "squat": "squat",
    "bench-press": "bench-press",
    "deadlift": "deadlift",
    "overhead-press": "press",
    "power-clean": "power-clean",
    "incline-bench-press": "incline-bench-press",
    "close-grip-bench-press": "close-grip-bench-press",
    "db-bench-press": "dumbbell-bench-press",
    "db-incline-press": "incline-dumbbell-bench-press",
    "db-fly": "dumbbell-fly",
    "dips": "dips",
    "pull-up": "pull-ups",
    "chin-up": "chin-ups",
    "muscle-up": "muscle-ups",
    "barbell-row": "bent-over-row",
    "db-row": "dumbbell-row",
    "chest-supported-db-row": "chest-supported-dumbbell-row",
    "seal-row": "seal-row",
    "sumo-deadlift": "sumo-deadlift",
    "romanian-deadlift": "romanian-deadlift",
    "barbell-shrug": "barbell-shrug",
    "db-shrug": "dumbbell-shrug",
    "db-shoulder-press": "dumbbell-shoulder-press",
    "db-lateral-raise": "dumbbell-lateral-raise",
    "db-front-raise": "dumbbell-front-raise",
    "db-reverse-fly": "dumbbell-reverse-fly",
    "barbell-curl": "barbell-curl",
    "ez-bar-curl": "ez-bar-curl",
    "db-curl": "dumbbell-curl",
    "incline-db-curl": "incline-dumbbell-curl",
    "db-hammer-curl": "hammer-curl",
    "barbell-preacher-curl": "preacher-curl",
    "spider-curl": "spider-curl",
    "barbell-reverse-curl": "reverse-barbell-curl",
    "skullcrusher": "lying-tricep-extension",
    "db-overhead-extension": "dumbbell-tricep-extension",
    "front-squat": "front-squat",
    "barbell-hip-thrust": "hip-thrust",
    "bulgarian-split-squat": "dumbbell-bulgarian-split-squat",
    "db-lunge": "dumbbell-lunge",
    "goblet-squat": "goblet-squat",
    "db-side-bend": "dumbbell-side-bend",
    "wrist-curl": "wrist-curl",
    "wrist-extension": "reverse-wrist-curl",
}


def kilgore_table(rows):
    table = {"bodyweightsKg": [], "thresholdsKg": []}
    for row in rows:
        bw, *levels = row.split()
        if bw.endswith("+"):
            continue
        table["bodyweightsKg"].append(float(bw))
        table["thresholdsKg"].append([float(v) for v in levels[:5]])
    return table


def strength_level_table(rows, added):
    table = {"bodyweightsKg": [], "thresholdsKg": []}
    for bw, *levels in rows:
        table["bodyweightsKg"].append(bw)
        table["thresholdsKg"].append([bw + v if added else v for v in levels])
    return table


def main():
    standards = {}
    for key, (name, file) in KILGORE.items():
        raw = json.loads((HERE / file).read_text())
        men, women = raw["tables"]
        assert "Men" in men["caption"] and "Women" in women["caption"], file
        standards[key] = {
            "name": name,
            "source": "kilgore",
            "url": raw["url"],
            "retrievedAt": RETRIEVED_AT,
            "load": "total",
            "perDumbbell": False,
            "male": kilgore_table(men["rows"]),
            "female": kilgore_table(women["rows"]),
        }

    for file in sorted(HERE.glob("sl_*.json")):
        for key, raw in json.loads(file.read_text()).items():
            added = raw["load"] == "added"
            standards[key] = {
                "name": raw["avg"].split(" is ")[0].replace("The average rep count for ", "").replace("The average ", ""),
                "source": "strengthlevel",
                "url": raw["url"],
                "retrievedAt": RETRIEVED_AT,
                "dataCutoff": raw["cutoff"],
                "load": "bodyweight" if added else "total",
                "perDumbbell": raw["perDumbbell"],
                "male": strength_level_table(raw["male"], added),
                "female": strength_level_table(raw["female"], added),
            }

    missing = sorted(set(EXERCISES.values()) - set(standards))
    assert not missing, missing
    OUT.write_text(
        json.dumps(
            {"levels": ["Débutant", "Novice", "Intermédiaire", "Avancé", "Élite"], "exercises": EXERCISES, "standards": standards},
            ensure_ascii=False,
            separators=(",", ":"),
        )
        + "\n"
    )
    print(f"{len(standards)} standards, {len(EXERCISES)} exercices → {OUT}")


if __name__ == "__main__":
    main()
