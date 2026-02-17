import { useEffect, useRef, useCallback } from 'react';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function useSessionTimeout(onTimeout) {
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onTimeout) onTimeout();
    }, TIMEOUT_MS);
  }, [onTimeout]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
}
