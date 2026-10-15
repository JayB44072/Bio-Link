/**
 * Palette des écrans du tableau de bord (clair / sombre).
 *
 * Source unique pour les couleurs que chaque onglet recopiait à la main
 * (`surface`, `border`, `txtPrim`…). Les noms sont ceux déjà utilisés dans
 * les composants, pour que le remplacement ne change ni le code ni l'apparence.
 */

export interface DashPalette {
  /** Fond de page */
  bg: string;
  /** Cartes et panneaux */
  surface: string;
  /** Zones légèrement en retrait dans une carte */
  surfaceAlt: string;
  border: string;
  /** Texte principal */
  txtPrim: string;
  /** Libellés de formulaire */
  txtLabel: string;
  /** Texte secondaire */
  txtSub: string;
  inputBg: string;
  inputBorder: string;
  /** Fond des champs en lecture (liens, codes…) */
  fieldBg: string;
  /** Survol des lignes et boutons discrets */
  hoverBg: string;
  cardShadow: string;
}

const LIGHT: DashPalette = {
  bg: '#fbfaff',
  surface: '#ffffff',
  surfaceAlt: '#faf9ff',
  border: '#eeebfb',
  txtPrim: '#16162e',
  txtLabel: '#2d2b45',
  txtSub: '#8a87a3',
  inputBg: '#faf9ff',
  inputBorder: '#e6e1fb',
  fieldBg: '#f7f5ff',
  hoverBg: '#f6f4ff',
  cardShadow: '0 2px 16px rgba(108,99,255,0.06)',
};

const DARK: DashPalette = {
  bg: '#0b0b1e',
  surface: '#12122b',
  surfaceAlt: '#191938',
  border: 'rgba(139,124,255,0.16)',
  txtPrim: '#f2f1ff',
  txtLabel: '#c7c5e8',
  txtSub: '#8c8ab0',
  inputBg: '#0d0d22',
  inputBorder: 'rgba(139,124,255,0.18)',
  fieldBg: 'rgba(139,124,255,0.06)',
  hoverBg: 'rgba(139,124,255,0.08)',
  cardShadow: 'none',
};

/** Couleurs du tableau de bord pour le mode demandé. */
export function dashPalette(dark: boolean): DashPalette {
  return dark ? DARK : LIGHT;
}
