import { Outlet } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import useSessionTimeout from '@/hooks/useSessionTimeout';
import Header from './Header';
import Sidebar from './Sidebar';
import KolamPattern from '@/components/shared/KolamPattern';

export default function MainLayout() {
  const lang = useLang();
  const { groupClosed } = useData();
  const { logout } = useAuth();
  useSessionTimeout(() => {
    toast({ title: 'Session expired. Please login again.', variant: 'destructive', duration: 5000 });
    logout();
  });

  return (
    <div className={`min-h-screen bg-cream flex flex-col ${groupClosed ? 'opacity-75' : ''}`}>
      <Header />
      <Sidebar />

      <main className="max-w-7xl mx-auto px-3 md:px-5 py-4 md:py-5 w-full flex-1 pb-20 md:pb-5">
        <Outlet />
      </main>

      <footer className="border-t border-sand mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between text-[10px] text-smoke">
          <KolamPattern className="w-20 text-sand-dark" />
          <span className={lang === 'ta' ? 'font-tamil' : ''}>
            {lang === 'ta' ? 'ஸ்ரீ அன்னை மகளிர் சுய உதவி குழு' : 'Shree Annai Women Self Help Group'}
          </span>
          <span className="flex items-center gap-2">
            Powered by{' '}
            <a href="https://github.com/jaganedits" target="_blank" rel="noopener noreferrer" className="text-charcoal hover:text-terracotta transition-colors font-semibold">jaganedits</a>
            <a href="https://www.linkedin.com/in/jaganedits/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-smoke hover:text-terracotta transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </span>
        </div>
      </footer>

    </div>
  );
}
