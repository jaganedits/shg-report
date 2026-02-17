import { NavLink, useLocation } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';
import T, { t } from '@/lib/i18n';
import { NAV_ITEMS } from '@/lib/constants';

export default function Sidebar() {
  const lang = useLang();
  const location = useLocation();

  return (
    <>
      {/* Desktop: horizontal top nav */}
      <nav className="hidden md:block sticky top-0 z-20 bg-ivory/80 backdrop-blur-md border-b border-sand">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide py-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname === '/' + item.id;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition-all duration-300 rounded-lg group',
                    isActive
                      ? 'text-terracotta-deep'
                      : 'text-smoke hover:text-charcoal hover:bg-sand/30'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5 transition-transform duration-300', isActive ? 'scale-110' : 'group-hover:scale-105')} />
                  <span className={lang === 'ta' ? 'font-tamil' : 'font-body'}>{t(T[item.key], lang)}</span>
                  {isActive && <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-gradient-to-r from-terracotta to-brass rounded-full animate-draw-line" />}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile: fixed bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ivory/95 backdrop-blur-md border-t border-sand">
        <div className="flex items-center justify-around px-1 py-1 pb-[env(safe-area-inset-bottom,4px)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname === '/' + item.id;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition-all duration-200 min-w-0 flex-1',
                  isActive
                    ? 'text-terracotta-deep'
                    : 'text-smoke'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive && 'scale-110')} />
                <span className={cn('text-[8px] font-medium truncate w-full text-center leading-tight', lang === 'ta' ? 'font-tamil' : 'font-body')}>
                  {t(T[item.key], lang)}
                </span>
                {isActive && <span className="absolute top-0 left-2 right-2 h-[2px] bg-gradient-to-r from-terracotta to-brass rounded-full" />}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
