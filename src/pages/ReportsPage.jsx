import { useState } from 'react';
import { Calendar, BarChart2, Download, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import { getYearSummary } from '@/data/sampleData';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SectionHeader, ECard, ECardHeader, CustomTooltip, TH, TD, SearchableSelect, PageSkeleton } from '@/components/shared';

export default function ReportsPage() {
  const lang = useLang();
  const { currentData: data, members, allYearsData, selectedYear: year } = useData();
  const [view, setView] = useState('monthly');
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const years = Object.keys(allYearsData).map(Number).sort();

  if (!data) return <PageSkeleton type="table" />;

  const getMonthlyData = (memberId) => {
    return data.months.map(m => {
      if (memberId === 'all') {
        return {
          month: m.month, saving: m.totalSaving, cumulative: m.totalCumulative,
          newLoan: m.members.reduce((s, mem) => s + mem.loanTaken, 0),
          oldLoan: m.members.reduce((s, mem) => s + (mem.oldLoan || 0), 0),
          repayment: m.members.reduce((s, mem) => s + mem.loanRepayment, 0),
          oldInterest: m.members.reduce((s, mem) => s + (mem.oldInterest || 0), 0),
          currentInterest: m.members.reduce((s, mem) => s + (mem.currentInterest || mem.interest || 0), 0),
          balance: m.members.reduce((s, mem) => s + (mem.balance || mem.loanBalance || 0), 0),
        };
      }
      const mem = m.members.find(mm => mm.memberId === Number(memberId));
      return {
        month: m.month, saving: mem?.saving || 0, cumulative: mem?.cumulative || 0,
        newLoan: mem?.loanTaken || 0, oldLoan: mem?.oldLoan || 0,
        repayment: mem?.loanRepayment || 0, oldInterest: mem?.oldInterest || 0,
        currentInterest: mem?.currentInterest || mem?.interest || 0,
        balance: mem?.balance || mem?.loanBalance || 0,
      };
    });
  };

  const getYearlyData = (memberId) => {
    return years.map(y => {
      const yd = allYearsData[y];
      if (!yd) return { year: y, saving: 0, cumulative: 0, newLoan: 0, currentInterest: 0 };
      if (memberId === 'all') {
        const s = getYearSummary(yd);
        return { year: y, saving: s.totalSavings, cumulative: s.finalCumulative, newLoan: s.totalLoans, currentInterest: s.totalInterest };
      }
      const totalSaving = yd.months.reduce((s, m) => { const mem = m.members.find(mm => mm.memberId === Number(memberId)); return s + (mem?.saving || 0); }, 0);
      const totalLoan = yd.months.reduce((s, m) => { const mem = m.members.find(mm => mm.memberId === Number(memberId)); return s + (mem?.loanTaken || 0); }, 0);
      const totalInterest = yd.months.reduce((s, m) => { const mem = m.members.find(mm => mm.memberId === Number(memberId)); return s + (mem?.currentInterest || mem?.interest || 0); }, 0);
      const lastMonth = yd.months[yd.months.length - 1];
      const lastMem = lastMonth?.members.find(mm => mm.memberId === Number(memberId));
      return { year: y, saving: totalSaving, cumulative: lastMem?.cumulative || 0, newLoan: totalLoan, currentInterest: totalInterest };
    });
  };

  const monthlyData = getMonthlyData(selectedMemberId);
  const yearlyData = getYearlyData(selectedMemberId);
  const memberName = selectedMemberId === 'all'
    ? t(T.allMembers, lang)
    : (() => { const m = members.find(mm => mm.id === Number(selectedMemberId)); return lang === 'ta' && m?.nameTA ? m.nameTA : m?.name || ''; })();

  const exportToExcel = () => {
    import('xlsx').then(XLSX => {
      const wsData = view === 'monthly' ? monthlyData : yearlyData;
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, view === 'monthly' ? 'Monthly' : 'Yearly');
      XLSX.utils.sheet_add_aoa(ws, [[`${memberName} — ${view === 'monthly' ? 'Monthly' : 'Yearly'} Report (${year})`]], { origin: -1 });
      XLSX.writeFile(wb, `SHG_Report_${memberName}_${year}.xlsx`);
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader titleKey="memberReports" subtitle={t(T.memberWiseReport, lang)} />
      <div className="animate-fade-up delay-1 flex flex-wrap items-end gap-2 md:gap-3">
        <div className="w-full md:w-auto">
          <Label className="mb-1 block">{t(T.selectMember, lang)}</Label>
          <SearchableSelect
            value={selectedMemberId}
            onChange={setSelectedMemberId}
            options={members.map(m => ({
              value: String(m.id),
              label: lang === 'ta' && m.nameTA ? m.nameTA : m.name,
              id: m.id,
            }))}
            allLabel={t(T.allMembers, lang)}
            placeholder={t(T.searchMember, lang)}
            className="w-full md:min-w-[240px]"
          />
        </div>
        <div className="flex gap-1">
          <Button variant={view === 'monthly' ? 'default' : 'secondary'} size="sm" onClick={() => setView('monthly')}>
            <Calendar className="w-3 h-3" />{t(T.viewMonthly, lang)}
          </Button>
          <Button variant={view === 'yearly' ? 'default' : 'secondary'} size="sm" onClick={() => setView('yearly')}>
            <BarChart2 className="w-3 h-3" />{t(T.viewYearly, lang)}
          </Button>
          <Button variant="secondary" size="sm" onClick={exportToExcel}>
            <Download className="w-3 h-3" />{t(T.exportExcel, lang)}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="w-3 h-3" />{t(T.printReport, lang)}
          </Button>
        </div>
      </div>

      {view === 'monthly' && (
        <>
          <ECard delay={2}>
            <ECardHeader title={`${memberName} — ${t(T.monthlyBreakdown, lang)} (${year})`} />
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData.map(d => ({ ...d, name: d.month.substring(0, 3) }))} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A8380' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8A8380' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="saving" fill="#A0522D" radius={[4, 4, 0, 0]} name={t(T.monthlySavingCol, lang)} />
                  <Bar dataKey="newLoan" fill="#9B2335" radius={[4, 4, 0, 0]} name={t(T.newLoan, lang)} />
                  <Bar dataKey="currentInterest" fill="#2E7D5B" radius={[4, 4, 0, 0]} name={t(T.thisMonthInterest, lang)} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center text-[10px] text-smoke">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-terracotta" /> {t(T.monthlySavingCol, lang)}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-ruby" /> {t(T.newLoan, lang)}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-jade" /> {t(T.thisMonthInterest, lang)}</span>
              </div>
            </div>
          </ECard>
          <ECard delay={3}>
            <ECardHeader title={`${memberName} — ${t(T.memberMonthlyReport, lang)} (${year})`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead><tr className="bg-cream-dark/50">
                  <TH align="left">{t(T.month, lang)}</TH>
                  <TH>{t(T.monthlySavingCol, lang)}</TH>
                  <TH>{t(T.cumulativeCol, lang)}</TH>
                  <TH>{t(T.newLoan, lang)}</TH>
                  <TH>{t(T.oldLoan, lang)}</TH>
                  <TH>{t(T.repaymentCol, lang)}</TH>
                  <TH>{t(T.oldInterest, lang)}</TH>
                  <TH>{t(T.thisMonthInterest, lang)}</TH>
                  <TH>{t(T.balanceCol, lang)}</TH>
                </tr></thead>
                <tbody>
                  {monthlyData.map((d, i) => (
                    <tr key={i} className="border-b border-sand/40 hover:bg-cream-dark/30 transition-colors">
                      <TD align="left" className="font-medium">{d.month}</TD>
                      <TD className="font-mono">{formatCurrency(d.saving)}</TD>
                      <TD className="font-mono text-brass-dark">{formatCurrency(d.cumulative)}</TD>
                      <TD>{d.newLoan > 0 ? <span className="text-ruby font-semibold">{formatCurrency(d.newLoan)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{d.oldLoan > 0 ? <span className="text-smoke">{formatCurrency(d.oldLoan)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD className="font-mono">{d.repayment > 0 ? formatCurrency(d.repayment) : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{d.oldInterest > 0 ? <span className="text-smoke">{formatCurrency(d.oldInterest)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{d.currentInterest > 0 ? <span className="text-forest">{formatCurrency(d.currentInterest)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{d.balance > 0 ? <span className="text-ruby">{formatCurrency(d.balance)}</span> : <span className="text-sand-dark">—</span>}</TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-terracotta-deep/5 font-bold">
                  <TD align="left"><span className="font-display">{t(T.total, lang)}</span></TD>
                  <TD className="font-mono">{formatCurrency(monthlyData.reduce((s, d) => s + d.saving, 0))}</TD>
                  <TD className="font-mono text-brass-dark">{formatCurrency(monthlyData[monthlyData.length - 1]?.cumulative || 0)}</TD>
                  <TD className="font-mono text-ruby">{formatCurrency(monthlyData.reduce((s, d) => s + d.newLoan, 0))}</TD>
                  <TD className="font-mono">{formatCurrency(monthlyData.reduce((s, d) => s + d.oldLoan, 0))}</TD>
                  <TD className="font-mono">{formatCurrency(monthlyData.reduce((s, d) => s + d.repayment, 0))}</TD>
                  <TD className="font-mono">{formatCurrency(monthlyData.reduce((s, d) => s + d.oldInterest, 0))}</TD>
                  <TD className="font-mono text-forest">{formatCurrency(monthlyData.reduce((s, d) => s + d.currentInterest, 0))}</TD>
                  <TD className="font-mono text-ruby">{formatCurrency(monthlyData[monthlyData.length - 1]?.balance || 0)}</TD>
                </tr></tfoot>
              </table>
            </div>
          </ECard>
        </>
      )}

      {view === 'yearly' && (
        <>
          <ECard delay={2}>
            <ECardHeader title={`${memberName} — ${t(T.yearlySummary, lang)}`} />
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearlyData.map(d => ({ ...d, name: String(d.year) }))} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A8380' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8A8380' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="saving" fill="#A0522D" radius={[4, 4, 0, 0]} name={t(T.totalSavings, lang)} />
                  <Bar dataKey="newLoan" fill="#9B2335" radius={[4, 4, 0, 0]} name={t(T.totalLoans, lang)} />
                  <Bar dataKey="currentInterest" fill="#2E7D5B" radius={[4, 4, 0, 0]} name={t(T.thisMonthInterest, lang)} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center text-[10px] text-smoke">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-terracotta" /> {t(T.totalSavings, lang)}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-ruby" /> {t(T.totalLoans, lang)}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-jade" /> {t(T.interestEarned, lang)}</span>
              </div>
            </div>
          </ECard>
          <ECard delay={3}>
            <ECardHeader title={`${memberName} — ${t(T.memberYearlyReport, lang)}`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead><tr className="bg-cream-dark/50">
                  <TH align="left">{t(T.financialYear, lang)}</TH><TH>{t(T.totalSavings, lang)}</TH><TH>{t(T.cumulativeCol, lang)}</TH><TH>{t(T.totalLoans, lang)}</TH><TH>{t(T.interestEarned, lang)}</TH>
                </tr></thead>
                <tbody>
                  {yearlyData.map((d, i) => (
                    <tr key={i} className="border-b border-sand/40 hover:bg-cream-dark/30 transition-colors">
                      <TD align="left" className="font-display font-bold">{d.year}</TD>
                      <TD className="font-mono">{formatCurrency(d.saving)}</TD>
                      <TD className="font-mono text-brass-dark">{formatCurrency(d.cumulative)}</TD>
                      <TD>{d.newLoan > 0 ? <span className="text-ruby font-semibold">{formatCurrency(d.newLoan)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{d.currentInterest > 0 ? <span className="text-forest">{formatCurrency(d.currentInterest)}</span> : <span className="text-sand-dark">—</span>}</TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-terracotta-deep/5 font-bold">
                  <TD align="left"><span className="font-display">{t(T.total, lang)}</span></TD>
                  <TD className="font-mono">{formatCurrency(yearlyData.reduce((s, d) => s + d.saving, 0))}</TD>
                  <TD className="font-mono text-brass-dark">{formatCurrency(yearlyData[yearlyData.length - 1]?.cumulative || 0)}</TD>
                  <TD className="font-mono text-ruby">{formatCurrency(yearlyData.reduce((s, d) => s + d.newLoan, 0))}</TD>
                  <TD className="font-mono text-forest">{formatCurrency(yearlyData.reduce((s, d) => s + d.currentInterest, 0))}</TD>
                </tr></tfoot>
              </table>
            </div>
          </ECard>
        </>
      )}
    </div>
  );
}
