import { useMemo } from 'react';
import { Wallet, TrendingUp, CreditCard, IndianRupee, Calendar, FileSpreadsheet, AlertTriangle, Quote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import { MetricCard, SectionHeader, ECard, ECardHeader, CustomTooltip, RecentActivity, PageSkeleton } from '@/components/shared';

const HAPPY_DAYS = [T.happySunday, T.happyMonday, T.happyTuesday, T.happyWednesday, T.happyThursday, T.happyFriday, T.happySaturday];

const QUOTES = [
  { ta: 'அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு', en: 'As "A" is the first of all letters, so is the Eternal God first in the world.', kural: 1 },
  { ta: 'ஒருமையுள் ஆமைபோல் ஐந்தடக்கல் ஆற்றின்\nஎழுமையும் ஏமாப்பு உடைத்து', en: 'Who curbs the five senses in one birth, finds strength for seven.', kural: 126 },
  { ta: 'உடையர் எனப்படுவது ஊக்கம் அஃதிலார்\nஉடையது உடையரோ மற்று', en: 'The possession called courage is the true wealth; all else is nothing.', kural: 591 },
  { ta: 'ஆக்கம் அதர்வினாய்ச் செல்லும் அசைவிலா\nஊக்கம் உடையான் உழை', en: 'Prosperity seeks the path to those who possess unwavering perseverance.', kural: 594 },
  { ta: 'அருளில்லார்க்கு அவ்வுலகம் இல்லை\nபொருளில்லார்க்கு இவ்வுலகம் இல்லாகி யாங்கு', en: 'As the graceless have no afterworld, so the resourceless have none in this.', kural: 247 },
  { ta: 'சேமிப்பு என்பது சிறந்த அணிகலன்\nபெண்ணின் கையில் பேராற்றல் தரும்', en: 'Savings is the finest ornament — in a woman\'s hand, it becomes great power.', kural: 0 },
  { ta: 'ஒற்றுமையே வலிமை, வலிமையே வெற்றி\nவெற்றியே வாழ்வின் அடிப்படை', en: 'Unity is strength, strength is victory, and victory is the foundation of life.', kural: 0 },
];

function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

function getGreeting(lang) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Primary: time-based greeting
  let primary;
  if (hour >= 5 && hour < 12) primary = t(T.goodMorning, lang);
  else if (hour >= 12 && hour < 17) primary = t(T.goodAfternoon, lang);
  else primary = t(T.goodEvening, lang);

  // Secondary: day-based or general (rotate based on day)
  const secondary = t(HAPPY_DAYS[day], lang);

  return { primary, secondary };
}

export default function OverviewPage() {
  const lang = useLang();
  const { currentData: data, summary, selectedYear: year, members } = useData();
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(lang), [lang]);
  const quote = useMemo(() => getDailyQuote(), []);

  if (!data || !summary) return <PageSkeleton type="dashboard" />;

  const savingsChart = data.months.map(m => ({ name: m.month.substring(0, 3), saving: m.totalSaving, cumulative: m.totalCumulative }));
  const loanChart = data.months.map(m => ({ name: m.month.substring(0, 3), loans: m.members.reduce((s, mem) => s + mem.loanTaken, 0), interest: m.members.reduce((s, mem) => s + mem.interest, 0) }));

  const overdueMembers = [];
  const lastMonth = data.months[data.months.length - 1];
  if (lastMonth) {
    lastMonth.members.forEach(mem => {
      if ((mem.balance || mem.loanBalance || 0) > 0) {
        // Count consecutive months with outstanding balance
        let overdueMonths = 0;
        for (let i = data.months.length - 1; i >= 0; i--) {
          const m = data.months[i].members.find(mm => mm.memberId === mem.memberId);
          if (m && (m.balance || m.loanBalance || 0) > 0) overdueMonths++;
          else break;
        }
        if (overdueMonths >= 2) {
          const info = members.find(m => m.id === mem.memberId);
          overdueMembers.push({
            name: lang === 'ta' && info?.nameTA ? info.nameTA : info?.name || `#${mem.memberId}`,
            balance: mem.balance || mem.loanBalance || 0,
            months: overdueMonths,
          });
        }
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Welcome greeting */}
      <div className="animate-fade-up mb-1">
        <h2 className={`font-display text-lg md:text-xl font-bold text-charcoal tracking-tight ${lang === 'ta' ? 'font-tamil' : ''}`}>
          {greeting.primary}, {lang === 'ta' && user?.fullNameTA ? user.fullNameTA : user?.fullName || user?.username} 👋
        </h2>
        <p className="text-[11px] text-smoke mt-0.5">{greeting.secondary} · {t(T.completeSummary, lang)} — {year}</p>
        <div className="kolam-border mt-2" />
      </div>

      {/* Today's Quote */}
      <div className="animate-fade-up delay-1 bg-brass/5 border border-brass/15 rounded-xl px-4 py-3 flex gap-3 items-start">
        <Quote className="w-5 h-5 text-brass/40 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-tamil text-[11px] text-terracotta-deep/80 leading-relaxed whitespace-pre-line">{quote.ta}</p>
          <p className="text-[9px] text-smoke/60 mt-1 leading-relaxed">{quote.en}</p>
          {quote.kural > 0 && <p className="text-[8px] text-brass/50 mt-1 tracking-wider">— {lang === 'ta' ? 'திருக்குறள்' : 'Thirukkural'} {quote.kural}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        <MetricCard titleKey="totalSavings" value={formatCurrency(summary.totalSavings)} icon={Wallet} accent="terracotta" delay={1} />
        <MetricCard titleKey="cumulativeFund" value={formatCurrency(summary.finalCumulative)} icon={TrendingUp} accent="brass" delay={2} />
        <MetricCard titleKey="totalLoans" value={formatCurrency(summary.totalLoans)} icon={CreditCard} accent="ruby" delay={3} />
        <MetricCard titleKey="interestEarned" value={formatCurrency(summary.totalInterest)} icon={IndianRupee} accent="forest" delay={4} />
        <MetricCard titleKey="activeMonths" value={summary.activeSavingMonths} icon={Calendar} accent="charcoal" delay={5} />
        <MetricCard titleKey="loansIssued" value={summary.loansIssued} icon={FileSpreadsheet} accent="jade" delay={6} />
      </div>

      {overdueMembers.length > 0 && (
        <ECard delay={2} className="border-ruby/20 bg-ruby/3">
          <ECardHeader titleKey="overdueLoans" />
          <div className="px-4 pb-4 space-y-2">
            {overdueMembers.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-ruby/5 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-charcoal">{m.name}</p>
                  <p className="text-[10px] text-ruby">{m.months} {t(T.monthsOverdue, lang)}</p>
                </div>
                <span className="font-mono text-xs font-bold text-ruby">{formatCurrency(m.balance)}</span>
              </div>
            ))}
          </div>
        </ECard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
        <ECard className="lg:col-span-3" delay={3}>
          <ECardHeader titleKey="monthlySavingsFlow" />
          <div className="p-3 md:p-4" role="img" aria-label={t(T.monthlySavingsFlow, lang)}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={savingsChart} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A8380' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8A8380' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="saving" fill="#A0522D" radius={[6, 6, 0, 0]} name={t(T.monthlySaving, lang)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ECard>
        <ECard className="lg:col-span-2" delay={4}>
          <ECardHeader titleKey="cumulativeGrowth" />
          <div className="p-3 md:p-4" role="img" aria-label={t(T.cumulativeGrowth, lang)}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={savingsChart}>
                <defs><linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C69749" stopOpacity={0.3} /><stop offset="95%" stopColor="#C69749" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A8380' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8A8380' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cumulative" stroke="#C69749" strokeWidth={2.5} fill="url(#cumGrad)" name={t(T.cumulative, lang)} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ECard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
        <ECard className="lg:col-span-3" delay={5}>
          <ECardHeader titleKey="loanActivity" />
          <div className="p-3 md:p-4" role="img" aria-label={t(T.loanActivity, lang)}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={loanChart} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A8380' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8A8380' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="loans" fill="#9B2335" radius={[6, 6, 0, 0]} name={t(T.loansTaken, lang)} />
                <Bar dataKey="interest" fill="#2E7D5B" radius={[6, 6, 0, 0]} name={t(T.interest, lang)} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center text-[10px] text-smoke">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-ruby" /> {t(T.loansTaken, lang)}</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-jade" /> {t(T.interest, lang)}</span>
            </div>
          </div>
        </ECard>

        {/* Recent Activity */}
        <ECard className="lg:col-span-2" delay={6}>
          <ECardHeader titleKey="recentActivity" />
          <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
            <RecentActivity count={15} />
          </div>
        </ECard>
      </div>
    </div>
  );
}
