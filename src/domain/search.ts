/** Texte comparable : minuscules, sans accents ni espaces superflus (« Écartés » ≈ « ecartes »). */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Vrai si chaque mot de la recherche apparaît dans l'un des textes. */
export function matchesSearch(query: string, texts: readonly string[]): boolean {
  const words = normalizeText(query).split(' ').filter(Boolean)
  if (words.length === 0) return true
  const haystack = texts.map(normalizeText).join(' | ')
  return words.every((word) => haystack.includes(word))
}

const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true })

/** Ordre alphabétique français : « Écartés » se range avec les E, pas après le Z. */
export function byName<T extends { name: string }>(a: T, b: T): number {
  return collator.compare(a.name, b.name)
}
