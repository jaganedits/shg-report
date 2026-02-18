export default function FormInput({ label, type = 'text', value, onChange, placeholder, icon: Icon, className = '', disabled = false, error }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold text-smoke uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${error ? 'text-ruby/60' : 'text-smoke/50'}`} />}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
          className={`w-full bg-ivory border rounded-lg text-xs py-2 ${Icon ? 'pl-8' : 'pl-3'} pr-3 text-charcoal placeholder:text-smoke/40 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-ruby/40 focus:ring-ruby/20 focus:border-ruby/50' : 'border-sand focus:ring-brass/30 focus:border-brass/40'}`}
        />
      </div>
      {error && <p className="text-[10px] text-ruby mt-0.5">{error}</p>}
    </div>
  );
}
