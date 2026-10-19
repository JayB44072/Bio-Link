/** Adresse publique du site. En mode démo (captures de présentation), on affiche l'adresse réelle au lieu de localhost. */
export const appOrigin = (): string =>
  import.meta.env.VITE_DEMO ? 'https://biolinkwd.duckdns.org' : window.location.origin;
