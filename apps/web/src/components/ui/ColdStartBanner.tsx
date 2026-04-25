import { useConnectionStatus } from '../../hooks/useConnectionStatus';

export function ColdStartBanner() {
  const status = useConnectionStatus();

  if (status === 'ready' || status === 'connecting') return null;

  if (status === 'waking') {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-mgs-amber/30 bg-mgs-amber/10 px-4 py-2.5 backdrop-blur-sm">
        <Spinner />
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

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-mgs-amber"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
