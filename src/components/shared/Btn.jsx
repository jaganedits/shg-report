export default function Btn({ children, onClick, variant = 'primary', size = 'sm', icon: Icon, disabled = false, className = '' }) {
  const variants = {
    primary: 'bg-terracotta-deep text-cream hover:bg-terracotta shadow-md shadow-terracotta/15',
    secondary: 'bg-sand/60 text-charcoal hover:bg-sand',
    outline: 'bg-ivory text-charcoal border border-sand hover:bg-sand/50 shadow-sm',
    danger: 'bg-ruby/10 text-ruby hover:bg-ruby/20 border border-ruby/20',
    success: 'bg-forest/10 text-forest hover:bg-forest/20 border border-forest/20',
    ghost: 'text-smoke hover:text-charcoal hover:bg-sand/40',
  };
  const sizes = { xs: 'px-2 py-1 text-[10px]', sm: 'px-3 py-1.5 text-[11px]', md: 'px-4 py-2 text-xs' };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-300 ${variants[variant]} ${sizes[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
