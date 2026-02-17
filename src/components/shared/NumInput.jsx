export default function NumInput({ value, onChange }) {
  return <input type="number" value={value || ''} onChange={e => onChange(e.target.value)}
    className="w-full bg-ivory border border-brass/20 rounded px-1.5 py-1 text-xs font-mono text-right focus:outline-none focus:ring-1 focus:ring-brass/40 focus:border-brass/40 transition-all min-w-[70px]" min="0" />;
}
