import { Globe } from 'lucide-react';

export default function LangToggle({ lang, setLang, variant = 'dark' }) {
  const isDark = variant === 'dark';
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
      className={`
        flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300
        ${isDark
          ? 'bg-cream/10 hover:bg-cream/20 text-cream/80 hover:text-cream border border-cream/15'
          : 'bg-terracotta/8 hover:bg-terracotta/15 text-terracotta border border-terracotta/20'
        }
      `}
      title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
    >
      <Globe className="w-3 h-3" />
      <span className={`transition-all duration-300 ${lang === 'ta' ? 'font-tamil' : ''}`}>
        {lang === 'en' ? 'தமிழ்' : 'EN'}
      </span>
    </button>
  );
}
