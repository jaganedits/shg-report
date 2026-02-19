import { Heart, Calendar, Users, Target, Star, Sparkles } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { SectionHeader, ECard, ECardHeader, KolamPattern } from '@/components/shared';
import founderImg from '@/assets/founder.webp';

function formatDate(dateStr, lang) {
  const [d, m, y] = dateStr.split('-');
  const date = new Date(+y, +m - 1, +d);
  return date.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calculateAge(dateStr) {
  const [d, m, y] = dateStr.split('-');
  const dob = new Date(+y, +m - 1, +d);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
  return age;
}

export default function AboutPage() {
  const lang = useLang();
  const { members } = useData();
  const founderDOB = '11-10-1975';
  const founderAge = calculateAge(founderDOB);
  const memberCount = members?.length || 0;

  return (
    <div className="space-y-5">
      <SectionHeader titleKey="aboutUs" subtitle={t(T.aboutUsDesc, lang)} />

      {/* Founder Section */}
      <ECard delay={1}>
        <ECardHeader titleKey="founder" />
        <div className="px-4 pb-5 pt-3">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
            {/* Founder Photo */}
            <div className="shrink-0 relative group">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border-2 border-brass/30 shadow-md">
                <img
                  src={founderImg}
                  alt={lang === 'ta' ? 'சுசிலா — நிறுவனர்' : 'Susila — Founder'}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-terracotta-deep text-cream text-[9px] font-medium px-3 py-0.5 rounded-full whitespace-nowrap">
                {t(T.founder, lang)}
              </div>
            </div>

            {/* Founder Details */}
            <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
              <div>
                <h3 className={`font-display text-xl md:text-2xl font-bold text-terracotta-deep ${lang === 'ta' ? 'font-tamil' : ''}`}>
                  {lang === 'ta' ? 'சுசிலா' : 'Susila'}
                </h3>
                <p className="text-[11px] text-smoke mt-0.5">
                  {t(T.founderOf, lang)}
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 bg-brass/8 text-brass-dark px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3 h-3" />
                  {formatDate(founderDOB, lang)}
                </span>
                <span className="flex items-center gap-1.5 bg-forest/8 text-forest px-2.5 py-1 rounded-lg">
                  <Heart className="w-3 h-3" />
                  {t(T.age, lang)}: {founderAge}
                </span>
                <span className="flex items-center gap-1.5 bg-terracotta/8 text-terracotta px-2.5 py-1 rounded-lg">
                  <Users className="w-3 h-3" />
                  {t(T.groupMember, lang)}
                </span>
              </div>

              {/* Founder Thought */}
              <div className="bg-brass/5 border border-brass/15 rounded-xl px-4 py-3 mt-3">
                <p className={`font-tamil text-xs text-terracotta-deep/80 leading-relaxed italic ${lang === 'ta' ? '' : 'hidden'}`}>
                  "ஒற்றுமையாக சேமித்தால், எந்த கஷ்டத்தையும் வெல்லலாம். பெண்களின் கையில் பணம் இருந்தால், குடும்பம் செழிக்கும்."
                </p>
                <p className={`text-xs text-terracotta-deep/80 leading-relaxed italic ${lang === 'ta' ? 'mt-1.5 text-[10px] text-smoke/60' : ''}`}>
                  "When we save together in unity, we can overcome any hardship. When women hold the finances, families prosper."
                </p>
                <p className="text-[9px] text-brass/50 mt-2 tracking-wider text-right">
                  — {lang === 'ta' ? 'சுசிலா' : 'Susila'}, {t(T.founder, lang)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ECard>

      {/* About the Group */}
      <ECard delay={2}>
        <ECardHeader titleKey="aboutGroup" />
        <div className="px-4 pb-5 pt-3 space-y-4">
          <p className={`text-xs text-charcoal-light leading-relaxed ${lang === 'ta' ? 'font-tamil' : ''}`}>
            {t(T.aboutGroupDesc, lang)}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-terracotta/6 border border-terracotta/15 rounded-xl px-3 py-3 text-center">
              <Calendar className="w-4 h-4 text-terracotta mx-auto mb-1.5" />
              <p className="font-display text-lg font-bold text-terracotta-deep">2019</p>
              <p className={`text-[10px] text-smoke ${lang === 'ta' ? 'font-tamil' : ''}`}>{t(T.established, lang)}</p>
            </div>
            <div className="bg-brass/6 border border-brass/15 rounded-xl px-3 py-3 text-center">
              <Users className="w-4 h-4 text-brass-dark mx-auto mb-1.5" />
              <p className="font-display text-lg font-bold text-brass-dark">{memberCount}</p>
              <p className={`text-[10px] text-smoke ${lang === 'ta' ? 'font-tamil' : ''}`}>{t(T.totalMembers, lang)}</p>
            </div>
            <div className="bg-forest/6 border border-forest/15 rounded-xl px-3 py-3 text-center">
              <Target className="w-4 h-4 text-forest mx-auto mb-1.5" />
              <p className={`font-display text-sm font-bold text-forest ${lang === 'ta' ? 'font-tamil text-xs' : ''}`}>{t(T.savingsGoal, lang)}</p>
              <p className={`text-[10px] text-smoke ${lang === 'ta' ? 'font-tamil' : ''}`}>{t(T.mission, lang)}</p>
            </div>
            <div className="bg-jade/6 border border-jade/15 rounded-xl px-3 py-3 text-center">
              <Star className="w-4 h-4 text-jade mx-auto mb-1.5" />
              <p className={`font-display text-sm font-bold text-jade ${lang === 'ta' ? 'font-tamil text-xs' : ''}`}>{t(T.womenPower, lang)}</p>
              <p className={`text-[10px] text-smoke ${lang === 'ta' ? 'font-tamil' : ''}`}>{t(T.strength, lang)}</p>
            </div>
          </div>
        </div>
      </ECard>

      {/* Our Vision */}
      <ECard delay={3}>
        <ECardHeader titleKey="ourVision" />
        <div className="px-4 pb-5 pt-3 space-y-3">
          {[
            { icon: Sparkles, key: 'vision1', wrap: 'bg-terracotta/5 border-terracotta/12', box: 'bg-terracotta/10', ico: 'text-terracotta' },
            { icon: Heart, key: 'vision2', wrap: 'bg-ruby/5 border-ruby/12', box: 'bg-ruby/10', ico: 'text-ruby' },
            { icon: Users, key: 'vision3', wrap: 'bg-forest/5 border-forest/12', box: 'bg-forest/10', ico: 'text-forest' },
          ].map(({ icon: Icon, key, wrap, box, ico }) => (
            <div key={key} className={`flex items-start gap-3 border rounded-xl px-3 py-2.5 ${wrap}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${box}`}>
                <Icon className={`w-3.5 h-3.5 ${ico}`} />
              </div>
              <p className={`text-xs text-charcoal-light leading-relaxed ${lang === 'ta' ? 'font-tamil' : ''}`}>
                {t(T[key], lang)}
              </p>
            </div>
          ))}
        </div>
      </ECard>

      {/* Decorative footer */}
      <div className="flex justify-center py-2 animate-fade-up delay-4">
        <KolamPattern className="w-28 text-sand-dark" />
      </div>
    </div>
  );
}
