import { useState } from 'react';
import { Calendar, Plus, Save, X, PenLine, Check, AlertTriangle, LayoutGrid, Table2 } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { formatCurrency, cn } from '@/lib/utils';
import useViewMode from '@/lib/useViewMode';
import { INTEREST_RATE } from '@/data/sampleData';
import { SectionHeader, ECard, ECardHeader, FormInput, Btn, NumInput, TH, TD, PageSkeleton, Pagination } from '@/components/shared';

const PAGE_SIZE = 10;

export default function DataEntryPage() {
  const lang = useLang();
  const { currentData: data, members, selectedYear: year, years, updateMonthData, addNewYear, groupClosed } = useData();
  const [selMonth, setSelMonth] = useState(0);
  const [editData, setEditData] = useState(null);
  const [saved, setSaved] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useViewMode('dataEntry');

  if (!data) return <PageSkeleton type="table" />;
  const md = data.months[selMonth];

  const prevMonthMembers = selMonth > 0 ? data.months[selMonth - 1].members : null;
  const startEditing = () => { setEditData(md.members.map(m => ({ ...m }))); setSaved(false); };
  const updateField = (idx, field, val) => {
    setEditData(prev => {
      const updated = prev.map((m, i) => i === idx ? { ...m, [field]: Math.max(0, Number(val) || 0) } : m);
      return updated.map(mem => {
        const prevMem = prevMonthMembers?.find(p => p.memberId === mem.memberId);
        const prevCumulative = prevMem ? prevMem.cumulative : 0;
        const oldLoan = prevMem ? (prevMem.balance || 0) : 0;
        const oldInterest = prevMem ? (prevMem.currentInterest || 0) : 0;
        const currentInterest = Math.round((mem.loanTaken || 0) * INTEREST_RATE);
        const balance = (mem.loanTaken || 0) + oldLoan - (mem.loanRepayment || 0);
        return {
          ...mem,
          cumulative: prevCumulative + (mem.saving || 0),
          oldLoan,
          oldInterest,
          currentInterest,
          balance,
          interest: currentInterest,
          loanBalance: balance,
        };
      });
    });
  };
  const saveData = () => { updateMonthData(year, selMonth, editData); setEditData(null); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const handleAddYear = () => { const y = parseInt(newYear); if (y && y > 1900 && y < 2100 && !years.includes(y)) { addNewYear(y); setNewYear(''); } };
  const currentMembers = editData || md.members;
  const totalPages = Math.ceil(currentMembers.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const pagedMembers = currentMembers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageOffset = (safePage - 1) * PAGE_SIZE;

  const ViewToggle = () => (
    <div className="flex items-center gap-1 mr-2">
      <button onClick={() => setViewMode('card')}
        className={cn('p-1.5 rounded-md transition-colors', viewMode === 'card' ? 'bg-terracotta-deep text-cream' : 'text-smoke hover:bg-sand/50')}>
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button onClick={() => setViewMode('table')}
        className={cn('p-1.5 rounded-md transition-colors', viewMode === 'table' ? 'bg-terracotta-deep text-cream' : 'text-smoke hover:bg-sand/50')}>
        <Table2 className="w-4 h-4" />
      </button>
    </div>
  );

  /* ── Card view for a single member ── */
  const MemberCard = ({ mem, idx, info }) => {
    const realIdx = pageOffset + idx;
    const displayName = lang === 'ta' && info.nameTA ? info.nameTA : info.name;

    if (editData) {
      return (
        <div className="bg-ivory rounded-xl border border-sand/60 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-charcoal text-sm">#{mem.memberId} {displayName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-smoke font-medium block mb-0.5">{t(T.monthlySavingCol, lang)}</label>
              <NumInput value={mem.saving} onChange={v => updateField(realIdx, 'saving', v)} />
            </div>
            <div>
              <label className="text-smoke font-medium block mb-0.5">{t(T.cumulativeCol, lang)}</label>
              <div className="font-mono text-brass-dark bg-cream-dark/30 rounded px-2 py-1.5">{formatCurrency(mem.cumulative)}</div>
            </div>
            <div>
              <label className="text-smoke font-medium block mb-0.5">{t(T.newLoan, lang)}</label>
              <NumInput value={mem.loanTaken} onChange={v => updateField(realIdx, 'loanTaken', v)} />
            </div>
            <div>
              <label className="text-smoke font-medium block mb-0.5">{t(T.oldLoan, lang)}</label>
              <div className="font-mono text-smoke bg-cream-dark/30 rounded px-2 py-1.5">{mem.oldLoan > 0 ? formatCurrency(mem.oldLoan) : '—'}</div>
            </div>
            <div>
              <label className="text-smoke font-medium block mb-0.5">{t(T.repaymentCol, lang)}</label>
              <NumInput value={mem.loanRepayment} onChange={v => updateField(realIdx, 'loanRepayment', v)} />
            </div>
            <div>
              <label className="text-smoke font-medium block mb-0.5">{t(T.oldInterest, lang)}</label>
              <div className="font-mono text-smoke bg-cream-dark/30 rounded px-2 py-1.5">{mem.oldInterest > 0 ? formatCurrency(mem.oldInterest) : '—'}</div>
            </div>
            <div>
              <label className="text-smoke font-medium block mb-0.5">{t(T.thisMonthInterest, lang)}</label>
              <div className="font-mono text-forest bg-cream-dark/30 rounded px-2 py-1.5">{mem.currentInterest > 0 ? formatCurrency(mem.currentInterest) : '—'}</div>
            </div>
            <div>
              <label className="text-smoke font-medium block mb-0.5">{t(T.balanceCol, lang)}</label>
              <div className="font-mono text-ruby bg-cream-dark/30 rounded px-2 py-1.5">{mem.balance > 0 ? formatCurrency(mem.balance) : '—'}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-ivory rounded-xl border border-sand/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-charcoal text-sm">#{mem.memberId} {displayName}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-smoke">{t(T.monthlySavingCol, lang)}</span>
            <span className="font-mono font-medium">{formatCurrency(mem.saving)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-smoke">{t(T.cumulativeCol, lang)}</span>
            <span className="font-mono font-medium text-brass-dark">{formatCurrency(mem.cumulative)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-smoke">{t(T.newLoan, lang)}</span>
            <span className={cn('font-mono font-medium', mem.loanTaken > 0 ? 'text-ruby' : 'text-sand-dark')}>{mem.loanTaken > 0 ? formatCurrency(mem.loanTaken) : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-smoke">{t(T.oldLoan, lang)}</span>
            <span className="font-mono text-smoke">{mem.oldLoan > 0 ? formatCurrency(mem.oldLoan) : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-smoke">{t(T.repaymentCol, lang)}</span>
            <span className="font-mono">{mem.loanRepayment > 0 ? formatCurrency(mem.loanRepayment) : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-smoke">{t(T.thisMonthInterest, lang)}</span>
            <span className={cn('font-mono', mem.currentInterest > 0 ? 'text-forest' : 'text-sand-dark')}>{mem.currentInterest > 0 ? formatCurrency(mem.currentInterest) : '—'}</span>
          </div>
          <div className="flex justify-between col-span-2 pt-1 border-t border-sand/30">
            <span className="text-smoke font-medium">{t(T.balanceCol, lang)}</span>
            <span className={cn('font-mono font-semibold', mem.balance > 0 ? 'text-ruby' : 'text-sand-dark')}>{mem.balance > 0 ? formatCurrency(mem.balance) : '—'}</span>
          </div>
        </div>
      </div>
    );
  };

  /* ── Totals Card ── */
  const TotalsCard = () => (
    <div className="bg-terracotta-deep/5 rounded-xl border border-terracotta/20 p-3">
      <h4 className="font-display font-bold text-charcoal text-sm mb-2">{t(T.total, lang)}</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-smoke">{t(T.monthlySavingCol, lang)}</span>
          <span className="font-mono font-bold">{formatCurrency(currentMembers.reduce((s, m) => s + m.saving, 0))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-smoke">{t(T.cumulativeCol, lang)}</span>
          <span className="font-mono font-bold text-brass-dark">{formatCurrency(currentMembers.reduce((s, m) => s + m.cumulative, 0))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-smoke">{t(T.newLoan, lang)}</span>
          <span className="font-mono font-bold text-ruby">{formatCurrency(currentMembers.reduce((s, m) => s + m.loanTaken, 0))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-smoke">{t(T.repaymentCol, lang)}</span>
          <span className="font-mono font-bold">{formatCurrency(currentMembers.reduce((s, m) => s + m.loanRepayment, 0))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-smoke">{t(T.thisMonthInterest, lang)}</span>
          <span className="font-mono font-bold text-forest">{formatCurrency(currentMembers.reduce((s, m) => s + (m.currentInterest || 0), 0))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-smoke">{t(T.balanceCol, lang)}</span>
          <span className="font-mono font-bold text-ruby">{formatCurrency(currentMembers.reduce((s, m) => s + (m.balance || 0), 0))}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionHeader titleKey="dataEntry" subtitle={t(T.enterMonthlyData, lang)} />
      {groupClosed && (
        <div className="bg-ruby/8 text-ruby border border-ruby/20 rounded-xl px-4 py-3 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />{t(T.groupClosedMsg, lang)}
        </div>
      )}
      <div className="animate-fade-up delay-1 flex items-end gap-2 md:gap-3 flex-wrap">
        <FormInput label={t(T.addNewYear, lang)} type="number" value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="e.g. 2025" icon={Calendar} className="w-32 md:w-40" />
        <Btn onClick={handleAddYear} icon={Plus} variant="secondary" size="md" disabled={!newYear || groupClosed}>{t(T.addYear, lang)}</Btn>
        <div className="flex gap-1 flex-wrap ml-auto">
          {years.map(y => <span key={y} className={`font-display text-[11px] font-bold px-2.5 py-1 rounded-lg ${y === year ? 'text-cream bg-terracotta-deep' : 'text-terracotta-deep bg-terracotta/8'}`}>{y}</span>)}
        </div>
      </div>
      <div className="animate-fade-up delay-2 flex gap-1 flex-wrap">
        {data.months.map((m, i) => (
          <button key={i} onClick={() => { setSelMonth(i); setEditData(null); setPage(1); }}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-full transition-all duration-300 ${selMonth === i ? 'bg-terracotta-deep text-cream shadow-md shadow-terracotta/20 scale-105' : 'bg-sand/50 text-smoke hover:bg-sand hover:text-charcoal'}`}>{m.month.substring(0, 3)}</button>
        ))}
      </div>
      <ECard delay={3}>
        <ECardHeader title={`${md.month} ${year} — ${t(T.dataEntry, lang)}`}
          action={
            <div className="flex items-center gap-1">
              <ViewToggle />
              {!groupClosed && (editData
                ? <div className="flex gap-2"><Btn onClick={saveData} icon={Save} variant="success" size="xs">{t(T.save, lang)}</Btn><Btn onClick={() => setEditData(null)} icon={X} variant="ghost" size="xs">{t(T.cancel, lang)}</Btn></div>
                : <Btn onClick={startEditing} icon={PenLine} variant="primary" size="xs">{t(T.edit, lang)}</Btn>
              )}
            </div>
          } />
        {saved && <div className="bg-forest/8 text-forest border-b border-forest/20 px-4 py-2 text-[11px] flex items-center gap-2"><Check className="w-3.5 h-3.5" /> {t(T.dataSaved, lang)}</div>}

        {/* ── Card View ── */}
        {viewMode === 'card' && (
          <div className="p-3 space-y-2">
            {pagedMembers.map((mem, i) => {
              const info = members.find(m => m.id === mem.memberId) || { name: `Member ${mem.memberId}` };
              return <MemberCard key={pageOffset + i} mem={mem} idx={i} info={info} />;
            })}
            <TotalsCard />
          </div>
        )}

        {/* ── Table View ── */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead><tr className="bg-cream-dark/50">
                <TH align="left">#</TH>
                <TH align="left">{t(T.member, lang)}</TH>
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
                {pagedMembers.map((mem, i) => {
                  const realIdx = pageOffset + i;
                  const info = members.find(m => m.id === mem.memberId) || { name: `Member ${mem.memberId}` };
                  const displayName = lang === 'ta' && info.nameTA ? info.nameTA : info.name;
                  return (
                    <tr key={realIdx} className="border-b border-sand/40 hover:bg-cream-dark/30 transition-colors">
                      <TD align="left" className="text-smoke font-mono text-xs">{mem.memberId}</TD>
                      <TD align="left" className="font-medium text-xs">{displayName}</TD>
                      {editData ? (<>
                        <TD><NumInput value={mem.saving} onChange={v => updateField(realIdx, 'saving', v)} /></TD>
                        <TD className="font-mono text-brass-dark bg-cream-dark/20">{formatCurrency(mem.cumulative)}</TD>
                        <TD><NumInput value={mem.loanTaken} onChange={v => updateField(realIdx, 'loanTaken', v)} /></TD>
                        <TD className="font-mono text-smoke bg-cream-dark/20">{mem.oldLoan > 0 ? formatCurrency(mem.oldLoan) : <span className="text-sand-dark">—</span>}</TD>
                        <TD><NumInput value={mem.loanRepayment} onChange={v => updateField(realIdx, 'loanRepayment', v)} /></TD>
                        <TD className="font-mono text-smoke bg-cream-dark/20">{mem.oldInterest > 0 ? formatCurrency(mem.oldInterest) : <span className="text-sand-dark">—</span>}</TD>
                        <TD className="font-mono text-forest bg-cream-dark/20">{mem.currentInterest > 0 ? formatCurrency(mem.currentInterest) : <span className="text-sand-dark">—</span>}</TD>
                        <TD className="font-mono text-ruby bg-cream-dark/20">{mem.balance > 0 ? formatCurrency(mem.balance) : <span className="text-sand-dark">—</span>}</TD>
                      </>) : (<>
                        <TD className="font-mono">{formatCurrency(mem.saving)}</TD>
                        <TD className="font-mono text-brass-dark">{formatCurrency(mem.cumulative)}</TD>
                        <TD>{mem.loanTaken > 0 ? <span className="text-ruby font-semibold">{formatCurrency(mem.loanTaken)}</span> : <span className="text-sand-dark">—</span>}</TD>
                        <TD>{mem.oldLoan > 0 ? <span className="text-smoke">{formatCurrency(mem.oldLoan)}</span> : <span className="text-sand-dark">—</span>}</TD>
                        <TD className="font-mono">{mem.loanRepayment > 0 ? formatCurrency(mem.loanRepayment) : <span className="text-sand-dark">—</span>}</TD>
                        <TD>{mem.oldInterest > 0 ? <span className="text-smoke">{formatCurrency(mem.oldInterest)}</span> : <span className="text-sand-dark">—</span>}</TD>
                        <TD>{mem.currentInterest > 0 ? <span className="text-forest">{formatCurrency(mem.currentInterest)}</span> : <span className="text-sand-dark">—</span>}</TD>
                        <TD>{mem.balance > 0 ? <span className="text-ruby">{formatCurrency(mem.balance)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      </>)}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="bg-terracotta-deep/5 font-bold">
                <TD align="left" colSpan={2}><span className="font-display">{t(T.total, lang)}</span></TD>
                <TD className="font-mono">{formatCurrency(currentMembers.reduce((s, m) => s + m.saving, 0))}</TD>
                <TD className="font-mono text-brass-dark">{formatCurrency(currentMembers.reduce((s, m) => s + m.cumulative, 0))}</TD>
                <TD className="font-mono text-ruby">{formatCurrency(currentMembers.reduce((s, m) => s + m.loanTaken, 0))}</TD>
                <TD className="font-mono">{formatCurrency(currentMembers.reduce((s, m) => s + (m.oldLoan || 0), 0))}</TD>
                <TD className="font-mono">{formatCurrency(currentMembers.reduce((s, m) => s + m.loanRepayment, 0))}</TD>
                <TD className="font-mono">{formatCurrency(currentMembers.reduce((s, m) => s + (m.oldInterest || 0), 0))}</TD>
                <TD className="font-mono text-forest">{formatCurrency(currentMembers.reduce((s, m) => s + (m.currentInterest || 0), 0))}</TD>
                <TD className="font-mono text-ruby">{formatCurrency(currentMembers.reduce((s, m) => s + (m.balance || 0), 0))}</TD>
              </tr></tfoot>
            </table>
          </div>
        )}
        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={currentMembers.length} pageSize={PAGE_SIZE} />
      </ECard>
    </div>
  );
}
