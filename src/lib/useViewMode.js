import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

/**
 * Hook that defaults to 'card' on mobile and 'table' on desktop.
 * Stores user preference in sessionStorage per page key.
 * @param {string} pageKey - unique key per page (e.g. 'monthly', 'members')
 */
export default function useViewMode(pageKey) {
  const storageKey = `viewMode_${pageKey}`;

  const getDefault = () => {
    // Check sessionStorage first
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored === 'card' || stored === 'table') return stored;
    } catch {}
    // Default based on screen width
    return window.innerWidth < MOBILE_BREAKPOINT ? 'card' : 'table';
  };

  const [viewMode, setViewMode] = useState(getDefault);

  const updateViewMode = (mode) => {
    setViewMode(mode);
    try { sessionStorage.setItem(storageKey, mode); } catch {}
  };

  return [viewMode, updateViewMode];
}
