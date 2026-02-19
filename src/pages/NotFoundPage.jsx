import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import T, { t } from '@/lib/i18n';

export default function NotFoundPage() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-terracotta-deep flex items-center justify-center">
          <span className="text-2xl font-bold text-cream-dark font-serif">SA</span>
        </div>
        <h1 className="text-6xl font-bold text-terracotta-deep mb-2">404</h1>
        <p className="text-xl text-terracotta-deep font-semibold mb-2">
          {t(T.pageNotFound, lang)}
        </p>
        <p className="text-smoke mb-6">
          {t(T.pageNotFoundDesc, lang)}
        </p>
        <Link
          to="/overview"
          className="inline-block px-6 py-2.5 bg-terracotta-deep text-cream rounded-xl font-medium hover:bg-terracotta transition-colors"
        >
          {t(T.goHome, lang)}
        </Link>
      </div>
    </div>
  );
}
