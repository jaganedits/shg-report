import { Sparkles, Calendar, Users, CreditCard, ClipboardList, BarChart2, Settings } from 'lucide-react';

export const PAGE_SIZE = 10;

export const PALETTE = [
  '#A0522D', '#C69749', '#2E7D5B', '#9B2335', '#6B3410',
  '#D4845A', '#8B6914', '#2D5E42', '#4A4543', '#C4956C',
  '#E8C97A', '#1A3A2A', '#8A8380', '#D4C5B2',
];

export const NAV_ITEMS = [
  { id: 'overview', path: '/overview', key: 'tabOverview', icon: Sparkles },
  { id: 'monthly', path: '/monthly', key: 'tabMonthly', icon: Calendar },
  { id: 'members', path: '/members', key: 'tabMembers', icon: Users },
  { id: 'loans', path: '/loans', key: 'tabLoans', icon: CreditCard },
  { id: 'entry', path: '/entry', key: 'tabEntry', icon: ClipboardList },
  { id: 'reports', path: '/reports', key: 'tabReports', icon: BarChart2 },
  { id: 'settings', path: '/settings', key: 'tabSettings', icon: Settings },
];
