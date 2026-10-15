import { dashPalette } from '../../../../lib/dashPalette';
import { useLang } from '../../../../lib/LanguageContext';
import { useAppPrefs } from '../../../../lib/AppPrefsContext';

/** Classes communes des champs et libellés de l'onglet « Mon lien bio ». */
export const INPUT_CLS = 'w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25';
export const LABEL_CLS = 'block text-xs font-semibold mb-1 uppercase tracking-wide';

/** Palette, langue et traductions de l'onglet. */
export function useBioTheme() {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  return { t, lang, fr: lang === 'fr', dk, ...dashPalette(dk), btnEdit: dk ? 'rgba(108,99,255,0.14)' : '#f0eeff' };
}
