import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { isFirebaseConfigured } from '@/services/firebase/config';
import * as firestore from '@/services/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { MEMBERS as DEFAULT_MEMBERS, SAMPLE_YEAR_DATA, MONTHS, getYearSummary, recalculateAllMonths } from '@/data/sampleData';
import { GROUP_INFO } from '@/data/sampleData';
import { toast } from '@/hooks/use-toast';
import {
  assertMemberRecord,
  assertValidPersonName,
  assertValidYear,
  isPermissionDeniedError,
} from '@/lib/validators';

const DataContext = createContext(null);

const currentIndianFY = (() => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
})();

export function DataProvider({ children }) {
  const { user, isAdmin, loading: authLoading } = useAuth();
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

  const requireAdminAction = useCallback((actionLabel) => {
    if (isAdmin) return true;
    toast({
      title: 'Admin access required',
      description: `Only admins can ${actionLabel}.`,
      variant: 'destructive',
      duration: 4000,
    });
    return false;
  }, [isAdmin]);

  const showWriteError = useCallback((err, fallbackTitle) => {
    console.error(fallbackTitle, err);
    if (isPermissionDeniedError(err)) {
      toast({
        title: 'Permission denied',
        description: 'Your account does not have permission to perform this action.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }
    toast({
      title: fallbackTitle,
      description: err?.message || 'Unexpected error',
      variant: 'destructive',
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (authLoading) return;
    if (!user?.uid) return;
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
  }, [authLoading, user?.uid]);

  const years = Object.keys(allYearsData).map(Number).sort();
  const currentData = allYearsData[selectedYear];
  const summary = currentData ? getYearSummary(currentData) : null;

  const saveYearToFirestore = useCallback(async (year, yearData) => {
    if (!isFirebaseConfigured) return;
    try {
      const safeYear = assertValidYear(year);
      await firestore.saveYearData(safeYear, yearData, currentUsername);
    } catch (err) {
      showWriteError(err, 'Failed to save year data');
    }
  }, [currentUsername, showWriteError]);

  const updateMonthData = useCallback((year, monthIndex, newMembers) => {
    if (!requireAdminAction('update financial data')) return;
    if (groupClosed) {
      toast({ title: 'Group is closed. Data entry is disabled.', variant: 'destructive', duration: 4000 });
      return;
    }

    let safeYear;
    let safeMembers;
    try {
      safeYear = assertValidYear(year);
      if (!Array.isArray(newMembers)) throw new Error('Invalid month payload');
      safeMembers = newMembers.map(assertMemberRecord);
    } catch (err) {
      toast({ title: err.message || 'Invalid input', variant: 'destructive', duration: 4000 });
      return;
    }

    const yearData = allYearsData[safeYear];
    if (!yearData || !yearData.months?.[monthIndex]) return;

    const monthName = yearData.months[monthIndex]?.month || `Month ${monthIndex + 1}`;
    const oldMembers = yearData.months[monthIndex]?.members || [];
    const months = yearData.months.map((m, i) => {
      if (i !== monthIndex) return m;
      return { ...m, members: safeMembers };
    });
    const recalculated = recalculateAllMonths({ ...yearData, months });

    const totalSaving = safeMembers.reduce((s, m) => s + (m.saving || 0), 0);
    const totalNewLoan = safeMembers.reduce((s, m) => s + (m.loanTaken || 0), 0);
    const totalRepayment = safeMembers.reduce((s, m) => s + (m.loanRepayment || 0), 0);
    const changedMembers = [];

    safeMembers.forEach((nm) => {
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

    setAllYearsData(prev => ({ ...prev, [safeYear]: recalculated }));

    saveYearToFirestore(safeYear, recalculated);
    void firestore.logActivity({
      type: 'data_entry',
      user: currentUsername,
      detail: `Updated ${monthName} ${safeYear} data`,
      month: monthName,
      year: safeYear,
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
    toast({ title: `${monthName} ${safeYear} data saved`, variant: 'success' });
  }, [allYearsData, currentUsername, groupClosed, members, requireAdminAction, saveYearToFirestore]);

  const addNewYear = useCallback((year) => {
    if (!requireAdminAction('add a new year')) return;
    if (groupClosed) {
      toast({ title: 'Group is closed. Data entry is disabled.', variant: 'destructive', duration: 4000 });
      return;
    }

    let safeYear;
    try {
      safeYear = assertValidYear(year);
    } catch (err) {
      toast({ title: err.message || 'Invalid year', variant: 'destructive', duration: 4000 });
      return;
    }

    if (allYearsData[safeYear]) return;
    const newYearData = {
      year: safeYear,
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
    setAllYearsData(prev => ({ ...prev, [safeYear]: newYearData }));
    setSelectedYear(safeYear);
    saveYearToFirestore(safeYear, newYearData);
    void firestore.logActivity({
      type: 'year_add',
      user: currentUsername,
      detail: `Added new year ${safeYear}`,
      year: safeYear,
    });
    toast({ title: `Year ${safeYear} added`, variant: 'success' });
  }, [allYearsData, currentUsername, groupClosed, members, requireAdminAction, saveYearToFirestore]);

  const deleteYear = useCallback(async (year) => {
    if (!requireAdminAction('delete a year')) return;
    let safeYear;
    try {
      safeYear = assertValidYear(year);
    } catch (err) {
      toast({ title: err.message || 'Invalid year', variant: 'destructive', duration: 4000 });
      return;
    }
    const yearData = allYearsData[safeYear];
    if (!yearData) return;

    // Check if any month has data entered (non-zero savings, loans, or repayments)
    const hasData = yearData.months.some(m =>
      m.members.some(mem =>
        (mem.saving || 0) > 0 || (mem.loanTaken || 0) > 0 || (mem.loanRepayment || 0) > 0
      )
    );
    if (hasData) {
      toast({
        title: 'Cannot delete this year',
        description: 'This year has financial data entered. Remove all data first.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    // Safe to delete — no data entered
    const updated = { ...allYearsData };
    delete updated[safeYear];
    setAllYearsData(updated);

    // Switch to another year if the deleted one was selected
    if (selectedYear === safeYear) {
      const remaining = Object.keys(updated).map(Number).sort();
      setSelectedYear(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }

    if (isFirebaseConfigured) {
      try {
        await firestore.deleteYearData(safeYear);
      } catch (err) {
        showWriteError(err, 'Failed to delete year');
      }
    }
    void firestore.logActivity({
      type: 'year_delete',
      user: currentUsername,
      detail: `Deleted year ${safeYear}`,
      year: safeYear,
    });
    toast({ title: `Year ${safeYear} deleted`, variant: 'success' });
  }, [allYearsData, currentUsername, requireAdminAction, selectedYear, showWriteError]);

  const addMember = useCallback(async (name, nameTA) => {
    if (!requireAdminAction('add members')) return;

    let safeName;
    let safeNameTA;
    try {
      safeName = assertValidPersonName(name, 'Member name');
      safeNameTA = assertValidPersonName(nameTA, 'Member name (Tamil)', { optional: true }) || safeName;
    } catch (err) {
      toast({ title: err.message || 'Invalid member data', variant: 'destructive', duration: 4000 });
      return;
    }

    const maxId = members.reduce((max, m) => Math.max(max, m.id), 0);
    const newMember = { id: maxId + 1, name: safeName, nameTA: safeNameTA };
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
      try {
        await firestore.addMember({ id: newMember.id, name: safeName, nameTA: safeNameTA }, currentUsername);
      } catch (err) {
        showWriteError(err, 'Failed to add member');
      }
    }
    void firestore.logActivity({
      type: 'member_add',
      user: currentUsername,
      detail: `Added member "${safeName}"`,
      target: safeName,
    });
    toast({ title: `Member "${safeName}" added`, variant: 'success' });
  }, [allYearsData, currentUsername, members, requireAdminAction, saveYearToFirestore, showWriteError]);

  const removeMember = useCallback(async (memberId) => {
    if (!requireAdminAction('remove members')) return;
    const safeMemberId = Number(memberId);
    if (!Number.isInteger(safeMemberId) || safeMemberId <= 0) {
      toast({ title: 'Invalid member id', variant: 'destructive', duration: 4000 });
      return;
    }

    setMembers(prev => prev.filter(m => m.id !== safeMemberId));
    // Build updated data outside state updater to avoid StrictMode double-fire
    const updatedYears = { ...allYearsData };
    Object.keys(updatedYears).forEach(year => {
      updatedYears[year] = {
        ...updatedYears[year],
        months: updatedYears[year].months.map(m => {
          const filtered = m.members.filter(mem => mem.memberId !== safeMemberId);
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
      try {
        await firestore.deleteMember(safeMemberId);
      } catch (err) {
        showWriteError(err, 'Failed to remove member');
      }
    }
    void firestore.logActivity({
      type: 'member_remove',
      user: currentUsername,
      detail: `Removed member #${safeMemberId}`,
      target: String(safeMemberId),
    });
    toast({ title: 'Member removed', variant: 'success' });
  }, [allYearsData, currentUsername, requireAdminAction, saveYearToFirestore, showWriteError]);

  const editMember = useCallback(async (memberId, name, nameTA) => {
    if (!requireAdminAction('edit members')) return;

    const safeMemberId = Number(memberId);
    if (!Number.isInteger(safeMemberId) || safeMemberId <= 0) {
      toast({ title: 'Invalid member id', variant: 'destructive', duration: 4000 });
      return;
    }

    let safeName;
    let safeNameTA;
    try {
      safeName = assertValidPersonName(name, 'Member name');
      safeNameTA = assertValidPersonName(nameTA, 'Member name (Tamil)', { optional: true }) || safeName;
    } catch (err) {
      toast({ title: err.message || 'Invalid member data', variant: 'destructive', duration: 4000 });
      return;
    }

    setMembers(prev => prev.map(m => m.id === safeMemberId ? { ...m, name: safeName, nameTA: safeNameTA } : m));
    if (isFirebaseConfigured) {
      try {
        await firestore.updateMember(safeMemberId, { name: safeName, nameTA: safeNameTA }, currentUsername);
      } catch (err) {
        showWriteError(err, 'Failed to update member');
      }
    }
    void firestore.logActivity({
      type: 'member_edit',
      user: currentUsername,
      detail: `Edited member "${safeName}"`,
      target: safeName,
    });
    toast({ title: `Member "${safeName}" updated`, variant: 'success' });
  }, [currentUsername, requireAdminAction, showWriteError]);

  const closeGroup = useCallback(async () => {
    if (!requireAdminAction('close the group')) return;
    setGroupClosed(true);
    if (isFirebaseConfigured) {
      try {
        await firestore.updateGroupInfo({ isClosed: true }, currentUsername);
      } catch (err) {
        showWriteError(err, 'Failed to close group');
        setGroupClosed(false);
        return;
      }
    }
    void firestore.logActivity({
      type: 'group_close',
      user: currentUsername,
      detail: `Closed the group`,
    });
    toast({ title: 'Group closed', variant: 'destructive' });
  }, [currentUsername, requireAdminAction, showWriteError]);

  const reopenGroup = useCallback(async () => {
    if (!requireAdminAction('reopen the group')) return;
    setGroupClosed(false);
    if (isFirebaseConfigured) {
      try {
        await firestore.updateGroupInfo({ isClosed: false }, currentUsername);
      } catch (err) {
        showWriteError(err, 'Failed to reopen group');
        setGroupClosed(true);
        return;
      }
    }
    void firestore.logActivity({
      type: 'group_reopen',
      user: currentUsername,
      detail: `Reopened the group`,
    });
    toast({ title: 'Group reopened', variant: 'success' });
  }, [currentUsername, requireAdminAction, showWriteError]);

  return (
    <DataContext.Provider value={{
      allYearsData, selectedYear, setSelectedYear,
      members, groupClosed, years,
      currentData, summary,
      groupInfo, firestoreLoaded,
      updateMonthData, addNewYear, deleteYear, addMember, removeMember, editMember,
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
