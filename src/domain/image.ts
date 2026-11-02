/** Zone source à découper pour remplir un carré de l'image (recadrage centré, comme object-fit: cover). */
export function coverCrop(width: number, height: number): { sx: number; sy: number; side: number } {
  const side = Math.min(width, height)
  return { sx: (width - side) / 2, sy: (height - side) / 2, side }
}
