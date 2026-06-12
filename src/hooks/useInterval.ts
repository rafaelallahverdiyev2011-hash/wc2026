import { useEffect, useRef, useState } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export function useLastUpdated() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const touch = () => setLastUpdated(new Date());
  return { lastUpdated, touch };
}

export function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
