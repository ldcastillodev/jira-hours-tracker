import { useConnectionStatus } from '../../../hooks/useConnectionStatus';
import { Spinner } from '../../atoms/Spinner/Spinner';

export function ColdStartBanner() {
  const status = useConnectionStatus();

  if (status === 'ready' || status === 'connecting') return null;

  if (status === 'waking') {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-mgs-amber/30 bg-mgs-amber/10 px-4 py-2.5 backdrop-blur-sm">
        <Spinner className="h-4 w-4 animate-spin text-mgs-amber" />
        <span className="text-xs font-medium text-mgs-amber">
          Waking up the server — this can take up to 30 seconds on first load...
        </span>
      </div>
    );
  }

  // status === 'failed'
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-mgs-red/30 bg-mgs-red/10 px-4 py-2.5 backdrop-blur-sm">
      <span className="text-xs font-medium text-mgs-red-light">
        Unable to connect to the server. Check your connection or try again later.
      </span>
    </div>
  );
}
