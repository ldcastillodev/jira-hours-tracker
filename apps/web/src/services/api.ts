const API_BASE = import.meta.env.VITE_API_URL || '/api';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

type ColdStartListener = (state: 'waking' | 'ready' | 'failed') => void;

let coldStartListeners: ColdStartListener[] = [];
let apiReady = false;

export function onColdStartChange(listener: ColdStartListener) {
  coldStartListeners.push(listener);
  return () => {
    coldStartListeners = coldStartListeners.filter((l) => l !== listener);
  };
}

function notifyColdStart(state: 'waking' | 'ready' | 'failed') {
  if (state === 'ready') apiReady = true;
  coldStartListeners.forEach((l) => l(state));
}

export async function fetchApi<T>(path: string): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      if (!apiReady) notifyColdStart('ready');
      return await res.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      const isNetworkError =
        lastError.name === 'TypeError' ||
        lastError.name === 'AbortError' ||
        lastError.message.includes('Failed to fetch') ||
        lastError.message.includes('NetworkError') ||
        lastError.message.includes('timeout');

      if (!isNetworkError || attempt === MAX_RETRIES) {
        notifyColdStart('failed');
        throw lastError;
      }

      // Signal that we're likely in a cold start
      if (!apiReady) notifyColdStart('waking');

      // Exponential backoff: 2s, 4s, 8s
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError!;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
