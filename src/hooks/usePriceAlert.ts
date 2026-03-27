import { useState, useEffect, useRef } from 'react';
import { getPriceHistory, PriceHistoryStats } from '../services/api';

const THRESHOLD = 1.3; // 30% above average
const MIN_DATA_POINTS = 3;

interface PriceAlert {
  show: boolean;
  message: string;
  percentAbove: number;
}

export function usePriceAlert(item: string, amount: string): PriceAlert {
  const [stats, setStats] = useState<PriceHistoryStats | null>(null);
  const cache = useRef<Record<string, PriceHistoryStats | null>>({});

  useEffect(() => {
    if (!item) { setStats(null); return; }
    const key = item.toLowerCase();
    if (key in cache.current) { setStats(cache.current[key]); return; }

    getPriceHistory(item)
      .then((res) => {
        cache.current[key] = res.stats;
        setStats(res.stats);
      })
      .catch(() => { cache.current[key] = null; setStats(null); });
  }, [item]);

  if (!stats || stats.count < MIN_DATA_POINTS) {
    return { show: false, message: '', percentAbove: 0 };
  }

  const parsedAmount = parseFloat(amount);
  if (!parsedAmount || parsedAmount <= 0) {
    return { show: false, message: '', percentAbove: 0 };
  }

  const threshold = stats.avg * THRESHOLD;
  if (parsedAmount <= threshold) {
    return { show: false, message: '', percentAbove: 0 };
  }

  const percentAbove = Math.round(((parsedAmount - stats.avg) / stats.avg) * 100);
  const message = `${percentAbove}% above your usual HK$${Math.round(stats.avg)} for ${item}`;

  return { show: true, message, percentAbove };
}
