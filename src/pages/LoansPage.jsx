import { useState } from 'react';
import { CreditCard, IndianRupee, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import { MetricCard, SectionHeader, ECard, ECardHeader, TH, TD, PageSkeleton, Pagination } from '@/components/shared';

const PAGE_SIZE = 10;

export default function LoansPage() {
  const lang = useLang();
  const { currentData: data, members } = useData();
  const [page, setPage] = useState(1);

  if (!data) return <PageSkeleton type="table" />;

  const events = [];
  data.months.forEach(month => { month.members.forEach(mem => {
    if (mem.loanTaken > 0 || (mem.oldLoan || 0) > 0) {
      const info = members.find(m => m.id === mem.memberId);
      events.push({
        month: month.month,
        memberName: lang === 'ta' && info?.nameTA ? info.nameTA : (info?.name || `Member ${mem.memberId}`),
        loanAmount: mem.loanTaken,
        oldLoan: mem.oldLoan || 0,
        repayment: mem.loanRepayment,
        oldInterest: mem.oldInterest || 0,
        currentInterest: mem.currentInterest || mem.interest || 0,
        balance: mem.balance || mem.loanBalance || 0,
      });
    }
  }); });
  const totalLoans = events.reduce((s, l) => s + l.loanAmount, 0);
  const totalInterest = events.reduce((s, l) => s + l.currentInterest, 0);

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const pagedEvents = events.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <SectionHeader titleKey="loanManagement" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <MetricCard titleKey="totalDisbursed" value={formatCurrency(totalLoans)} icon={CreditCard} accent="ruby" delay={1} />
        <MetricCard titleKey="interestEarned" value={formatCurrency(totalInterest)} icon={IndianRupee} accent="forest" delay={2} />
        <MetricCard titleKey="loansCount" value={events.filter(e => e.loanAmount > 0).length} icon={FileSpreadsheet} accent="brass" delay={3} />
        <MetricCard titleKey="avgLoan" value={events.filter(e => e.loanAmount > 0).length ? formatCurrency(totalLoans / events.filter(e => e.loanAmount > 0).length) : '—'} icon={TrendingUp} accent="terracotta" delay={4} />
      </div>
      <ECard delay={3}>
        <ECardHeader titleKey="loanTransactions" />
        {events.length === 0 ? (
          <div className="p-12 text-center"><p className="font-display text-lg text-smoke italic">{t(T.noLoans, lang)}</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[780px]">
                <thead><tr className="bg-cream-dark/50">
                  <TH align="left">{t(T.month, lang)}</TH>
                  <TH align="left">{t(T.member, lang)}</TH>
                  <TH>{t(T.newLoan, lang)}</TH>
                  <TH>{t(T.oldLoan, lang)}</TH>
                  <TH>{t(T.repaymentCol, lang)}</TH>
                  <TH>{t(T.oldInterest, lang)}</TH>
                  <TH>{t(T.thisMonthInterest, lang)}</TH>
                  <TH>{t(T.balanceCol, lang)}</TH>
                </tr></thead>
                <tbody>
                  {pagedEvents.map((l, i) => (
                    <tr key={i} className="border-b border-sand/40 hover:bg-cream-dark/30 transition-colors">
                      <TD align="left">{l.month}</TD>
                      <TD align="left" className="font-medium">{l.memberName}</TD>
                      <TD className="font-mono font-semibold text-ruby">{l.loanAmount > 0 ? formatCurrency(l.loanAmount) : <span className="text-sand-dark">—</span>}</TD>
                      <TD className="font-mono">{l.oldLoan > 0 ? formatCurrency(l.oldLoan) : <span className="text-sand-dark">—</span>}</TD>
                      <TD className="font-mono">{l.repayment > 0 ? formatCurrency(l.repayment) : <span className="text-sand-dark">—</span>}</TD>
                      <TD className="font-mono">{l.oldInterest > 0 ? formatCurrency(l.oldInterest) : <span className="text-sand-dark">—</span>}</TD>
                      <TD className="font-mono text-forest">{l.currentInterest > 0 ? formatCurrency(l.currentInterest) : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{l.balance > 0
                        ? <span className="bg-ruby/10 text-ruby px-3 py-1 rounded-full text-xs font-semibold">{formatCurrency(l.balance)}</span>
                        : <span className="bg-forest/10 text-forest px-3 py-1 rounded-full text-xs font-semibold">{t(T.cleared, lang)}</span>}</TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-terracotta-deep/5 font-bold">
                  <TD align="left" colSpan={2}><span className="font-display">{t(T.total, lang)}</span></TD>
                  <TD className="font-mono text-ruby">{formatCurrency(totalLoans)}</TD>
                  <TD className="font-mono">{formatCurrency(events.reduce((s, l) => s + l.oldLoan, 0))}</TD>
                  <TD className="font-mono">{formatCurrency(events.reduce((s, l) => s + l.repayment, 0))}</TD>
                  <TD className="font-mono">{formatCurrency(events.reduce((s, l) => s + l.oldInterest, 0))}</TD>
                  <TD className="font-mono text-forest">{formatCurrency(totalInterest)}</TD>
                  <TD className="font-mono">{formatCurrency(events.reduce((s, l) => s + l.balance, 0))}</TD>
                </tr></tfoot>
              </table>
            </div>
            <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={events.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </ECard>
    </div>
  );
}
