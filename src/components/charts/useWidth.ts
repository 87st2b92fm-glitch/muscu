import { useEffect, useRef, useState } from 'react'

/** Largeur rendue d'un élément, suivie avec ResizeObserver (les graphiques s'adaptent à l'écran). */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { ref, width }
}
