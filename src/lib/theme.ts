/**
 * BioLinkWD — design tokens (source unique de vérité).
 *
 * - `tailwind.config.ts` lit ce fichier : les couleurs ci-dessous sont donc
 *   disponibles en classes Tailwind (`bg-brand-violet`, `text-brand-pinkDark`…).
 * - Dans le code React, importer `BRAND`, `GRADIENTS`… plutôt que d'écrire
 *   un code hexadécimal en dur.
 *
 * Aucune dépendance à React ni au DOM : ce fichier est importable partout
 * (config Tailwind, composants, tests, librairies canvas/QR/Leaflet).
 */

/** Couleurs de marque. */
export const BRAND = {
  violet: '#6C63FF',
  violetLight: '#8B7CFF',
  cyan: '#00C2FF',
  pink: '#FF6B9D',
  /** Rose sombre (déjà utilisé pour les pastilles et dégradés de l'app). */
  pinkDark: '#DB2777',
  /** Rose très sombre, fin des dégradés roses. */
  pinkDeep: '#9D174D',
  navy: '#1A1A2E',
} as const;

/** Couleurs d'état. */
export const STATUS = {
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#2563EB',
  whatsapp: '#25D366',
} as const;

/** Neutres des interfaces clair / sombre. */
export const NEUTRAL = {
  light: {
    page: '#F8F7FF',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textMuted: '#5B6472',
    inputBg: '#F9FAFB',
  },
  dark: {
    page: '#080818',
    surface: '#0D0D22',
    border: '#1E1E3F',
    text: '#F0F0FF',
    textMuted: '#A0A0C0',
    inputBg: '#111128',
  },
} as const;

/** Dégradés prêts à l'emploi (valeur CSS de `background`). */
export const GRADIENTS = {
  brand: `linear-gradient(135deg,${BRAND.violet},${BRAND.cyan})`,
  brandReverse: `linear-gradient(135deg,${BRAND.cyan},${BRAND.violet})`,
  violetPink: `linear-gradient(135deg,${BRAND.violet},${BRAND.pink})`,
  pinkViolet: `linear-gradient(135deg,${BRAND.pink},${BRAND.violet})`,
  violetSoft: `linear-gradient(135deg,${BRAND.violet},${BRAND.violetLight})`,
  /** Fond du panneau latéral des écrans de connexion / inscription. */
  pinkPanel: `linear-gradient(160deg,${BRAND.pinkDark} 0%,${BRAND.pinkDeep} 100%)`,
  soft: 'linear-gradient(160deg,#F0EEFF 0%,#E8F7FF 100%)',
} as const;

/** Polices. L'application utilise la pile système de Tailwind (aucune police web chargée). */
export const FONTS = {
  sans: [
    'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
    'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
  ],
  /** Documents imprimés (reçus) — voir PurchaseModal. */
  print: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
} as const;

/** Arrondis utilisés par les composants partagés. */
export const RADIUS = {
  control: '0.75rem', // champs, boutons secondaires (rounded-xl)
  card: '1rem',
  pill: '9999px',
} as const;

/** Tailles minimales des zones tactiles (px). */
export const TOUCH = { min: 44, comfortable: 48 } as const;

export const theme = { BRAND, STATUS, NEUTRAL, GRADIENTS, FONTS, RADIUS, TOUCH } as const;
export default theme;
