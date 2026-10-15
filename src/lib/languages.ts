import type { LandingLang } from './landingTranslations';

export interface LangOption { code: LandingLang; label: string }

/** Langues proposées dans tous les sélecteurs de l'application. */
export const LANG_OPTIONS: LangOption[] = [
  { code: 'fr', label: '🇫🇷 Français'  },
  { code: 'en', label: '🇬🇧 English'   },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'de', label: '🇩🇪 Deutsch'   },
];
