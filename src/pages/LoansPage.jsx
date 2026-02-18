import { useState } from 'react';
import { CreditCard, IndianRupee, FileSpreadsheet, TrendingUp, LayoutGrid, Table2 } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import useViewMode from '@/lib/useViewMode';
import { PAGE_SIZE } from '@/lib/constants';
import { MetricCard, SectionHeader, ECard, ECardHeader, TH, TD, Btn, PageSkeleton, Pagination } from '@/components/shared';

export default function LoansPage() {
  const lang = useLang();
  const { currentData: data, members } = useData();
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useViewMode('loans');

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
      <SectionHeader titleKey="loanManagement" subtitle={t(T.loanManagementDesc, lang)} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <MetricCard titleKey="totalDisbursed" value={formatCurrency(totalLoans)} icon={CreditCard} accent="ruby" delay={1} />
        <MetricCard titleKey="interestEarned" value={formatCurrency(totalInterest)} icon={IndianRupee} accent="forest" delay={2} />
        <MetricCard titleKey="loansCount" value={events.filter(e => e.loanAmount > 0).length} icon={FileSpreadsheet} accent="brass" delay={3} />
        <MetricCard titleKey="avgLoan" value={events.filter(e => e.loanAmount > 0).length ? formatCurrency(totalLoans / events.filter(e => e.loanAmount > 0).length) : '—'} icon={TrendingUp} accent="terracotta" delay={4} />
      </div>
      <ECard delay={3}>
        <ECardHeader titleKey="loanTransactions" action={
          <div className="flex gap-1">
            <Btn
              onClick={() => setViewMode('card')}
              icon={LayoutGrid}
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              aria-label={t(T.cardView, lang)}
            />
            <Btn
              onClick={() => setViewMode('table')}
              icon={Table2}
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              aria-label={t(T.tableView, lang)}
            />
          </div>
        } />
        {events.length === 0 ? (
          <div className="p-12 text-center"><p className="font-display text-lg text-smoke italic">{t(T.noLoans, lang)}</p></div>
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {pagedEvents.map((l, i) => (
                    <div key={i} className="bg-cream-dark/20 rounded-lg p-3 border border-sand/40">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs text-smoke">{l.month}</span>
                          <p className="font-medium text-sm">{l.memberName}</p>
                        </div>
                        {l.balance > 0
                          ? <span className="bg-ruby/10 text-ruby px-2 py-0.5 rounded-full text-[10px] font-semibold">{formatCurrency(l.balance)}</span>
                          : <span className="bg-forest/10 text-forest px-2 py-0.5 rounded-full text-[10px] font-semibold">{t(T.cleared, lang)}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {l.loanAmount > 0 && <div><span className="text-smoke">{t(T.newLoan, lang)}:</span> <span className="font-mono text-ruby">{formatCurrency(l.loanAmount)}</span></div>}
                        {l.oldLoan > 0 && <div><span className="text-smoke">{t(T.oldLoan, lang)}:</span> <span className="font-mono">{formatCurrency(l.oldLoan)}</span></div>}
                        {l.repayment > 0 && <div><span className="text-smoke">{t(T.repaymentCol, lang)}:</span> <span className="font-mono">{formatCurrency(l.repayment)}</span></div>}
                        {l.oldInterest > 0 && <div><span className="text-smoke">{t(T.oldInterest, lang)}:</span> <span className="font-mono">{formatCurrency(l.oldInterest)}</span></div>}
                        {l.currentInterest > 0 && <div><span className="text-smoke">{t(T.thisMonthInterest, lang)}:</span> <span className="font-mono text-forest">{formatCurrency(l.currentInterest)}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-terracotta-deep/5 rounded-lg p-3 border border-sand/40 mt-4">
                  <div className="text-xs font-bold text-charcoal">
                    <div className="flex justify-between items-center mb-2">
                      <span>{t(T.total, lang)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-smoke">{t(T.newLoan, lang)}:</span> <span className="font-mono text-ruby">{formatCurrency(totalLoans)}</span></div>
                      <div><span className="text-smoke">{t(T.oldLoan, lang)}:</span> <span className="font-mono">{formatCurrency(events.reduce((s, l) => s + l.oldLoan, 0))}</span></div>
                      <div><span className="text-smoke">{t(T.repaymentCol, lang)}:</span> <span className="font-mono">{formatCurrency(events.reduce((s, l) => s + l.repayment, 0))}</span></div>
                      <div><span className="text-smoke">{t(T.thisMonthInterest, lang)}:</span> <span className="font-mono text-forest">{formatCurrency(totalInterest)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
            <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={events.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </ECard>
    </div>
  );
}
