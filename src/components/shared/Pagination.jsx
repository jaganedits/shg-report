import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize, className = '' }) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // Build page numbers to show
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  const btnBase = 'w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 border-t border-sand/40 ${className}`} role="navigation" aria-label="Pagination">
      <p className="text-[10px] text-smoke">
        {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} aria-label="First page"
          className={`${btnBase} text-smoke hover:bg-sand/40 hover:text-charcoal`}>
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page"
          className={`${btnBase} text-smoke hover:bg-sand/40 hover:text-charcoal`}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {startPage > 1 && <span className="text-[10px] text-smoke/40 px-0.5">…</span>}
        {pages.map(p => (
          <button key={p} onClick={() => onPageChange(p)} aria-label={`Page ${p}`}
            className={`${btnBase} ${p === currentPage
              ? 'bg-terracotta-deep text-cream shadow-sm'
              : 'text-smoke hover:bg-sand/40 hover:text-charcoal'
            }`}>{p}</button>
        ))}
        {endPage < totalPages && <span className="text-[10px] text-smoke/40 px-0.5">…</span>}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page"
          className={`${btnBase} text-smoke hover:bg-sand/40 hover:text-charcoal`}>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} aria-label="Last page"
          className={`${btnBase} text-smoke hover:bg-sand/40 hover:text-charcoal`}>
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
