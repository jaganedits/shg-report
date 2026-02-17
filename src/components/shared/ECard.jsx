import CornerOrnament from './CornerOrnament';
import { useLang } from '@/contexts/LangContext';
import T, { t } from '@/lib/i18n';

export function ECard({ children, className = '', delay = 0 }) {
  return (
    <div className={`animate-scale-in delay-${delay} bg-ivory border border-sand rounded-xl overflow-hidden relative ${className}`}>
      <CornerOrnament position="top-left" />
      <CornerOrnament position="bottom-right" />
      {children}
    </div>
  );
}

export function ECardHeader({ titleKey, title, action }) {
  const lang = useLang();
  return (
    <div className="px-4 pt-3 pb-2 border-b border-sand/60 flex items-center justify-between gap-2 flex-wrap">
      <h3 className={`font-display text-sm font-semibold text-charcoal min-w-0 truncate ${lang === 'ta' ? 'font-tamil' : ''}`}>{titleKey ? t(T[titleKey], lang) : title}</h3>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
