import { useState } from 'react';
import { Wallet, TrendingUp, CreditCard, IndianRupee, Download, FileText, LayoutGrid, Table2 } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import useViewMode from '@/lib/useViewMode';
import { MetricCard, SectionHeader, ECard, ECardHeader, TH, TD, Btn, PageSkeleton, Pagination } from '@/components/shared';

const PAGE_SIZE = 10;

/* ── helper: build export rows for a given month ── */
function buildExportRows(md, members, lang) {
  return md.members.map((mem) => {
    const info = members.find(m => m.id === mem.memberId) || { name: `Member ${mem.memberId}`, nameTA: '' };
    const displayName = lang === 'ta' && info.nameTA && info.nameTA !== info.name ? info.nameTA : info.name;
    return {
      [t(T.member, lang)]: displayName,
      [t(T.monthlySavingCol, lang)]: mem.saving,
      [t(T.cumulativeCol, lang)]: mem.cumulative,
      [t(T.newLoan, lang)]: mem.loanTaken,
      [t(T.oldLoan, lang)]: mem.oldLoan || 0,
      [t(T.repaymentCol, lang)]: mem.loanRepayment,
      [t(T.oldInterest, lang)]: mem.oldInterest || 0,
      [t(T.thisMonthInterest, lang)]: mem.currentInterest || mem.interest || 0,
      [t(T.balanceCol, lang)]: mem.balance || mem.loanBalance || 0,
    };
  });
}

/* ── Excel export ── */
function exportExcel(md, members, lang, selectedYear) {
  import('xlsx').then((mod) => {
    const XLSX = mod.default || mod;
    const rows = buildExportRows(md, members, lang);

    // Add totals row
    const totals = {
      [t(T.member, lang)]: t(T.total, lang),
      [t(T.monthlySavingCol, lang)]: md.totalSaving,
      [t(T.cumulativeCol, lang)]: md.totalCumulative,
      [t(T.newLoan, lang)]: md.members.reduce((s, m) => s + m.loanTaken, 0),
      [t(T.oldLoan, lang)]: md.members.reduce((s, m) => s + (m.oldLoan || 0), 0),
      [t(T.repaymentCol, lang)]: md.members.reduce((s, m) => s + m.loanRepayment, 0),
      [t(T.oldInterest, lang)]: md.members.reduce((s, m) => s + (m.oldInterest || 0), 0),
      [t(T.thisMonthInterest, lang)]: md.members.reduce((s, m) => s + (m.currentInterest || m.interest || 0), 0),
      [t(T.balanceCol, lang)]: md.members.reduce((s, m) => s + (m.balance || m.loanBalance || 0), 0),
    };
    rows.push(totals);

    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-size columns
    const colWidths = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length + 2, ...rows.map(r => String(r[key]).length + 2))
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, md.month);
    const filename = lang === 'ta'
      ? `மாதாந்திர_பேரேடு_${md.month}_${selectedYear}.xlsx`
      : `Monthly_Ledger_${md.month}_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, filename);
  }).catch((err) => {
    console.error('Excel export failed:', err);
    alert('Excel export failed. Please try again.');
  });
}

/* ── PDF export ── */
function exportPDF(md, members, lang, selectedYear) {
  Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('@/assets/NotoSansTamil.js'),
  ]).then(([jsPDFModule, autoTableModule, fontModule]) => {
    const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
    if (!jsPDF) {
      console.error('jsPDF constructor not found. Module keys:', Object.keys(jsPDFModule));
      alert('PDF export failed to load. Please try again.');
      return;
    }
    // Ensure autoTable plugin is attached
    if (autoTableModule.applyPlugin) {
      autoTableModule.applyPlugin(jsPDF);
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    // Fallback: if autoTable still not on instance, use the default export directly
    const autoTable = doc.autoTable ? doc.autoTable.bind(doc) : (opts) => (autoTableModule.default || autoTableModule)(doc, opts);

    // Register Tamil font
    const tamilFontBase64 = fontModule.default;
    doc.addFileToVFS('NotoSansTamil.ttf', tamilFontBase64);
    doc.addFont('NotoSansTamil.ttf', 'NotoSansTamil', 'normal');
    doc.setFont('NotoSansTamil');

    // Title
    const title = lang === 'ta'
      ? `ஸ்ரீ அன்னை மகளிர் சுய உதவி குழு`
      : 'Shree Annai Women Self Help Group';
    const subtitle = lang === 'ta'
      ? `மாதாந்திர பேரேடு — ${md.month} ${selectedYear}`
      : `Monthly Ledger — ${md.month} ${selectedYear}`;

    doc.setFontSize(16);
    doc.text(title, 148, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(subtitle, 148, 22, { align: 'center' });

    // Table headers
    const headers = [
      '#',
      t(T.member, lang),
      t(T.monthlySavingCol, lang),
      t(T.cumulativeCol, lang),
      t(T.newLoan, lang),
      t(T.oldLoan, lang),
      t(T.repaymentCol, lang),
      t(T.oldInterest, lang),
      t(T.thisMonthInterest, lang),
      t(T.balanceCol, lang),
    ];

    // Table body
    const body = md.members.map((mem) => {
      const info = members.find(m => m.id === mem.memberId) || { name: `Member ${mem.memberId}`, nameTA: '' };
      const displayName = lang === 'ta' && info.nameTA && info.nameTA !== info.name ? info.nameTA : info.name;
      return [
        mem.memberId,
        displayName,
        formatCurrency(mem.saving),
        formatCurrency(mem.cumulative),
        mem.loanTaken > 0 ? formatCurrency(mem.loanTaken) : '—',
        (mem.oldLoan || 0) > 0 ? formatCurrency(mem.oldLoan) : '—',
        mem.loanRepayment > 0 ? formatCurrency(mem.loanRepayment) : '—',
        (mem.oldInterest || 0) > 0 ? formatCurrency(mem.oldInterest) : '—',
        (mem.currentInterest || mem.interest || 0) > 0 ? formatCurrency(mem.currentInterest || mem.interest) : '—',
        (mem.balance || mem.loanBalance || 0) > 0 ? formatCurrency(mem.balance || mem.loanBalance) : '—',
      ];
    });

    // Totals row
    const foot = [[
      '', t(T.total, lang),
      formatCurrency(md.totalSaving),
      formatCurrency(md.totalCumulative),
      formatCurrency(md.members.reduce((s, m) => s + m.loanTaken, 0)),
      formatCurrency(md.members.reduce((s, m) => s + (m.oldLoan || 0), 0)),
      formatCurrency(md.members.reduce((s, m) => s + m.loanRepayment, 0)),
      formatCurrency(md.members.reduce((s, m) => s + (m.oldInterest || 0), 0)),
      formatCurrency(md.members.reduce((s, m) => s + (m.currentInterest || m.interest || 0), 0)),
      formatCurrency(md.members.reduce((s, m) => s + (m.balance || m.loanBalance || 0), 0)),
    ]];

    autoTable({
      head: [headers],
      body,
      foot,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2, font: 'NotoSansTamil' },
      headStyles: { fillColor: [180, 83, 44], textColor: 255, fontStyle: 'normal' },
      footStyles: { fillColor: [245, 238, 228], textColor: [45, 41, 38], fontStyle: 'normal' },
      alternateRowStyles: { fillColor: [253, 246, 236] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
      },
    });

    const filename = lang === 'ta'
      ? `மாதாந்திர_பேரேடு_${md.month}_${selectedYear}.pdf`
      : `Monthly_Ledger_${md.month}_${selectedYear}.pdf`;
    doc.save(filename);
  }).catch((err) => {
    console.error('PDF export failed:', err);
    alert('PDF export failed. Please try again.');
  });
}

export default function MonthlyPage() {
  const lang = useLang();
  const { currentData: data, members, selectedYear } = useData();
  const [sel, setSel] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useViewMode('monthly');

  if (!data) return <PageSkeleton type="table" />;
  const md = data.months[sel];
  if (!md) return <PageSkeleton type="table" />;

  const allMembers = md.members;
  const totalPages = Math.ceil(allMembers.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const pagedMembers = allMembers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <SectionHeader titleKey="monthlyLedger" subtitle={t(T.monthlyLedgerDesc, lang)} />
      <div className="animate-fade-up delay-1 grid grid-cols-6 md:flex gap-1">
        {data.months.map((m, i) => (
          <button key={i} onClick={() => { setSel(i); setPage(1); }}
            className={`px-1 md:px-3 py-1.5 text-[11px] font-medium rounded-full transition-all duration-300 text-center ${sel === i ? 'bg-terracotta-deep text-cream shadow-md shadow-terracotta/20 scale-105' : 'bg-sand/50 text-smoke hover:bg-sand hover:text-charcoal'}`}>{m.month.substring(0, 3)}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <MetricCard titleKey="monthSaving" value={formatCurrency(md.totalSaving)} icon={Wallet} accent="terracotta" delay={2} />
        <MetricCard titleKey="cumulative" value={formatCurrency(md.totalCumulative)} icon={TrendingUp} accent="brass" delay={3} />
        <MetricCard titleKey="loans" value={formatCurrency(md.members.reduce((s, m) => s + m.loanTaken, 0))} icon={CreditCard} accent="ruby" delay={4} />
        <MetricCard titleKey="interest" value={formatCurrency(md.members.reduce((s, m) => s + (m.currentInterest || m.interest || 0), 0))} icon={IndianRupee} accent="forest" delay={5} />
      </div>
      <ECard delay={3}>
        <ECardHeader title={`${md.month} — ${t(T.memberDetails, lang)}`} action={
          <div className="flex items-center gap-2">
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
            <Btn onClick={() => exportExcel(md, members, lang, selectedYear)} icon={Download} variant="outline" size="sm">
              <span className="hidden sm:inline">{t(T.exportExcel, lang)}</span>
            </Btn>
            <Btn onClick={() => exportPDF(md, members, lang, selectedYear)} icon={FileText} variant="outline" size="sm">
              <span className="hidden sm:inline">{t(T.exportPDF, lang)}</span>
            </Btn>
          </div>
        } />

        {viewMode === 'card' ? (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {pagedMembers.map((mem, i) => {
                const info = members.find(m => m.id === mem.memberId) || { name: `Member ${mem.memberId}`, nameTA: '' };
                const displayName = lang === 'ta' && info.nameTA && info.nameTA !== info.name ? info.nameTA : info.name;
                const balance = mem.balance || mem.loanBalance || 0;
                const savingLabel = t(T.monthlySavingCol, lang);
                const cumulativeLabel = t(T.cumulativeCol, lang);
                const loanLabel = t(T.newLoan, lang);
                const interestLabel = t(T.thisMonthInterest, lang);
                return (
                  <div key={i} className="bg-cream-dark/20 rounded-lg p-3 border border-sand/40">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs text-smoke">#{mem.memberId}</span>
                        <p className="font-medium text-sm">{displayName}</p>
                      </div>
                      {balance > 0 && <span className="bg-ruby/10 text-ruby px-2 py-0.5 rounded-full text-[10px] font-semibold">{formatCurrency(balance)}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-smoke">{savingLabel}:</span> <span className="font-mono">{formatCurrency(mem.saving)}</span></div>
                      <div><span className="text-smoke">{cumulativeLabel}:</span> <span className="font-mono text-brass-dark font-semibold">{formatCurrency(mem.cumulative)}</span></div>
                      {mem.loanTaken > 0 && <div><span className="text-smoke">{loanLabel}:</span> <span className="font-mono text-ruby">{formatCurrency(mem.loanTaken)}</span></div>}
                      {(mem.currentInterest || mem.interest || 0) > 0 && <div><span className="text-smoke">{interestLabel}:</span> <span className="font-mono text-forest">{formatCurrency(mem.currentInterest || mem.interest)}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-terracotta-deep/5 rounded-lg p-3 border border-sand/40 mt-4">
              <div className="text-xs font-bold text-charcoal">
                <div className="flex justify-between items-center mb-2">
                  <span>{t(T.total, lang)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-smoke">{t(T.monthlySavingCol, lang)}:</span> <span className="font-mono">{formatCurrency(md.totalSaving)}</span></div>
                  <div><span className="text-smoke">{t(T.cumulativeCol, lang)}:</span> <span className="font-mono text-brass-dark font-semibold">{formatCurrency(md.totalCumulative)}</span></div>
                  <div><span className="text-smoke">{t(T.newLoan, lang)}:</span> <span className="font-mono text-ruby">{formatCurrency(md.members.reduce((s, m) => s + m.loanTaken, 0))}</span></div>
                  <div><span className="text-smoke">{t(T.thisMonthInterest, lang)}:</span> <span className="font-mono text-forest">{formatCurrency(md.members.reduce((s, m) => s + (m.currentInterest || m.interest || 0), 0))}</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                  const info = members.find(m => m.id === mem.memberId) || { name: `Member ${mem.memberId}`, nameTA: '' };
                  const displayName = lang === 'ta' && info.nameTA && info.nameTA !== info.name ? info.nameTA : info.name;
                  return (
                    <tr key={i} className="border-b border-sand/40 hover:bg-cream-dark/30 transition-colors">
                      <TD align="left" className="text-smoke font-mono text-xs">{mem.memberId}</TD>
                      <TD align="left" className="font-medium">{displayName}</TD>
                      <TD className="font-mono">{formatCurrency(mem.saving)}</TD>
                      <TD className="font-mono font-semibold text-brass-dark">{formatCurrency(mem.cumulative)}</TD>
                      <TD>{mem.loanTaken > 0 ? <span className="inline-block bg-ruby/10 text-ruby px-2 py-0.5 rounded-full text-xs font-semibold">{formatCurrency(mem.loanTaken)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{(mem.oldLoan || 0) > 0 ? <span className="text-smoke">{formatCurrency(mem.oldLoan)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD className="font-mono">{mem.loanRepayment > 0 ? formatCurrency(mem.loanRepayment) : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{(mem.oldInterest || 0) > 0 ? <span className="text-smoke">{formatCurrency(mem.oldInterest)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{(mem.currentInterest || mem.interest || 0) > 0 ? <span className="text-forest font-medium">{formatCurrency(mem.currentInterest || mem.interest)}</span> : <span className="text-sand-dark">—</span>}</TD>
                      <TD>{(mem.balance || mem.loanBalance || 0) > 0 ? <span className="text-ruby font-medium">{formatCurrency(mem.balance || mem.loanBalance)}</span> : <span className="text-sand-dark">—</span>}</TD>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="bg-terracotta-deep/5 font-bold">
                <TD align="left" colSpan={2}><span className="font-display">{t(T.total, lang)}</span></TD>
                <TD className="font-mono">{formatCurrency(md.totalSaving)}</TD>
                <TD className="font-mono text-brass-dark">{formatCurrency(md.totalCumulative)}</TD>
                <TD className="font-mono text-ruby">{formatCurrency(md.members.reduce((s, m) => s + m.loanTaken, 0))}</TD>
                <TD className="font-mono">{formatCurrency(md.members.reduce((s, m) => s + (m.oldLoan || 0), 0))}</TD>
                <TD className="font-mono">{formatCurrency(md.members.reduce((s, m) => s + m.loanRepayment, 0))}</TD>
                <TD className="font-mono">{formatCurrency(md.members.reduce((s, m) => s + (m.oldInterest || 0), 0))}</TD>
                <TD className="font-mono text-forest">{formatCurrency(md.members.reduce((s, m) => s + (m.currentInterest || m.interest || 0), 0))}</TD>
                <TD className="font-mono text-ruby">{formatCurrency(md.members.reduce((s, m) => s + (m.balance || m.loanBalance || 0), 0))}</TD>
              </tr></tfoot>
            </table>
          </div>
        )}
        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={allMembers.length} pageSize={PAGE_SIZE} />
      </ECard>
    </div>
  );
}
