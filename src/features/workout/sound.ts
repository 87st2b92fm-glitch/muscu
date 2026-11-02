// Safari iOS n'autorise le son qu'après un geste de l'utilisateur : le contexte audio est créé
// (ou réveillé) au premier tap de validation d'une série, puis réutilisé pour le bip de fin de repos.
let context: AudioContext | null = null

export function unlockAudio() {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
  } catch {
    context = null
  }
}

/** Trois bips courts. Silencieux si le son n'a pas pu être débloqué. */
export function playRestEndSound() {
  if (!context || context.state !== 'running') return
  const start = context.currentTime
  for (let i = 0; i < 3; i++) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = i === 2 ? 1320 : 880
    gain.gain.setValueAtTime(0.0001, start + i * 0.25)
    gain.gain.exponentialRampToValueAtTime(0.4, start + i * 0.25 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.25 + 0.18)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start + i * 0.25)
    oscillator.stop(start + i * 0.25 + 0.2)
  }
}
