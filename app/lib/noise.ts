/**
 * "Monotone noise" de Figma: solo píxeles negros con alpha variable,
 * para poder superponerlo sobre cualquier fondo. Usar con `opacity`
 * (el alpha promedio del ruido es ~0.5, así que opacity = 2 × % de Figma).
 *
 * size 0.25 -> baseFrequency ~1.6 | size 0.3 -> ~1.4 | size 0.5 -> ~0.9
 */
export const noiseBackground = (baseFrequency: number): string =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
