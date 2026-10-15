/** Connexion très lente ou économiseur de données : on évite de télécharger/animer la 3D. */
export function lowBandwidth(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!conn && (conn.saveData === true || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g');
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
