import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { isFirebaseConfigured } from '@/services/firebase/config';
import * as firestore from '@/services/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { MEMBERS as DEFAULT_MEMBERS, SAMPLE_YEAR_DATA, MONTHS, getYearSummary, recalculateAllMonths } from '@/data/sampleData';
import { GROUP_INFO } from '@/data/sampleData';
import { toast } from '@/hooks/use-toast';

const DataContext = createContext(null);

const currentIndianFY = (() => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
})();

export function DataProvider({ children }) {
  const { user } = useAuth();
  const currentUsername = user?.username || 'system';

  const [allYearsData, setAllYearsData] = useState(() => {
    const initial = { 2024: SAMPLE_YEAR_DATA };
    if (!initial[currentIndianFY]) {
      initial[currentIndianFY] = {
        year: currentIndianFY,
        months: MONTHS.map((month, i) => ({
          month, monthIndex: i,
          members: DEFAULT_MEMBERS.map(m => ({
            memberId: m.id, saving: 0, cumulative: 0,
            loanTaken: 0, loanRepayment: 0,
            oldLoan: 0, oldInterest: 0, currentInterest: 0, balance: 0,
            interest: 0, loanBalance: 0,
          })),
          totalSaving: 0, totalCumulative: 0,
        })),
      };
    }
    return initial;
  });

  const [selectedYear, setSelectedYear] = useState(2024);
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [groupInfo, setGroupInfo] = useState(GROUP_INFO);
  const [groupClosed, setGroupClosed] = useState(false);
  const [firestoreLoaded, setFirestoreLoaded] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const loadFromFirestore = async () => {
      try {
        const gInfo = await firestore.getGroupInfo();
        if (gInfo) {
          setGroupInfo(prev => ({ ...prev, ...gInfo }));
          if (gInfo.isClosed) setGroupClosed(true);
        }
        const firestoreMembers = await firestore.getMembers();
        if (firestoreMembers.length > 0) {
          const membersWithIds = firestoreMembers.map((m, i) => ({
            id: m.id ? (typeof m.id === 'number' ? m.id : i + 1) : i + 1,
            name: m.name || `Member ${i + 1}`,
            nameTA: m.nameTA || m.name || `Member ${i + 1}`,
            ...m,
          }));
          setMembers(membersWithIds);
        }
        const availableYears = await firestore.getAvailableYears();
        if (availableYears.length > 0) {
          const yearsData = {};
          for (const year of availableYears) {
            const yearData = await firestore.getYearData(year);
            if (yearData) yearsData[year] = yearData;
          }
          if (Object.keys(yearsData).length > 0) setAllYearsData(yearsData);
        }
      } catch (err) {
        console.error('Error loading from Firestore:', err);
        toast({ title: 'Failed to load data. Showing cached data.', variant: 'destructive', duration: 5000 });
      } finally {
        setFirestoreLoaded(true);
      }
    };
    loadFromFirestore();
  }, []);

  const years = Object.keys(allYearsData).map(Number).sort();
  const currentData = allYearsData[selectedYear];
  const summary = currentData ? getYearSummary(currentData) : null;

  const saveYearToFirestore = useCallback(async (year, yearData) => {
    if (!isFirebaseConfigured) return;
    try { await firestore.saveYearData(year, yearData, currentUsername); }
    catch (err) { console.error('Error saving year data:', err); }
  }, [currentUsername]);

  const updateMonthData = useCallback((year, monthIndex, newMembers) => {
    // Build recalculated data and change summary OUTSIDE state updater
    // to avoid React StrictMode double-firing side effects
    const yearData = allYearsData[year];
    if (!yearData) return;
    const monthName = yearData.months[monthIndex]?.month || `Month ${monthIndex + 1}`;
    const oldMembers = yearData.months[monthIndex]?.members || [];
    const months = yearData.months.map((m, i) => {
      if (i !== monthIndex) return m;
      return { ...m, members: newMembers };
    });
    const recalculated = recalculateAllMonths({ ...yearData, months });

    // Build detailed change summary
    const totalSaving = newMembers.reduce((s, m) => s + (m.saving || 0), 0);
    const totalNewLoan = newMembers.reduce((s, m) => s + (m.loanTaken || 0), 0);
    const totalRepayment = newMembers.reduce((s, m) => s + (m.loanRepayment || 0), 0);
    const changedMembers = [];
    newMembers.forEach(nm => {
      const om = oldMembers.find(o => o.memberId === nm.memberId);
      if (!om) return;
      const diffs = [];
      if (nm.saving !== om.saving) diffs.push(`saving: ${om.saving}→${nm.saving}`);
      if (nm.loanTaken !== om.loanTaken) diffs.push(`loan: ${om.loanTaken}→${nm.loanTaken}`);
      if (nm.loanRepayment !== om.loanRepayment) diffs.push(`repay: ${om.loanRepayment}→${nm.loanRepayment}`);
      if (diffs.length > 0) {
        const info = members.find(m => m.id === nm.memberId);
        changedMembers.push({ id: nm.memberId, name: info?.nameTA || info?.name || `#${nm.memberId}`, diffs });
      }
    });

    // Update state (pure — no side effects)
    setAllYearsData(prev => ({ ...prev, [year]: recalculated }));

    // Side effects OUTSIDE state updater — runs only once
    saveYearToFirestore(year, recalculated);
    firestore.logActivity({
      type: 'data_entry',
      user: currentUsername,
      detail: `Updated ${monthName} ${year} data`,
      month: monthName, year,
      summary: {
        totalSaving,
        totalNewLoan,
        totalRepayment,
        membersChanged: changedMembers.length,
      },
      changedMembers: changedMembers.slice(0, 10).map(cm => ({
        id: cm.id,
        name: cm.name,
        changes: cm.diffs.join(', '),
      })),
    });
    toast({ title: `${monthName} ${year} data saved`, variant: 'success' });
  }, [allYearsData, saveYearToFirestore, currentUsername, members]);

  const addNewYear = useCallback((year) => {
    if (allYearsData[year]) return;
    const newYearData = {
      year,
      months: MONTHS.map((month, i) => ({
        month, monthIndex: i,
        members: members.map(m => ({
          memberId: m.id, saving: 0, cumulative: 0,
          loanTaken: 0, loanRepayment: 0,
          oldLoan: 0, oldInterest: 0, currentInterest: 0, balance: 0,
          interest: 0, loanBalance: 0,
        })),
        totalSaving: 0, totalCumulative: 0,
      })),
    };
    setAllYearsData(prev => ({ ...prev, [year]: newYearData }));
    setSelectedYear(year);
    saveYearToFirestore(year, newYearData);
    firestore.logActivity({
      type: 'year_add',
      user: currentUsername,
      detail: `Added new year ${year}`,
      year,
    });
    toast({ title: `Year ${year} added`, variant: 'success' });
  }, [allYearsData, members, saveYearToFirestore, currentUsername]);

  const addMember = useCallback(async (name, nameTA) => {
    const maxId = members.reduce((max, m) => Math.max(max, m.id), 0);
    const newMember = { id: maxId + 1, name, nameTA: nameTA || name };
    setMembers(prev => [...prev, newMember]);
    // Build updated data outside state updater to avoid StrictMode double-fire
    const updatedYears = { ...allYearsData };
    Object.keys(updatedYears).forEach(year => {
      updatedYears[year] = {
        ...updatedYears[year],
        months: updatedYears[year].months.map(m => ({
          ...m, members: [...m.members, {
            memberId: newMember.id, saving: 0, cumulative: 0,
            loanTaken: 0, loanRepayment: 0,
            oldLoan: 0, oldInterest: 0, currentInterest: 0, balance: 0,
            interest: 0, loanBalance: 0,
          }],
        })),
      };
    });
    setAllYearsData(updatedYears);
    // Side effects outside state updater
    Object.keys(updatedYears).forEach(year => {
      saveYearToFirestore(Number(year), updatedYears[year]);
    });
    if (isFirebaseConfigured) {
      try { await firestore.addMember({ id: newMember.id, name, nameTA: nameTA || name }, currentUsername); }
      catch (err) { console.error('Error adding member:', err); }
    }
    firestore.logActivity({
      type: 'member_add',
      user: currentUsername,
      detail: `Added member "${name}"`,
      target: name,
    });
    toast({ title: `Member "${name}" added`, variant: 'success' });
  }, [members, allYearsData, saveYearToFirestore, currentUsername]);

  const removeMember = useCallback(async (memberId) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    // Build updated data outside state updater to avoid StrictMode double-fire
    const updatedYears = { ...allYearsData };
    Object.keys(updatedYears).forEach(year => {
      updatedYears[year] = {
        ...updatedYears[year],
        months: updatedYears[year].months.map(m => {
          const filtered = m.members.filter(mem => mem.memberId !== memberId);
          return { ...m, members: filtered,
            totalSaving: filtered.reduce((s, mem) => s + mem.saving, 0),
            totalCumulative: filtered.reduce((s, mem) => s + mem.cumulative, 0),
          };
        }),
      };
    });
    setAllYearsData(updatedYears);
    // Side effects outside state updater
    Object.keys(updatedYears).forEach(year => {
      saveYearToFirestore(Number(year), updatedYears[year]);
    });
    if (isFirebaseConfigured) {
      try { await firestore.deleteMember(memberId); }
      catch (err) { console.error('Error removing member:', err); }
    }
    firestore.logActivity({
      type: 'member_remove',
      user: currentUsername,
      detail: `Removed member #${memberId}`,
      target: String(memberId),
    });
    toast({ title: 'Member removed', variant: 'success' });
  }, [allYearsData, saveYearToFirestore, currentUsername]);

  const editMember = useCallback(async (memberId, name, nameTA) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, name, nameTA: nameTA || name } : m));
    if (isFirebaseConfigured) {
      try { await firestore.updateMember(memberId, { name, nameTA: nameTA || name }, currentUsername); }
      catch (err) { console.error('Error updating member:', err); }
    }
    firestore.logActivity({
      type: 'member_edit',
      user: currentUsername,
      detail: `Edited member "${name}"`,
      target: name,
    });
    toast({ title: `Member "${name}" updated`, variant: 'success' });
  }, [currentUsername]);

  const closeGroup = useCallback(async () => {
    setGroupClosed(true);
    if (isFirebaseConfigured) {
      try { await firestore.updateGroupInfo({ isClosed: true }, currentUsername); }
      catch (err) { console.error('Error closing group:', err); }
    }
    firestore.logActivity({
      type: 'group_close',
      user: currentUsername,
      detail: `Closed the group`,
    });
    toast({ title: 'Group closed', variant: 'destructive' });
  }, [currentUsername]);

  const reopenGroup = useCallback(async () => {
    setGroupClosed(false);
    if (isFirebaseConfigured) {
      try { await firestore.updateGroupInfo({ isClosed: false }, currentUsername); }
      catch (err) { console.error('Error reopening group:', err); }
    }
    firestore.logActivity({
      type: 'group_reopen',
      user: currentUsername,
      detail: `Reopened the group`,
    });
    toast({ title: 'Group reopened', variant: 'success' });
  }, [currentUsername]);

  return (
    <DataContext.Provider value={{
      allYearsData, selectedYear, setSelectedYear,
      members, groupClosed, years,
      currentData, summary,
      groupInfo, firestoreLoaded,
      updateMonthData, addNewYear, addMember, removeMember, editMember,
      closeGroup, reopenGroup,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export default DataContext;
