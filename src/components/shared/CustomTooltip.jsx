import { formatCurrency } from '@/lib/utils';

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-charcoal text-cream px-4 py-3 rounded-xl shadow-xl text-xs border border-charcoal-light">
      <p className="font-display font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex justify-between gap-4">
          <span className="opacity-60">{p.name}</span>
          <span className="font-mono font-medium">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}
