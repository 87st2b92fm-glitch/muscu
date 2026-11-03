"""Extrait les tracés SVG de body-muscles (Apache-2.0, © 2024 Ivan Vulović) vers src/data/bodyMapPaths.ts.

Usage : python3 data-sources/body-muscles/extract.py <dossier du paquet npm body-muscles>
Le fichier JavaScript du paquet est lu comme du texte (jamais exécuté) : on n'en garde que id et path.
Modification apportée : seules les données de tracés sont reprises ; le rendu est propre à l'app.
"""

import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).parent.parent.parent / "src" / "data" / "bodyMapPaths.ts"
# Un objet par région : { id: "...", name: "...", view: ..., // commentaire éventuel\n path: "..." }
ENTRY = re.compile(r'\{\s*id:\s*"([a-z0-9-]+)"[^{}]*?path:\s*"([^"]+)"[^{}]*\}', re.S)


def regions(file: Path):
    text = file.read_text()
    found = ENTRY.findall(text)
    assert len(found) == len(re.findall(r'\bid:\s*"', text)), file
    for _, path in found:
        assert re.fullmatch(r"[mMlLhHvVcCsSqQtTaAzZeE0-9.,\s-]+", path), path[:40]
    return [{"id": i, "path": p} for i, p in found]


def main():
    data = Path(sys.argv[1]) / "dist" / "data"
    version = json.loads((Path(sys.argv[1]) / "package.json").read_text())["version"]
    front = regions(data / "muscles.front.js")
    back = regions(data / "muscles.back.js")
    OUT.write_text(
        "// Généré par data-sources/body-muscles/extract.py — ne pas modifier à la main.\n"
        f"// Tracés SVG issus de body-muscles {version} (https://github.com/vulovix/body-muscles),\n"
        "// © 2024 Ivan Vulović, licence Apache-2.0 (voir data-sources/body-muscles/LICENSE et NOTICE).\n"
        "// Seules les données de tracés sont reprises ; le rendu et les couleurs sont propres à l'app.\n\n"
        "export interface BodyRegion {\n  id: string\n  path: string\n}\n\n"
        "/** Vue de face : viewBox « 0 0 35 93 ». */\n"
        f"export const FRONT_REGIONS: BodyRegion[] = {json.dumps(front, indent=1)}\n\n"
        "/** Vue de dos : viewBox « 37 0 35 93 » (même repère que la face, décalé). */\n"
        f"export const BACK_REGIONS: BodyRegion[] = {json.dumps(back, indent=1)}\n"
    )
    print(f"{len(front)} régions de face, {len(back)} de dos → {OUT}")


if __name__ == "__main__":
    main()
