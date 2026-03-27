import { useMemo } from 'react';
import { Transaction } from '../types';

interface SmartSuggestions {
  /** Participants ranked by relevance to current context */
  rankedParticipants: string[];
  /** Item labels sorted by time-of-day relevance */
  timeRelevantItems: string[];
  /** Category for a given description (auto-applied, not just suggested) */
  categoryForDescription: (desc: string) => string | undefined;
  /** Participants most associated with a given item */
  participantsForItem: (item: string) => string[];
}

function getHourBucket(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

const MEAL_ITEMS: Record<string, string[]> = {
  morning: ['Breakfast', 'Coffee'],
  afternoon: ['Lunch', 'Coffee'],
  evening: ['Dinner', 'Drinks'],
  night: ['Supper', 'Drinks'],
};

export function useSmartSuggestions(transactions: Transaction[]): SmartSuggestions {
  const bucket = getHourBucket();

  const rankedParticipants = useMemo(() => {
    const scores: Record<string, number> = {};
    const now = Date.now();

    transactions.forEach((t) => {
      if (!t.participants?.length) return;
      const age = (now - new Date(t.date || t.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      // Recency: recent transactions score higher (decay over 30 days)
      const recencyScore = Math.max(0, 1 - age / 90);
      // Time-of-day: transactions at similar hour score higher
      const txHour = new Date(t.date || t.createdAt).getHours();
      const currentHour = new Date().getHours();
      const hourDiff = Math.abs(txHour - currentHour);
      const timeScore = hourDiff <= 3 ? 0.3 : 0;

      t.participants.forEach((p) => {
        scores[p] = (scores[p] || 0) + 1 + recencyScore + timeScore;
      });
    });

    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [transactions]);

  const timeRelevantItems = useMemo(() => {
    const preferred = MEAL_ITEMS[bucket] || [];
    // Count how often each item appears at this time of day
    const itemScores: Record<string, number> = {};
    transactions.forEach((t) => {
      if (!t.item) return;
      const txHour = new Date(t.date || t.createdAt).getHours();
      const txBucket = txHour >= 5 && txHour < 12 ? 'morning'
        : txHour >= 12 && txHour < 17 ? 'afternoon'
        : txHour >= 17 && txHour < 22 ? 'evening' : 'night';
      if (txBucket === bucket) {
        itemScores[t.item] = (itemScores[t.item] || 0) + 1;
      }
    });
    // Return preferred items first, then history-based items
    const historyItems = Object.entries(itemScores)
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item)
      .filter((item) => !preferred.includes(item));
    return [...preferred, ...historyItems];
  }, [transactions, bucket]);

  const categoryForDescription = useMemo(() => {
    // Build map: lowercase description → category (most recent wins)
    const map: Record<string, string> = {};
    [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .forEach((t) => {
        const key = (t.description?.trim() || '').toLowerCase();
        if (key && t.category && !map[key]) map[key] = t.category;
      });
    return (desc: string): string | undefined => {
      const key = desc.trim().toLowerCase();
      return map[key];
    };
  }, [transactions]);

  const participantsForItem = useMemo(() => {
    // Build map: item → participant scores
    const itemParticipants: Record<string, Record<string, number>> = {};
    const now = Date.now();
    transactions.forEach((t) => {
      if (!t.item || !t.participants?.length) return;
      const itemKey = t.item;
      const age = (now - new Date(t.date || t.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - age / 90);
      if (!itemParticipants[itemKey]) itemParticipants[itemKey] = {};
      t.participants.forEach((p) => {
        itemParticipants[itemKey][p] = (itemParticipants[itemKey][p] || 0) + 1 + recencyScore;
      });
    });
    return (item: string): string[] => {
      const scores = itemParticipants[item];
      if (!scores) return [];
      return Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
    };
  }, [transactions]);

  return { rankedParticipants, timeRelevantItems, categoryForDescription, participantsForItem };
}
