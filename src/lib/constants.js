import { Sparkles, Calendar, Users, CreditCard, ClipboardList, BarChart2, Settings, Info } from 'lucide-react';

export const PAGE_SIZE = 10;

export const PALETTE = [
  '#A0522D', '#C69749', '#2E7D5B', '#9B2335', '#D4845A',
  '#E8C97A', '#5B9E8F', '#D47B6A', '#8B6914', '#7BA383',
  '#C4956C', '#CC7B8A', '#6AADBA', '#B89E5A',
];

export const NAV_ITEMS = [
  { id: 'overview', path: '/overview', key: 'tabOverview', icon: Sparkles },
  { id: 'monthly', path: '/monthly', key: 'tabMonthly', icon: Calendar },
  { id: 'members', path: '/members', key: 'tabMembers', icon: Users },
  { id: 'loans', path: '/loans', key: 'tabLoans', icon: CreditCard },
  { id: 'entry', path: '/entry', key: 'tabEntry', icon: ClipboardList },
  { id: 'reports', path: '/reports', key: 'tabReports', icon: BarChart2 },
  { id: 'settings', path: '/settings', key: 'tabSettings', icon: Settings },
  { id: 'about', path: '/about', key: 'tabAbout', icon: Info },
];
