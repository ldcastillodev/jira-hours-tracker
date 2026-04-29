import { useSearchParams } from 'react-router-dom';

export function useMonth() {
  const [searchParams] = useSearchParams();
  const now = new Date();
  const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = searchParams.get('month') || fallback;

  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const dateStr = now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return { month, label, dateStr };
}
