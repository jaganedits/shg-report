import { useLang } from '@/contexts/LangContext';

export function TH({ children, align = 'right', ...props }) {
  const lang = useLang();
  return <th className={`py-2 px-3 text-${align} text-[10px] font-semibold text-smoke uppercase tracking-wider ${lang === 'ta' ? 'font-tamil normal-case' : 'font-body'}`} {...props}>{children}</th>;
}

export function TD({ children, align = 'right', className = '', ...props }) {
  return <td className={`py-2 px-3 text-${align} text-xs ${className}`} {...props}>{children}</td>;
}
