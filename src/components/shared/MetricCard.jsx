import { useLang } from '@/contexts/LangContext';
import T, { t } from '@/lib/i18n';
import CornerOrnament from './CornerOrnament';

export default function MetricCard({ titleKey, value, icon, accent = 'terracotta', delay = 0 }) {
  const lang = useLang();
  const IconComponent = icon;
  const accents = {
    terracotta: { bg: 'bg-terracotta/8', text: 'text-terracotta', border: 'border-terracotta/20', icon: 'text-terracotta-light' },
    brass: { bg: 'bg-brass/8', text: 'text-brass-dark', border: 'border-brass/20', icon: 'text-brass' },
    forest: { bg: 'bg-forest/8', text: 'text-forest', border: 'border-forest/20', icon: 'text-forest-light' },
    ruby: { bg: 'bg-ruby/8', text: 'text-ruby', border: 'border-ruby/20', icon: 'text-ruby' },
    charcoal: { bg: 'bg-charcoal/5', text: 'text-charcoal', border: 'border-charcoal/10', icon: 'text-charcoal-light' },
    jade: { bg: 'bg-jade/8', text: 'text-jade', border: 'border-jade/20', icon: 'text-jade' },
  };
  const a = accents[accent] || accents.terracotta;
  return (
    <div className={`animate-float-in delay-${delay} relative group`}>
      <div className={`relative bg-ivory border ${a.border} rounded-xl p-3 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md overflow-hidden`}>
        <CornerOrnament position="top-right" />
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`p-1.5 rounded-lg ${a.bg}`}><IconComponent className={`w-3.5 h-3.5 ${a.icon}`} /></div>
          <p className={`text-[10px] text-smoke font-medium tracking-wide uppercase leading-tight ${lang === 'ta' ? 'font-tamil normal-case' : ''}`}>{t(T[titleKey], lang)}</p>
        </div>
        <p className={`font-display text-lg font-bold ${a.text} tracking-tight`}>{value}</p>
      </div>
    </div>
  );
}
