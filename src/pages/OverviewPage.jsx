import { Wallet, TrendingUp, CreditCard, IndianRupee, Calendar, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import { MetricCard, SectionHeader, ECard, ECardHeader, CustomTooltip, RecentActivity, PageSkeleton } from '@/components/shared';

export default function OverviewPage() {
  const lang = useLang();
  const { currentData: data, summary, selectedYear: year, members } = useData();

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
      <SectionHeader titleKey="annualReport" subtitle={`${t(T.completeSummary, lang)} — ${year}`} />
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
          <div className="p-3 md:p-4">
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
          <div className="p-3 md:p-4">
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
          <div className="p-3 md:p-4">
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
