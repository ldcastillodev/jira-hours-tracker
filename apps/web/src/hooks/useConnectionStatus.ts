import { useState, useEffect } from 'react';
import { onColdStartChange } from '../services/api';

type ConnectionState = 'connecting' | 'ready' | 'waking' | 'failed';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>('connecting');

  useEffect(() => {
    const unsubscribe = onColdStartChange((state) => {
      setStatus(state);
    });
    return unsubscribe;
  }, []);

  return status;
}
