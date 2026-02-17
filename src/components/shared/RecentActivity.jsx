import { useState, useEffect } from 'react';
import { LogIn, LogOut, PenLine, UserPlus, UserMinus, Edit3, Trash2, Calendar, Lock, Unlock, Activity, ChevronDown, ChevronUp, Wallet, CreditCard, ArrowDownRight } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { isFirebaseConfigured } from '@/services/firebase/config';
import * as firestore from '@/services/firebase/firestore';
import T, { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';

const ACTIVITY_CONFIG = {
  login:        { icon: LogIn,     color: 'text-forest',     bg: 'bg-forest/10',    key: 'actLogin' },
  logout:       { icon: LogOut,    color: 'text-smoke',      bg: 'bg-sand/40',       key: 'actLogout' },
  data_entry:   { icon: PenLine,   color: 'text-terracotta', bg: 'bg-terracotta/10', key: 'actDataEntry' },
  member_add:   { icon: UserPlus,  color: 'text-forest',     bg: 'bg-forest/10',     key: 'actMemberAdd' },
  member_edit:  { icon: Edit3,     color: 'text-brass',      bg: 'bg-brass/10',      key: 'actMemberEdit' },
  member_remove:{ icon: UserMinus, color: 'text-ruby',       bg: 'bg-ruby/10',       key: 'actMemberRemove' },
  user_create:  { icon: UserPlus,  color: 'text-forest',     bg: 'bg-forest/10',     key: 'actUserCreate' },
  user_update:  { icon: Edit3,     color: 'text-brass',      bg: 'bg-brass/10',      key: 'actUserUpdate' },
  user_delete:  { icon: Trash2,    color: 'text-ruby',       bg: 'bg-ruby/10',       key: 'actUserDelete' },
  year_add:     { icon: Calendar,  color: 'text-terracotta', bg: 'bg-terracotta/10', key: 'actYearAdd' },
  group_close:  { icon: Lock,      color: 'text-ruby',       bg: 'bg-ruby/10',       key: 'actGroupClose' },
  group_reopen: { icon: Unlock,    color: 'text-forest',     bg: 'bg-forest/10',     key: 'actGroupReopen' },
};

function timeAgo(isoStr, lang) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t(T.justNow, lang);
  if (mins < 60) return `${mins} ${t(T.minutesAgo, lang)}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t(T.hoursAgo, lang)}`;
  const days = Math.floor(hrs / 24);
  return `${days} ${t(T.daysAgo, lang)}`;
}

// Inline summary for data_entry — single line with key numbers
function DataEntrySummary({ summary }) {
  if (!summary) return null;
  const parts = [];
  if (summary.totalSaving > 0) parts.push({ icon: Wallet, value: formatCurrency(summary.totalSaving), cls: 'text-terracotta-deep' });
  if (summary.totalNewLoan > 0) parts.push({ icon: CreditCard, value: formatCurrency(summary.totalNewLoan), cls: 'text-ruby' });
  if (summary.totalRepayment > 0) parts.push({ icon: ArrowDownRight, value: formatCurrency(summary.totalRepayment), cls: 'text-forest' });
  if (parts.length === 0) return null;
  return (
    <div className="flex items-center gap-3 mt-1">
      {parts.map((p, i) => {
        const Icon = p.icon;
        return (
          <span key={i} className={`inline-flex items-center gap-1 text-[10px] font-semibold ${p.cls}`}>
            <Icon className="w-3 h-3 opacity-60" />
            {p.value}
          </span>
        );
      })}
    </div>
  );
}

// Expandable detail for changed members
function ChangedMembersList({ changedMembers, lang }) {
  const [expanded, setExpanded] = useState(false);
  if (!changedMembers || changedMembers.length === 0) return null;
  return (
    <div className="mt-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-terracotta/70 hover:text-terracotta transition-colors font-medium"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {changedMembers.length} {t(T.membersChanged, lang)}
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-1 pl-3 border-l-2 border-terracotta/15">
          {changedMembers.map((cm, i) => (
            <div key={i} className="text-[10px] text-charcoal/70 flex items-start gap-1.5">
              <span className="font-medium text-charcoal/90 shrink-0">{cm.name}</span>
              <span className="text-smoke/40">—</span>
              <span className="font-mono text-[9px] text-smoke/70">{cm.changes}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecentActivity({ count = 15 }) {
  const lang = useLang();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return; }
    const unsub = firestore.onActivityChange(count, (data) => {
      setActivities(data);
      setLoading(false);
    });
    return () => unsub();
  }, [count]);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-sand/40" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-sand/40 rounded w-3/4" />
              <div className="h-2.5 bg-sand/30 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-8 h-8 text-smoke/25 mx-auto mb-2" />
        <p className="text-xs text-smoke italic">{t(T.noActivity, lang)}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-sand/30">
      {activities.map((act) => {
        const config = ACTIVITY_CONFIG[act.type] || { icon: Activity, color: 'text-smoke', bg: 'bg-sand/30', key: 'actLogin' };
        const Icon = config.icon;
        const isDataEntry = act.type === 'data_entry';

        return (
          <div key={act.id} className="px-4 py-3 hover:bg-cream-dark/20 transition-colors">
            {/* Top row: icon + label + user + time */}
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${config.bg} shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className={`text-[11px] font-semibold ${config.color}`}>
                  {t(T[config.key], lang)}
                </span>
                <span className="text-[10px] text-smoke/40">·</span>
                <span className="text-[10px] text-smoke/60">@{act.user}</span>
              </div>
              <span className="text-[10px] text-smoke/45 shrink-0">{timeAgo(act.timestamp, lang)}</span>
            </div>

            {/* Detail line */}
            <p className="text-xs text-charcoal/75 mt-1 ml-9 truncate">
              {isDataEntry && act.month ? `${act.month} ${act.year}` : act.detail}
            </p>

            {/* Data entry extras */}
            {isDataEntry && (
              <div className="ml-9">
                <DataEntrySummary summary={act.summary} />
                <ChangedMembersList changedMembers={act.changedMembers} lang={lang} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
