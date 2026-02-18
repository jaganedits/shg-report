import { useState, useRef } from 'react';
import { Users, UserPlus, Plus, X, Edit3, Trash2, Check, Search, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, Table2, Save, SearchX } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import useViewMode from '@/lib/useViewMode';
import { PALETTE, PAGE_SIZE } from '@/lib/constants';
import { transliterateToTamil } from '@/lib/transliterate';
import { SectionHeader, ECard, ECardHeader, FormInput, Btn, TH, TD, ConfirmDialog, PageSkeleton, Pagination } from '@/components/shared';
import { Button } from '@/components/ui/button';

export default function MembersPage() {
  const lang = useLang();
  const { isAdmin } = useAuth();
  const { currentData: data, members, addMember: onAdd, removeMember: onRemove, editMember: onEdit } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameTA, setNewNameTA] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNameTA, setEditNameTA] = useState('');
  const [dialogMember, setDialogMember] = useState(null);
  const [dialogName, setDialogName] = useState('');
  const [dialogNameTA, setDialogNameTA] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [viewMode, setViewMode] = useViewMode('members');
  const addTamilTouched = useRef(false);
  const editTamilTouched = useRef(false);
  const dialogTamilTouched = useRef(false);

  if (!data) return <PageSkeleton type="members" />;

  const summaries = members.map(m => {
    const totalSaved = data.months.reduce((s, mo) => { const mem = mo.members.find(mm => mm.memberId === m.id); return s + (mem ? mem.saving : 0); }, 0);
    const totalLoan = data.months.reduce((s, mo) => { const mem = mo.members.find(mm => mm.memberId === m.id); return s + (mem ? mem.loanTaken : 0); }, 0);
    const totalInterest = data.months.reduce((s, mo) => { const mem = mo.members.find(mm => mm.memberId === m.id); return s + (mem ? mem.interest : 0); }, 0);
    const last = data.months[data.months.length - 1];
    const lastMem = last?.members.find(mm => mm.memberId === m.id);
    return { ...m, totalSaved, totalLoan, totalInterest, finalCumulative: lastMem?.cumulative || 0 };
  });

  const filtered = summaries.filter(m => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.nameTA || '').toLowerCase().includes(q);
  });

  const pieData = summaries.map(m => ({ name: m.name, value: m.totalSaved }));

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...filtered];
  if (sortKey) {
    sorted.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal == null) aVal = 0;
      if (bVal == null) bVal = 0;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const pagedSummaries = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleAdd = () => { if (!newName.trim()) return; onAdd(newName.trim(), newNameTA.trim()); setNewName(''); setNewNameTA(''); setShowAddForm(false); addTamilTouched.current = false; };
  const handleEdit = (id) => { if (!editName.trim()) return; onEdit(id, editName.trim(), editNameTA.trim()); setEditingId(null); };
  const startEdit = (m) => { setEditingId(m.id); setEditName(m.name); setEditNameTA(m.nameTA || ''); editTamilTouched.current = Boolean(m.nameTA); };
  const openDialog = (m) => { setDialogMember(m); setDialogName(m.name); setDialogNameTA(m.nameTA || ''); dialogTamilTouched.current = Boolean(m.nameTA); };
  const closeDialog = () => { setDialogMember(null); setDialogName(''); setDialogNameTA(''); dialogTamilTouched.current = false; };
  const saveDialog = () => { if (!dialogName.trim() || !dialogMember) return; onEdit(dialogMember.id, dialogName.trim(), dialogNameTA.trim()); closeDialog(); };

  return (
    <div className="space-y-5">
      <SectionHeader titleKey="members" subtitle={t(T.manageMembers, lang)} />
      {isAdmin && (
        <div className="animate-fade-up delay-1">
          {!showAddForm ? (
            <Btn onClick={() => setShowAddForm(true)} icon={UserPlus} variant="primary" size="md">{t(T.addMember, lang)}</Btn>
          ) : (
            <ECard delay={1}><div className="p-4">
              <div className="flex items-center gap-2 mb-3"><UserPlus className="w-4 h-4 text-terracotta" /><h3 className="font-display text-sm font-semibold">{t(T.addNewMember, lang)}</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormInput label={t(T.nameEnglish, lang)} value={newName} onChange={e => { setNewName(e.target.value); if (!addTamilTouched.current) setNewNameTA(transliterateToTamil(e.target.value)); }} placeholder={t(T.enterMemberName, lang)} icon={Users} />
                <FormInput label={t(T.nameTamil, lang)} value={newNameTA} onChange={e => { addTamilTouched.current = true; setNewNameTA(e.target.value); }} placeholder={t(T.enterTamilName, lang)} />
                <div className="flex items-end gap-2">
                  <Btn onClick={handleAdd} icon={Plus} variant="primary" size="md" disabled={!newName.trim()}>{t(T.add, lang)}</Btn>
                  <Btn onClick={() => { setShowAddForm(false); setNewName(''); setNewNameTA(''); addTamilTouched.current = false; }} icon={X} variant="ghost" size="md">{t(T.cancel, lang)}</Btn>
                </div>
              </div>
            </div></ECard>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
        <ECard className="lg:col-span-3" delay={1}>
          <ECardHeader titleKey="memberSummary" action={
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
          {/* Search bar */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={t(T.searchFilter, lang)}
                className="w-full pl-9 pr-3 py-2 bg-cream-dark/30 border border-sand/50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-terracotta/30 placeholder:text-smoke/50" />
            </div>
          </div>

          {sorted.length === 0 ? (
            search ? (
              <div className="p-8 text-center">
                <SearchX className="w-6 h-6 text-smoke/30 mx-auto mb-2" />
                <p className="text-sm text-smoke font-medium">{t(T.noSearchResults, lang)}</p>
                <p className="text-[11px] text-smoke/60 mt-1">{t(T.tryClearSearch, lang)}</p>
                <button onClick={() => { setSearch(''); setPage(1); }} className="mt-2 text-[11px] text-terracotta hover:text-terracotta-deep underline">{t(T.cancel, lang)}</button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-6 h-6 text-smoke/30 mx-auto mb-2" />
                <p className="text-sm text-smoke font-medium">{t(T.noMembersFound, lang)}</p>
              </div>
            )
          ) : viewMode === 'card' ? (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {pagedSummaries.map((m) => {
                  const displayName = lang === 'ta' && m.nameTA && m.nameTA !== m.name ? m.nameTA : m.name;
                  return (
                    <div key={m.id} className="bg-cream-dark/20 rounded-lg p-3 border border-sand/40">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-xs text-smoke">#{m.id}</span>
                          <p className="font-medium text-sm">{displayName}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openDialog(m); }} aria-label={t(T.editUser, lang)} className="text-smoke hover:text-brass p-1.5 rounded-md active:bg-sand/30"><Edit3 className="w-4 h-4" /></button>
                            <ConfirmDialog
                              trigger={<Button variant="ghost" size="icon-sm" aria-label={t(T.deleteUser, lang)} className="text-smoke hover:text-ruby p-1.5"><Trash2 className="w-4 h-4" /></Button>}
                              title={t(T.confirmDeleteMember, lang)}
                              description={`${t(T.confirmDeleteMemberDesc, lang)}\n\n${displayName} (#${m.id})`}
                              confirmLabel={t(T.delete, lang)}
                              onConfirm={() => onRemove(m.id)}
                              variant="danger"
                            />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-smoke">{t(T.totalSaved, lang)}:</span> <span className="font-mono">{formatCurrency(m.totalSaved)}</span></div>
                        <div><span className="text-smoke">{t(T.cumulative, lang)}:</span> <span className="font-mono text-brass-dark font-semibold">{formatCurrency(m.finalCumulative)}</span></div>
                        {m.totalLoan > 0 && <div><span className="text-smoke">{t(T.loan, lang)}:</span> <span className="font-mono text-ruby">{formatCurrency(m.totalLoan)}</span></div>}
                        {m.totalInterest > 0 && <div><span className="text-smoke">{t(T.interest, lang)}:</span> <span className="font-mono text-forest">{formatCurrency(m.totalInterest)}</span></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[580px]">
                <thead><tr className="bg-cream-dark/50">
                  <TH align="left">#</TH>
                  <TH align="left">
                    <button type="button" onClick={() => toggleSort('name')} aria-label={`${t(T.sortBy, lang)} ${t(T.name, lang)}`} className="cursor-pointer flex items-center gap-1 hover:text-charcoal transition-colors bg-transparent border-none p-0 font-inherit text-inherit">
                      {t(T.name, lang)}
                      {sortKey === 'name' ? (sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
                    </button>
                  </TH>
                  <TH>
                    <button type="button" onClick={() => toggleSort('totalSaved')} aria-label={`${t(T.sortBy, lang)} ${t(T.totalSaved, lang)}`} className="cursor-pointer flex items-center justify-center gap-1 hover:text-charcoal transition-colors bg-transparent border-none p-0 font-inherit text-inherit">
                      {t(T.totalSaved, lang)}
                      {sortKey === 'totalSaved' ? (sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
                    </button>
                  </TH>
                  <TH>
                    <button type="button" onClick={() => toggleSort('finalCumulative')} aria-label={`${t(T.sortBy, lang)} ${t(T.cumulative, lang)}`} className="cursor-pointer flex items-center justify-center gap-1 hover:text-charcoal transition-colors bg-transparent border-none p-0 font-inherit text-inherit">
                      {t(T.cumulative, lang)}
                      {sortKey === 'finalCumulative' ? (sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
                    </button>
                  </TH>
                  <TH>
                    <button type="button" onClick={() => toggleSort('totalLoan')} aria-label={`${t(T.sortBy, lang)} ${t(T.loan, lang)}`} className="cursor-pointer flex items-center justify-center gap-1 hover:text-charcoal transition-colors bg-transparent border-none p-0 font-inherit text-inherit">
                      {t(T.loan, lang)}
                      {sortKey === 'totalLoan' ? (sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
                    </button>
                  </TH>
                  <TH>
                    <button type="button" onClick={() => toggleSort('totalInterest')} aria-label={`${t(T.sortBy, lang)} ${t(T.interest, lang)}`} className="cursor-pointer flex items-center justify-center gap-1 hover:text-charcoal transition-colors bg-transparent border-none p-0 font-inherit text-inherit">
                      {t(T.interest, lang)}
                      {sortKey === 'totalInterest' ? (sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
                    </button>
                  </TH>
                  {isAdmin && <TH>{t(T.actions, lang)}</TH>}
                </tr></thead>
                <tbody>
                  {pagedSummaries.map((m) => {
                    const displayName = lang === 'ta' && m.nameTA && m.nameTA !== m.name ? m.nameTA : m.name;
                    return (
                      <tr key={m.id} className="border-b border-sand/40 hover:bg-cream-dark/30 transition-colors">
                        <TD align="left" className="font-mono text-xs text-smoke">{m.id}</TD>
                        <TD align="left">
                          {editingId === m.id ? (
                            <div className="flex items-center gap-1">
                              <input value={editName} onChange={e => { setEditName(e.target.value); if (!editTamilTouched.current) setEditNameTA(transliterateToTamil(e.target.value)); }} aria-label={t(T.nameEnglish, lang)} className="bg-ivory border border-brass/30 rounded px-1.5 py-0.5 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-brass/40" />
                              <input value={editNameTA} onChange={e => { editTamilTouched.current = true; setEditNameTA(e.target.value); }} aria-label={t(T.nameTamil, lang)} className="bg-ivory border border-brass/30 rounded px-1.5 py-0.5 text-xs w-24 font-tamil focus:outline-none focus:ring-1 focus:ring-brass/40" placeholder="Tamil" />
                              <button onClick={() => handleEdit(m.id)} aria-label={t(T.save, lang)} className="text-forest hover:text-forest-light p-1.5"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingId(null)} aria-label={t(T.cancel, lang)} className="text-smoke hover:text-ruby p-1.5"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : <span className="font-medium">{displayName}</span>}
                        </TD>
                        <TD className="font-mono">{formatCurrency(m.totalSaved)}</TD>
                        <TD className="font-mono font-semibold text-brass-dark">{formatCurrency(m.finalCumulative)}</TD>
                        <TD>{m.totalLoan > 0 ? <span className="bg-ruby/10 text-ruby px-2 py-0.5 rounded-full text-xs font-semibold">{formatCurrency(m.totalLoan)}</span> : <span className="text-sand-dark">—</span>}</TD>
                        <TD>{m.totalInterest > 0 ? <span className="text-forest font-medium">{formatCurrency(m.totalInterest)}</span> : <span className="text-sand-dark">—</span>}</TD>
                        {isAdmin && (
                          <TD>
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => startEdit(m)} aria-label={t(T.editUser, lang)} className="text-smoke hover:text-brass p-1.5"><Edit3 className="w-3.5 h-3.5" /></button>
                              <ConfirmDialog
                                trigger={<Button variant="ghost" size="icon-sm" aria-label={t(T.deleteUser, lang)} className="text-smoke hover:text-ruby p-1.5"><Trash2 className="w-3.5 h-3.5" /></Button>}
                                title={t(T.confirmDeleteMember, lang)}
                                description={`${t(T.confirmDeleteMemberDesc, lang)}\n\n${displayName} (#${m.id})`}
                                confirmLabel={t(T.delete, lang)}
                                onConfirm={() => onRemove(m.id)}
                                variant="danger"
                              />
                            </div>
                          </TD>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={sorted.length} pageSize={PAGE_SIZE} />
        </ECard>
        <ECard className="lg:col-span-2" delay={2}>
          <ECardHeader titleKey="savingsShare" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" strokeWidth={2} stroke="#FDF6EC" label={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#2D2926', color: '#FDF6EC', border: 'none', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#FDF6EC' }} itemStyle={{ color: '#FDF6EC' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 px-1">
              {pieData.map((entry, i) => {
                const total = pieData.reduce((s, e) => s + e.value, 0);
                const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    <span className="text-[10px] text-charcoal/80 truncate">{entry.name}</span>
                    <span className="text-[10px] font-mono text-smoke/60 ml-auto shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ECard>
      </div>

      {/* ── Edit Member Dialog (card view) ── */}
      {dialogMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={t(T.editUser, lang)} onKeyDown={e => { if (e.key === 'Escape') closeDialog(); }} onClick={closeDialog}>
          <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" />
          <div className="relative bg-ivory rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl border border-sand/60 animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="px-4 pt-4 pb-2 border-b border-sand/60 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-smoke">#{dialogMember.id}</p>
                <h3 className="font-display text-sm font-semibold text-charcoal">{t(T.editUser, lang)}</h3>
              </div>
              <button onClick={closeDialog} aria-label={t(T.cancel, lang)} className="text-smoke hover:text-charcoal p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-smoke mb-1">{t(T.nameEnglish, lang)}</label>
                <input
                  value={dialogName}
                  onChange={e => { setDialogName(e.target.value); if (!dialogTamilTouched.current) setDialogNameTA(transliterateToTamil(e.target.value)); }}
                  className="w-full bg-cream-dark/40 border border-sand/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-smoke mb-1">{t(T.nameTamil, lang)}</label>
                <input
                  value={dialogNameTA}
                  onChange={e => { dialogTamilTouched.current = true; setDialogNameTA(e.target.value); }}
                  className="w-full bg-cream-dark/40 border border-sand/50 rounded-lg px-3 py-2 text-sm font-tamil focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  placeholder={t(T.enterTamilName, lang)}
                />
              </div>
            </div>
            <div className="px-4 pb-4 pt-2 flex gap-2">
              <Btn onClick={saveDialog} icon={Save} variant="primary" size="md" className="flex-1" disabled={!dialogName.trim()}>{t(T.save, lang)}</Btn>
              <Btn onClick={closeDialog} icon={X} variant="ghost" size="md">{t(T.cancel, lang)}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
