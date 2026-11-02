/**
 * Lit un CSV (RFC 4180) : champs entre guillemets, "" pour un guillemet, virgules et retours
 * à la ligne dans les champs, fins de ligne Windows, BOM. Renvoie une ligne d'objets par en-tête.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        field += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...data] = rows.filter((r) => r.some((cell) => cell !== ''))
  if (!header) return []
  return data.map((cells) => Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ''])))
}
