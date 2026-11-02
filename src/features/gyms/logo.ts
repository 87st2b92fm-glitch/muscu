import { coverCrop } from '../../domain/image'

const LOGO_SIZE = 160

/** Image de la pellicule → carré de 160 px en data URL (quelques Ko, stocké avec la salle). */
export async function logoFromFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const { sx, sy, side } = coverCrop(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = LOGO_SIZE
    canvas.height = LOGO_SIZE
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas indisponible')
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, sx, sy, side, side, 0, 0, LOGO_SIZE, LOGO_SIZE)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
