import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '../services/api';

// ── Data-refresh event bus ───────────────────────────────────────────────────

const DATA_REFRESH_EVENT = 'mgs:data-refresh';

/** Dispatch a data-refresh signal after any mutation that changes report data. */
export function emitDataRefresh() {
  window.dispatchEvent(new CustomEvent(DATA_REFRESH_EVENT));
}

/**
 * Register a callback to run whenever emitDataRefresh() is called.
 * Uses a ref so the listener is never re-registered on re-renders.
 */
export function useDataRefresh(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    function handler() {
      callbackRef.current();
    }
    window.addEventListener(DATA_REFRESH_EVENT, handler);
    return () => window.removeEventListener(DATA_REFRESH_EVENT, handler);
  }, []);
}

// ── useApi ───────────────────────────────────────────────────────────────────

export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchApi<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  useEffect(() => {
    return load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
