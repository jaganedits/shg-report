import { ChevronDown, Shield, User, Globe, Languages, Calendar, Sun, Moon } from 'lucide-react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import T, { t } from '@/lib/i18n';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AvatarDropdownMenu({ user, lang, setLang, selectedYear, years, onYearChange }) {
  const { theme, setTheme } = useThemeContext();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 bg-cream/10 hover:bg-cream/20 border border-cream/15 rounded-lg h-9 px-2 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-brass/30">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-[11px]">{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-[11px] font-semibold text-cream/90 leading-tight">{user.fullName || user.username}</p>
            <p className="text-[9px] text-cream/45 flex items-center gap-1">
              {user.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
              {user.role === 'admin' ? t(T.admin, lang) : t(T.member, lang)}
            </p>
          </div>
          <ChevronDown className="w-3 h-3 text-cream/50" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-0">
        <ScrollArea className="max-h-[70vh]">
          <div className="px-4 py-3 bg-cream-dark/40">
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="text-sm bg-gradient-to-br from-terracotta to-brass shadow-md">{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-semibold text-charcoal">{user.fullName || user.username}</p>
                <p className="text-[10px] text-smoke">@{user.username}</p>
                <Badge variant={user.role === 'admin' ? 'admin' : 'member'} className="mt-0.5">
                  {user.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                  {user.role === 'admin' ? t(T.admin, lang) : t(T.member, lang)}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="px-3 pt-2">{t(T.switchYear, lang)}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
            {years.map(y => (
              <DropdownMenuRadioItem key={y} value={String(y)} className="font-display font-bold text-[11px]">
                {y}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="px-3 pt-1">{t(T.language, lang)}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setLang('en')} className={lang === 'en' ? 'bg-terracotta-deep/10 text-terracotta-deep font-semibold' : ''}>
            <Globe className="w-3 h-3" /> English
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLang('ta')} className={cn('font-tamil pb-1', lang === 'ta' ? 'bg-terracotta-deep/10 text-terracotta-deep font-semibold' : '')}>
            <Languages className="w-3 h-3" /> தமிழ்
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="px-3 pt-1">{t(T.theme, lang)}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setTheme('light')} className={theme === 'light' ? 'bg-terracotta-deep/10 text-terracotta-deep font-semibold' : ''}>
            <Sun className="w-3 h-3" /> {t(T.lightMode, lang)}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')} className={theme === 'dark' ? 'bg-terracotta-deep/10 text-terracotta-deep font-semibold' : ''}>
            <Moon className="w-3 h-3" /> {t(T.darkMode, lang)}
          </DropdownMenuItem>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
