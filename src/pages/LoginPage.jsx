import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang, useLangContext } from '@/contexts/LangContext';
import T, { t } from '@/lib/i18n';
import { GROUP_INFO } from '@/data/sampleData';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import LangToggle from '@/components/shared/LangToggle';
import KolamPattern from '@/components/shared/KolamPattern';
import CornerOrnament from '@/components/shared/CornerOrnament';
import FormInput from '@/components/shared/FormInput';
import PasswordInput from '@/components/shared/PasswordInput';

export default function LoginPage() {
  const navigate = useNavigate();
  const lang = useLang();
  const { setLang } = useLangContext();
  const { login, isAuthenticated, canUseLocalAuthFallback, configurationError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/overview', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: t(T.loginError, lang), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (result?.error) { toast({ title: result.error, variant: 'destructive' }); setSubmitting(false); return; }
      if (!result?.success) navigate('/overview');
    } catch {
      toast({ title: t(T.loginError, lang), variant: 'destructive' });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-terracotta via-brass to-forest" />
      <div className="absolute -right-32 -top-32 w-96 h-96 bg-brass/5 rounded-full blur-3xl" />
      <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl" />

      <div className="absolute top-4 right-4 z-10">
        <LangToggle lang={lang} setLang={setLang} variant="light" />
      </div>

      <div className="w-full max-w-sm relative animate-scale-in">
        <div className="text-center mb-5">
          <KolamPattern className="w-28 text-brass mx-auto mb-3" />
          <h1 className={`font-display text-xl font-bold text-charcoal leading-snug ${lang === 'ta' ? 'font-tamil' : ''}`}>
            {t(T.loginTitle1, lang)}
          </h1>
          <h2 className={`font-display text-lg text-terracotta font-semibold ${lang === 'ta' ? 'font-tamil' : ''}`}>
            {t(T.loginTitle2, lang)}
          </h2>
          {lang === 'ta' && <p className="text-[10px] text-smoke mt-1 uppercase tracking-widest">{GROUP_INFO.nameEN}</p>}
          {lang === 'en' && <p className="font-tamil text-[11px] text-smoke mt-1">{GROUP_INFO.nameTA}</p>}
        </div>

        <div className="bg-ivory border border-sand rounded-xl p-5 relative overflow-hidden">
          <CornerOrnament position="top-left" />
          <CornerOrnament position="bottom-right" />

          {configurationError && (
            <div className="bg-ruby/8 text-ruby border border-ruby/20 rounded-lg px-3 py-2 text-[11px] flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {configurationError}
            </div>
          )}

          {canUseLocalAuthFallback && (
            <div className="bg-brass/8 text-brass-dark border border-brass/25 rounded-lg px-3 py-2 text-[11px] flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {t(T.devModeWarning, lang)}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-terracotta/8">
              <Lock className="w-3.5 h-3.5 text-terracotta" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-charcoal">{t(T.login, lang)}</h3>
              <p className="text-[9px] text-smoke">{t(T.loginContinue, lang)}</p>
            </div>
          </div>

          <div className="kolam-border mb-4" />

          <form onSubmit={handleLogin} className="space-y-3">
            <FormInput label={t(T.username, lang)} value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t(T.enterUsername, lang)} icon={User} />
            <PasswordInput label={t(T.password, lang)} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t(T.enterPassword, lang)} />

            <Button
              type="submit"
              disabled={submitting || (!!configurationError && !canUseLocalAuthFallback)}
              className="w-full py-2.5 shadow-lg shadow-terracotta/20 hover:shadow-terracotta/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <LogIn className="w-4 h-4" /> {submitting ? '...' : t(T.login, lang)}
            </Button>
          </form>
        </div>

        <div className="text-center mt-3 space-y-1.5">
          <KolamPattern className="w-20 text-sand-dark mx-auto" />
          <p className="text-[10px] text-smoke flex items-center justify-center gap-1.5">
            Powered by{' '}
            <a href="https://github.com/jaganedits" target="_blank" rel="noopener noreferrer" className="text-charcoal hover:text-terracotta transition-colors font-semibold">jaganedits</a>
            <a href="https://www.linkedin.com/in/jaganedits/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-smoke hover:text-terracotta transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
