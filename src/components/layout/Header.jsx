import { Calendar, Users, LogOut, AlertTriangle } from 'lucide-react';
import { useLang, useLangContext } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import KolamPattern from '@/components/shared/KolamPattern';
import AvatarDropdownMenu from '@/components/shared/AvatarDropdownMenu';

export default function Header() {
  const lang = useLang();
  const { setLang } = useLangContext();
  const { user, logout } = useAuth();
  const { members, selectedYear, setSelectedYear, years, groupClosed, groupInfo } = useData();

  if (!user) return (
    <header className="relative overflow-hidden bg-terracotta-deep text-cream grain">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-brass/10 rounded-full blur-3xl" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-terracotta-light/15 rounded-full blur-2xl" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-3 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-12 rounded bg-cream/10 shrink-0 hidden md:block" />
            <div>
              <div className="h-5 bg-cream/20 rounded w-52 mb-2" />
              <div className="h-2.5 bg-cream/10 rounded w-36" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 bg-cream/10 border border-cream/15 rounded-lg hidden md:block" style={{ width: 72 }} />
            <div className="w-9 h-9 rounded-full bg-cream/15" />
            <div className="h-8 bg-cream/10 border border-cream/15 rounded-lg" style={{ width: 72 }} />
          </div>
        </div>
      </div>
      <div className="kolam-border" />
    </header>
  );

  return (
    <>
      {groupClosed && (
        <div className="bg-ruby text-cream text-center py-2 text-xs font-medium">
          <AlertTriangle className="inline w-3.5 h-3.5 mr-1" />
          {t(T.groupClosedBanner, lang)}
        </div>
      )}
      <header className="relative overflow-hidden bg-terracotta-deep text-cream grain">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brass/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-terracotta-light/15 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo + Group Name */}
            <div className="flex items-center gap-3 min-w-0 animate-fade-right">
              <KolamPattern className="w-12 md:w-14 text-brass-light shrink-0 hidden md:block" />
              <div className="min-w-0">
                {lang === 'ta' ? (
                  <>
                    <h1 className="font-tamil text-sm md:text-lg font-bold tracking-tight leading-tight truncate">
                      ஸ்ரீ அன்னை மகளிர் <span className="text-brass-light">சுய உதவி குழு</span>
                    </h1>
                    <p className="text-[10px] md:text-[11px] text-cream/50 mt-0.5 uppercase tracking-wide truncate">
                      {groupInfo.nameEN}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="font-display text-sm md:text-lg font-bold tracking-tight leading-tight truncate">
                      Shree Annai Women <span className="text-brass-light">Self Help Group</span>
                    </h1>
                    <p className="font-tamil text-[10px] md:text-[11px] text-cream/50 mt-0.5 truncate">
                      {groupInfo.nameTA}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right: Year + Avatar + Logout — all h-9 rounded-lg uniform */}
            <div className="flex items-center gap-2 shrink-0 animate-fade-up delay-3">
              {/* Year badge - desktop only */}
              <div className="hidden md:flex items-center gap-1.5 h-9 bg-cream/10 border border-cream/15 rounded-lg px-3">
                <Calendar className="w-3.5 h-3.5 text-brass-light" />
                <span className="font-display text-sm font-bold text-cream/90">{selectedYear}</span>
              </div>

              {/* Avatar dropdown */}
              <AvatarDropdownMenu
                user={user} lang={lang} setLang={setLang}
                selectedYear={selectedYear} years={years}
                onYearChange={setSelectedYear}
              />

              {/* Logout */}
              <Button onClick={logout} variant="ghost" size="sm" aria-label={t(T.logout, lang)}
                className="bg-cream/10 hover:bg-ruby/20 border border-cream/15 hover:border-ruby/30 text-cream/70 hover:text-cream h-9 rounded-lg px-2.5"
                title={t(T.logout, lang)}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline ml-1 text-xs">{t(T.logout, lang)}</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="kolam-border" />
      </header>
    </>
  );
}
