export interface LatLng { lat: number; lng: number }

const R = 6371; // rayon de la Terre, km

/** Distance à vol d'oiseau entre deux points, en km (formule de haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Longueur d'une ligne brisée, en km. */
export function pathLengthKm(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += distanceKm(path[i - 1], path[i]);
  return total;
}

/** Point situé à la fraction `t` (0 à 1) de la longueur d'une ligne brisée. */
export function pointAlong(path: LatLng[], t: number): LatLng | null {
  if (path.length === 0) return null;
  if (path.length === 1 || t <= 0) return path[0];
  const total = pathLengthKm(path);
  if (total === 0 || t >= 1) return path[path.length - 1];
  let target = total * t;
  for (let i = 1; i < path.length; i++) {
    const seg = distanceKm(path[i - 1], path[i]);
    if (target <= seg && seg > 0) {
      const k = target / seg;
      return { lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * k, lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * k };
    }
    target -= seg;
  }
  return path[path.length - 1];
}

/** « 850 m », « 4,2 km », « 38 km » — arrondi lisible. */
export function formatDistance(km: number, lang = 'fr'): string {
  if (km < 1) return `${Math.max(10, Math.round(km * 100) * 10)} m`;
  const v = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${v.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} km`;
}

/** Durée estimée à vitesse moyenne de livraison urbaine (25 km/h par défaut) : « ~12 min », « ~1 h 20 ». */
export function formatDuration(km: number, kmh = 25): string {
  const min = Math.max(1, Math.round((km / kmh) * 60));
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `~${h} h ${String(m).padStart(2, '0')}` : `~${h} h`;
}
