import { dashPalette } from '../../../../lib/dashPalette';
import { useLang } from '../../../../lib/LanguageContext';
import { useAppPrefs } from '../../../../lib/AppPrefsContext';

/** Palette et langue partagées par les éléments d'un service. */
export function useServiceTheme() {
  const { lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  return { fr: lang === 'fr', dk, ...dashPalette(dk) };
}