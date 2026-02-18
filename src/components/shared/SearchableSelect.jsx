import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, Users } from 'lucide-react';

export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Search...', allLabel = 'All Members', className = '' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Position dropdown below trigger
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Close on click outside or Escape key
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (dropdownRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Update position on open & scroll/resize
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = value === 'all'
    ? allLabel
    : options.find(o => o.value === value)?.label || '';

  const handleSelect = (val) => {
    onChange(val);
    setSearch('');
    setOpen(false);
  };

  const handleToggle = () => {
    if (!open) updatePosition();
    setOpen(!open);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center gap-2 bg-ivory border rounded-xl px-3 py-2 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass/50 ${
          open ? 'border-brass/50 ring-2 ring-brass/30' : 'border-sand hover:border-brass/40'
        }`}
      >
        <Users className="w-3.5 h-3.5 text-smoke shrink-0" />
        <span className="flex-1 text-xs font-medium text-charcoal truncate">
          {selectedLabel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-smoke transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown — rendered via Portal to escape overflow:hidden */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-ivory border border-sand/80 rounded-xl shadow-xl shadow-charcoal/10 overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-sand/60 bg-cream-dark/20">
            <Search className="w-3.5 h-3.5 text-smoke shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-xs text-charcoal placeholder:text-smoke/50 focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="text-smoke hover:text-charcoal p-1">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {/* "All" option — always visible */}
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                value === 'all'
                  ? 'bg-terracotta/8 text-terracotta-deep font-semibold'
                  : 'text-charcoal hover:bg-cream-dark/40'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              {allLabel}
            </button>

            <div className="border-t border-sand/40" />

            {/* Filtered member options */}
            {filtered.length === 0 ? (
              <div className="px-3 py-5 text-center">
                <Search className="w-4 h-4 text-smoke/30 mx-auto mb-1" />
                <p className="text-[11px] text-smoke italic">No members found</p>
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                    value === opt.value
                      ? 'bg-terracotta/8 text-terracotta-deep font-semibold'
                      : 'text-charcoal hover:bg-cream-dark/40'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-sand/60 flex items-center justify-center text-[9px] font-mono text-smoke shrink-0">
                    {opt.id || '#'}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
