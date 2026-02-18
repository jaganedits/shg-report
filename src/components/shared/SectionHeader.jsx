import { useLang } from '@/contexts/LangContext';
import T, { t } from '@/lib/i18n';

export default function SectionHeader({ titleKey, subtitle }) {
  const lang = useLang();
  return (
    <div className="animate-fade-up mb-4">
      <h2 className={`font-display text-lg md:text-xl font-bold text-charcoal tracking-tight ${lang === 'ta' ? 'font-tamil' : ''}`}>{t(T[titleKey], lang)}</h2>
      {subtitle && <p className="text-[11px] text-smoke mt-0.5">{subtitle}</p>}
      <div className="kolam-border mt-2" />
    </div>
  );
}
