import { Globe } from 'lucide-react';
import { useLang } from '../../lib/LanguageContext';

export default function LanguageSelector({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Globe size={14} className="text-gray-400" />
      <button
        onClick={() => setLang('fr')}
        className={`text-xs px-2 py-0.5 rounded-full transition-all ${
          lang === 'fr'
            ? 'bg-blue-600 text-white font-semibold'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {t.french}
      </button>
      <span className="text-gray-600 text-xs">|</span>
      <button
        onClick={() => setLang('en')}
        className={`text-xs px-2 py-0.5 rounded-full transition-all ${
          lang === 'en'
            ? 'bg-blue-600 text-white font-semibold'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {t.english}
      </button>
    </div>
  );
}
