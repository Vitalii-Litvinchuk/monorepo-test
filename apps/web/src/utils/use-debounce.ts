import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce fast-changing state (e.g. search input)
 * Prevents rapid unnecessary HTTP requests and UI thrashing.
 */
export function useDebounce<T>(value: T, delayMs: number = 280): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
