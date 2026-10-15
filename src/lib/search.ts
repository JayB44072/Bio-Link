/**
 * Recherche en direct, commune à toutes les barres de recherche.
 * Insensible aux majuscules et aux accents (« creme » trouve « Crème »), et chaque mot saisi doit être trouvé
 * (« sac cuir » trouve « Sac en cuir ») : le résultat se resserre à chaque lettre tapée.
 */

/** Minuscules, sans accents ni espaces superflus. */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Vrai si tous les mots de `query` apparaissent dans l'un des champs. Une requête vide correspond à tout. */
export function matchesQuery(query: string, fields: unknown[]): boolean {
  const words = normalizeText(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields.map(normalizeText).join(' ');
  return words.every(w => haystack.includes(w));
}

/** Filtre une liste selon la requête ; `pick` renvoie les champs consultables de chaque élément. */
export function filterByQuery<T>(items: T[], query: string, pick: (item: T) => unknown[]): T[] {
  if (!normalizeText(query)) return items;
  return items.filter(item => matchesQuery(query, pick(item)));
}
