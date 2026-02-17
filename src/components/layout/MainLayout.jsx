import { Outlet } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast, toast } from '@/hooks/use-toast';
import useSessionTimeout from '@/hooks/useSessionTimeout';
import { ToastContainer } from '@/components/ui/toast';
import Header from './Header';
import Sidebar from './Sidebar';
import KolamPattern from '@/components/shared/KolamPattern';

export default function MainLayout() {
  const lang = useLang();
  const { groupClosed } = useData();
  const { logout } = useAuth();
  const { toasts, dismiss } = useToast();

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
        </div>
      </footer>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
