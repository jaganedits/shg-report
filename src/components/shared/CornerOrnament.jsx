export default function CornerOrnament({ position = 'top-left' }) {
  const posClass = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 rotate-90',
    'bottom-left': 'bottom-0 left-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-180',
  }[position];
  return (
    <svg className={`absolute ${posClass} w-8 h-8 text-brass opacity-20`} viewBox="0 0 32 32" fill="none" aria-hidden="true" role="presentation">
      <path d="M0 0 L12 0 L12 2 L2 2 L2 12 L0 12 Z" fill="currentColor"/>
      <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
    </svg>
  );
}
