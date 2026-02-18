import { useState } from 'react';
import { Users, TrendingUp, Shield, User, UserPlus, Edit3, Trash2, Save, X, Lock, Key, Check, AlertTriangle, ArrowRight, Calendar, Plus } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { getYearSummary } from '@/data/sampleData';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { SectionHeader, ECard, ECardHeader, FormInput, PasswordInput, Btn, ConfirmDialog } from '@/components/shared';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  assertStrongPassword,
  assertValidPersonName,
  assertValidUserRole,
  assertValidUsername,
  isPermissionDeniedError,
} from '@/lib/validators';

export default function SettingsPage() {
  const lang = useLang();
  const {
    user,
    isAdmin,
    registeredUsers,
    registerUser: onRegister,
    updateUser: onUpdateUser,
    deactivateUser: onDeactivateUser,
    reactivateUser: onReactivateUser,
    changeMyPassword: onChangeMyPassword,
  } = useAuth();
  const { members, groupClosed, closeGroup: onCloseGroup, reopenGroup: onReopenGroup, allYearsData, groupInfo, addNewYear, deleteYear } = useData();
  const { toast } = useToast();

  const [closeReason, setCloseReason] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newFullNameTA, setNewFullNameTA] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPw, setNewConfirmPw] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [userError, setUserError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editFullNameTA, setEditFullNameTA] = useState('');
  const [editRole, setEditRole] = useState('member');
  const [changePwCurrent, setChangePwCurrent] = useState('');
  const [changePwNew, setChangePwNew] = useState('');
  const [changePwConfirm, setChangePwConfirm] = useState('');
  const [changePwError, setChangePwError] = useState('');

  const years = Object.keys(allYearsData).map(Number).sort();
  const totalAllYearsSavings = years.reduce((s, y) => s + getYearSummary(allYearsData[y]).totalSavings, 0);
  const totalAllYearsLoans = years.reduce((s, y) => s + getYearSummary(allYearsData[y]).totalLoans, 0);

  // Year management
  const currentCalendarYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentCalendarYear - 10; y <= currentCalendarYear + 5; y++) {
    if (!years.includes(y)) yearOptions.push(y);
  }
  const handleAddYear = (yearStr) => {
    addNewYear(parseInt(yearStr, 10));
  };
  const yearHasData = (y) => {
    const yd = allYearsData[y];
    if (!yd) return false;
    return yd.months.some(m => m.members.some(mem => (mem.saving || 0) > 0 || (mem.loanTaken || 0) > 0 || (mem.loanRepayment || 0) > 0));
  };

  const handleCreateUser = async () => {
    if (newPassword !== newConfirmPw) {
      setUserError(t(T.passwordMismatch, lang));
      return;
    }

    let safeUsername;
    let safeFullName;
    let safeFullNameTA;
    let safeRole;
    let safePassword;

    try {
      safeUsername = assertValidUsername(newUsername);
      safeFullName = assertValidPersonName(newFullName, 'Full name');
      safeFullNameTA = assertValidPersonName(newFullNameTA, 'Full name (Tamil)', { optional: true });
      safeRole = assertValidUserRole(newRole);
      safePassword = assertStrongPassword(newPassword);
    } catch (err) {
      setUserError(err.message || t(T.registerError, lang));
      return;
    }
    if (registeredUsers.some(u => u.username.toLowerCase() === safeUsername)) {
      setUserError(t(T.userExists, lang));
      return;
    }

    try {
      await onRegister({
        username: safeUsername,
        password: safePassword,
        fullName: safeFullName,
        fullNameTA: safeFullNameTA,
        role: safeRole,
      });
      setNewFullName(''); setNewFullNameTA(''); setNewUsername(''); setNewPassword(''); setNewConfirmPw(''); setNewRole('member'); setUserError('');
      setShowCreateUser(false);
      toast({ title: t(T.userCreated, lang), variant: 'success' });
    } catch (err) {
      setUserError(err.message || t(T.registerError, lang));
    }
  };

  const startEditUser = (u) => {
    setEditingUser(u.username);
    setEditFullName(u.fullName);
    setEditFullNameTA(u.fullNameTA || '');
    setEditRole(u.role);
  };

  const handleSaveEditUser = async () => {
    let safeFullName;
    let safeFullNameTA;
    let safeRole;

    try {
      safeFullName = assertValidPersonName(editFullName, 'Full name');
      safeFullNameTA = assertValidPersonName(editFullNameTA, 'Full name (Tamil)', { optional: true });
      safeRole = assertValidUserRole(editRole);
    } catch (err) {
      toast({ title: err.message || 'Invalid user data', variant: 'destructive' });
      return;
    }

    const updates = { fullName: safeFullName, fullNameTA: safeFullNameTA, role: safeRole };
    try {
      await onUpdateUser(editingUser, updates);
      setEditingUser(null);
      toast({ title: t(T.userUpdated, lang), variant: 'success' });
    } catch (err) {
      toast({
        title: isPermissionDeniedError(err) ? 'Permission denied' : (err.message || 'Update failed'),
        variant: 'destructive',
      });
    }
  };

  const handleUserStatusChange = async (username, nextStatus) => {
    if (username === user.username && nextStatus === 'disabled') {
      toast({ title: t(T.cannotDeleteSelf, lang), variant: 'destructive' });
      return;
    }
    try {
      if (nextStatus === 'disabled') {
        await onDeactivateUser(username);
      } else {
        await onReactivateUser(username);
      }
      toast({
        title: nextStatus === 'disabled' ? 'User deactivated successfully' : 'User reactivated successfully',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: isPermissionDeniedError(err) ? 'Permission denied' : (err.message || 'Status update failed'),
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async () => {
    if (!changePwNew.trim() || !changePwCurrent.trim()) {
      setChangePwError(t(T.registerError, lang));
      return;
    }

    if (changePwNew !== changePwConfirm) {
      setChangePwError(t(T.passwordMismatch, lang));
      return;
    }

    let safeNewPassword;
    try {
      safeNewPassword = assertStrongPassword(changePwNew);
    } catch (err) {
      setChangePwError(err.message || t(T.passwordChangeFailed, lang));
      return;
    }

    try {
      await onChangeMyPassword(changePwCurrent, safeNewPassword);
      setChangePwCurrent('');
      setChangePwNew('');
      setChangePwConfirm('');
      setChangePwError('');
      toast({ title: t(T.passwordChanged, lang), variant: 'success' });
    } catch (err) {
      setChangePwError(err.message || t(T.passwordChangeFailed, lang));
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader titleKey="settings" subtitle={t(T.groupManagement, lang)} />

      {isAdmin && (
        <ECard delay={1}>
          <ECardHeader titleKey="userManagement"
            action={!showCreateUser && <Btn onClick={() => setShowCreateUser(true)} icon={UserPlus} variant="primary" size="xs">{t(T.createUser, lang)}</Btn>} />
          <div className="p-4">
            {userError && (
              <div className="bg-ruby/8 text-ruby border border-ruby/20 rounded-lg px-3 py-2 text-[11px] flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{userError}
              </div>
            )}
            {showCreateUser && (
              <div className="bg-cream-dark/20 border border-sand/60 rounded-xl p-4 mb-4 space-y-3">
                <div className="flex items-center gap-2 mb-1"><UserPlus className="w-4 h-4 text-terracotta" /><h4 className="font-display text-sm font-semibold">{t(T.createUser, lang)}</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput label={t(T.fullName, lang)} value={newFullName} onChange={e => { setNewFullName(e.target.value); setUserError(''); }} placeholder={t(T.enterFullName, lang)} icon={User} />
                  <FormInput label={t(T.fullNameTA, lang)} value={newFullNameTA} onChange={e => setNewFullNameTA(e.target.value)} placeholder={t(T.enterFullNameTA, lang)} />
                  <FormInput label={t(T.username, lang)} value={newUsername} onChange={e => { setNewUsername(e.target.value); setUserError(''); }} placeholder={t(T.enterUsername, lang)} icon={Users} />
                  <div>
                    <label className="block text-[10px] font-semibold text-smoke uppercase tracking-wider mb-1">{t(T.role, lang)}</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setNewRole('member')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium border transition-all ${newRole === 'member' ? 'bg-forest/10 text-forest border-forest/30' : 'bg-ivory border-sand text-smoke hover:bg-sand/30'}`}>
                        <User className="w-3 h-3" /> {t(T.member, lang)}
                      </button>
                      <button type="button" onClick={() => setNewRole('admin')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium border transition-all ${newRole === 'admin' ? 'bg-terracotta/10 text-terracotta border-terracotta/30' : 'bg-ivory border-sand text-smoke hover:bg-sand/30'}`}>
                        <Shield className="w-3 h-3" /> {t(T.admin, lang)}
                      </button>
                    </div>
                  </div>
                  <PasswordInput label={t(T.password, lang)} value={newPassword} onChange={e => { setNewPassword(e.target.value); setUserError(''); }} placeholder={t(T.enterPassword, lang)} />
                  <PasswordInput label={t(T.confirmPassword, lang)} value={newConfirmPw} onChange={e => { setNewConfirmPw(e.target.value); setUserError(''); }} placeholder={t(T.enterConfirmPassword, lang)} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Btn onClick={handleCreateUser} icon={UserPlus} variant="primary" size="md" disabled={!newFullName.trim() || !newUsername.trim() || !newPassword.trim()}>{t(T.registerBtn, lang)}</Btn>
                  <Btn onClick={() => { setShowCreateUser(false); setUserError(''); }} icon={X} variant="ghost" size="md">{t(T.cancel, lang)}</Btn>
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] text-smoke uppercase tracking-wider font-semibold mb-2">{t(T.registeredUsers, lang)} ({registeredUsers.length})</p>
              <div className="space-y-1.5">
                {registeredUsers.map((u, i) => (
                  <div key={i} className="bg-cream-dark/20 rounded-lg px-3 py-2">
                    {editingUser === u.username ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1"><Edit3 className="w-3.5 h-3.5 text-brass" /><span className="text-xs font-semibold text-charcoal">{t(T.editUser, lang)}: @{u.username}</span></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <FormInput label={t(T.fullName, lang)} value={editFullName} onChange={e => setEditFullName(e.target.value)} placeholder={t(T.enterFullName, lang)} icon={User} />
                          <FormInput label={t(T.fullNameTA, lang)} value={editFullNameTA} onChange={e => setEditFullNameTA(e.target.value)} placeholder={t(T.enterFullNameTA, lang)} />
                          <div>
                            <label className="block text-[10px] font-semibold text-smoke uppercase tracking-wider mb-1">{t(T.role, lang)}</label>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditRole('member')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${editRole === 'member' ? 'bg-forest/10 text-forest border-forest/30' : 'bg-ivory border-sand text-smoke hover:bg-sand/30'}`}>
                                <User className="w-2.5 h-2.5" /> {t(T.member, lang)}
                              </button>
                              <button type="button" onClick={() => setEditRole('admin')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${editRole === 'admin' ? 'bg-terracotta/10 text-terracotta border-terracotta/30' : 'bg-ivory border-sand text-smoke hover:bg-sand/30'}`}>
                                <Shield className="w-2.5 h-2.5" /> {t(T.admin, lang)}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Btn onClick={handleSaveEditUser} icon={Save} variant="success" size="xs">{t(T.updateUser, lang)}</Btn>
                          <Btn onClick={() => setEditingUser(null)} icon={X} variant="ghost" size="xs">{t(T.cancel, lang)}</Btn>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-terracotta/60 to-brass/60 flex items-center justify-center text-[10px] font-bold text-cream shrink-0">{u.username[0].toUpperCase()}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-charcoal truncate">{u.fullName}</p>
                          <p className="text-[10px] text-smoke">@{u.username}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0 ${u.role === 'admin' ? 'bg-terracotta/10 text-terracotta' : 'bg-forest/10 text-forest'}`}>
                          {u.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                          {u.role === 'admin' ? t(T.admin, lang) : t(T.member, lang)}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0 ${u.status === 'disabled' ? 'bg-ruby/10 text-ruby' : 'bg-forest/10 text-forest'}`}>
                          {u.status === 'disabled' ? 'Disabled' : 'Active'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon-sm" onClick={() => startEditUser(u)} title={t(T.editUser, lang)} className="text-smoke hover:text-brass"><Edit3 className="w-3 h-3" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title={u.status === 'disabled' ? 'Reactivate user' : 'Deactivate user'}
                                className={`text-smoke ${u.status === 'disabled' ? 'hover:text-forest' : 'hover:text-ruby'}`}
                                disabled={u.username === user.username && u.status !== 'disabled'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{u.status === 'disabled' ? 'Reactivate this user?' : 'Deactivate this user?'}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {u.fullName} (@{u.username})
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t(T.cancel, lang)}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleUserStatusChange(u.username, u.status === 'disabled' ? 'active' : 'disabled')}
                                  className={u.status === 'disabled' ? 'bg-forest hover:bg-forest/80' : 'bg-ruby hover:bg-ruby/80'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> {u.status === 'disabled' ? 'Reactivate' : 'Deactivate'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ECard>
      )}

      <ECard delay={isAdmin ? 2 : 1}>
        <ECardHeader titleKey="groupInfo" />
        <div className="p-4 space-y-4">
          {/* Group Name header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-terracotta/8 shrink-0"><Users className="w-4 h-4 text-terracotta" /></div>
            <div className="min-w-0">
              <p className="text-[10px] text-smoke uppercase tracking-wider mb-0.5">{t(T.groupName, lang)}</p>
              <p className="font-tamil text-sm font-semibold leading-tight">{groupInfo.nameTA}</p>
              <p className="text-[11px] text-smoke leading-tight">{groupInfo.nameEN}</p>
            </div>
          </div>
          {/* Info grid — 2 cols on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-cream-dark/30 rounded-lg p-2.5">
              <p className="text-[9px] text-smoke uppercase tracking-wider mb-1">{t(T.started, lang)}</p>
              <p className="font-mono text-xs font-semibold">{groupInfo.startDate}</p>
            </div>
            <div className="bg-cream-dark/30 rounded-lg p-2.5">
              <p className="text-[9px] text-smoke uppercase tracking-wider mb-1">{t(T.monthlySavingAmt, lang)}</p>
              <p className="font-mono text-xs font-semibold">{formatCurrency(groupInfo.monthlySaving)}</p>
            </div>
            <div className="bg-cream-dark/30 rounded-lg p-2.5">
              <p className="text-[9px] text-smoke uppercase tracking-wider mb-1">{t(T.members, lang)}</p>
              <p className="font-mono text-xs font-semibold">{members.length}</p>
            </div>
            <div className="bg-cream-dark/30 rounded-lg p-2.5">
              <p className="text-[9px] text-smoke uppercase tracking-wider mb-1">{t(T.statusLabel, lang)}</p>
              <p className={`text-xs font-semibold ${groupClosed ? 'text-ruby' : 'text-forest'}`}>{groupClosed ? t(T.closed, lang) : t(T.active, lang)}</p>
            </div>
          </div>
          {/* All-Time Summary header */}
          <div className="flex items-center gap-3 pt-1">
            <div className="p-2 rounded-lg bg-brass/8 shrink-0"><TrendingUp className="w-4 h-4 text-brass" /></div>
            <p className="text-[10px] text-smoke uppercase tracking-wider font-semibold">{t(T.allTimeSummary, lang)}</p>
          </div>
          {/* Summary grid — 2 cols on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-cream-dark/30 rounded-lg p-2.5">
              <p className="text-[9px] text-smoke uppercase tracking-wider mb-1">{t(T.totalSavings, lang)}</p>
              <p className="font-mono text-xs font-semibold text-terracotta">{formatCurrency(totalAllYearsSavings)}</p>
            </div>
            <div className="bg-cream-dark/30 rounded-lg p-2.5">
              <p className="text-[9px] text-smoke uppercase tracking-wider mb-1">{t(T.totalLoans, lang)}</p>
              <p className="font-mono text-xs font-semibold text-ruby">{formatCurrency(totalAllYearsLoans)}</p>
            </div>
            <div className="bg-cream-dark/30 rounded-lg p-2.5">
              <p className="text-[9px] text-smoke uppercase tracking-wider mb-1">{t(T.yearsActive, lang)}</p>
              <p className="font-mono text-xs font-semibold">{years.length} ({years[0]}–{years[years.length - 1]})</p>
            </div>
            <div className="bg-cream-dark/30 rounded-lg p-2.5">
              <p className="text-[9px] text-smoke uppercase tracking-wider mb-1">{t(T.loggedInAs, lang)}</p>
              <p className="text-xs font-semibold truncate">{user.username} <span className="text-smoke/50">({user.role})</span></p>
            </div>
          </div>
        </div>
      </ECard>

      {isAdmin && (
        <ECard delay={isAdmin ? 2 : 1}>
          <ECardHeader titleKey="yearManagement" />
          <div className="p-4 space-y-4">
            {/* Add new year */}
            {!groupClosed && yearOptions.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-terracotta/8 shrink-0"><Calendar className="w-4 h-4 text-terracotta" /></div>
                <Select onValueChange={handleAddYear}>
                  <SelectTrigger className="w-44 h-9">
                    <SelectValue placeholder={t(T.addNewYear, lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Existing years list */}
            <div>
              <p className="text-[10px] text-smoke uppercase tracking-wider font-semibold mb-2">{t(T.existingYears, lang)} ({years.length})</p>
              <div className="space-y-1.5">
                {years.map(y => {
                  const hasData = yearHasData(y);
                  return (
                    <div key={y} className="flex items-center justify-between bg-cream-dark/20 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-smoke/50" />
                        <span className="font-display text-xs font-bold text-charcoal">{y}</span>
                        {hasData && <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-forest/10 text-forest">{t(T.hasData, lang)}</span>}
                        {!hasData && <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-sand/50 text-smoke">{t(T.emptyYear, lang)}</span>}
                      </div>
                      {!hasData ? (
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon-sm" className="text-smoke hover:text-ruby"><Trash2 className="w-3.5 h-3.5" /></Button>}
                          title={`Delete year ${y}?`}
                          description="This will permanently remove this year and all its empty records."
                          confirmLabel={t(T.delete, lang)}
                          onConfirm={() => deleteYear(y)}
                          variant="danger"
                        />
                      ) : (
                        <span className="text-[9px] text-smoke/50 italic">{t(T.cannotDeleteWithData, lang)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ECard>
      )}

      {isAdmin ? (
        <ECard delay={isAdmin ? 3 : 2}>
          <ECardHeader titleKey="groupClosing" />
          <div className="p-4">
            {groupClosed ? (
              <div className="space-y-4">
                <div className="bg-ruby/8 border border-ruby/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-ruby shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display text-sm font-bold text-ruby">{t(T.groupIsClosed, lang)}</h4>
                    <p className="text-[11px] text-ruby/70 mt-1">{t(T.groupClosedDetail, lang)}</p>
                  </div>
                </div>
                <Btn onClick={onReopenGroup} icon={ArrowRight} variant="success" size="md">{t(T.reopenGroup, lang)}</Btn>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-cream-dark/30 rounded-xl p-4">
                  <h4 className="font-display text-sm font-semibold text-charcoal mb-2">{t(T.closeGroup, lang)}</h4>
                  <p className="text-[11px] text-smoke mb-3">{t(T.groupClosingDesc, lang)}</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm"><AlertTriangle className="w-3.5 h-3.5" /> {t(T.closeGroup, lang)}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-ruby" />{t(T.confirmClose, lang)}</AlertDialogTitle>
                        <AlertDialogDescription>{t(T.groupClosingDesc, lang)}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-2">
                        <Label>{t(T.reasonClosing, lang)}</Label>
                        <Input value={closeReason} onChange={e => setCloseReason(e.target.value)} placeholder={t(T.enterReason, lang)} />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t(T.cancel, lang)}</AlertDialogCancel>
                        <AlertDialogAction onClick={onCloseGroup} className="bg-ruby hover:bg-ruby/80">
                          <Check className="w-3.5 h-3.5" /> {t(T.confirmCloseBtn, lang)}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        </ECard>
      ) : (
        <ECard delay={2}>
          <div className="p-8 text-center">
            <Lock className="w-6 h-6 text-smoke/30 mx-auto mb-2" />
            <p className="font-display text-sm text-smoke italic">{t(T.adminRequired, lang)}</p>
          </div>
        </ECard>
      )}

      <ECard delay={isAdmin ? 3 : 2}>
        <ECardHeader titleKey="changePassword" action={null} />
        <div className="p-4">
          {changePwError && (
            <div className="bg-ruby/8 text-ruby border border-ruby/20 rounded-lg px-3 py-2 text-[11px] flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{changePwError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PasswordInput label={t(T.currentPassword, lang)} value={changePwCurrent} onChange={e => { setChangePwCurrent(e.target.value); setChangePwError(''); }} placeholder={t(T.enterPassword, lang)} icon={Lock} />
            <div />
            <PasswordInput label={t(T.newPasswordLabel, lang)} value={changePwNew} onChange={e => { setChangePwNew(e.target.value); setChangePwError(''); }} placeholder={t(T.enterNewPassword, lang)} icon={Key} />
            <PasswordInput label={t(T.confirmPassword, lang)} value={changePwConfirm} onChange={e => { setChangePwConfirm(e.target.value); setChangePwError(''); }} placeholder={t(T.enterConfirmPassword, lang)} />
          </div>
          <div className="flex gap-2 pt-4">
            <Btn onClick={handleChangePassword} icon={Key} variant="primary" size="md" disabled={!changePwNew.trim() || !changePwCurrent.trim()}>{t(T.changePassword, lang)}</Btn>
          </div>
        </div>
      </ECard>
    </div>
  );
}
