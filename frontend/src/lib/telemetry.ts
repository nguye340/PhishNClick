// Telemetry system for PhishNClick
// Stores events server-side with localStorage fallback for guests
import { useEffect, useState } from 'react';
import axios from './axios';

export type TelemetryEvent =
  | { type: 'game_started'; game: string; ts: number }
  | { type: 'popup_correct'; game: string; category?: string; ui_type?: string; reaction_ms?: number; difficulty?: number; voice_call_type?: string; ts: number }
  | { type: 'popup_incorrect'; game: string; category?: string; ui_type?: string; action?: string; reaction_ms?: number; difficulty?: number; voice_call_type?: string; ts: number }
  | { type: 'quiz_result'; game: string; correct: number; percentage: number; total?: number; passed?: boolean; ts: number }
  | { type: 'game_over'; game: string; score?: number; level?: number; mistakes?: number; ts: number };

const STORAGE_KEY = 'phishnclick.telemetry.v1';

function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function getAllEvents(): TelemetryEvent[] {
  if (typeof window === 'undefined') return [];
  return safeParse<TelemetryEvent[]>(localStorage.getItem(STORAGE_KEY), []);
}

export function logEvent(ev: TelemetryEvent): void {
  if (typeof window === 'undefined') return;
  
  // Try to send to backend first
  axios.post('/api/telemetry/event', ev)
    .then(() => {
      // Successfully sent to backend, trigger storage event for UI updates
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    })
    .catch((error) => {
      // Fallback to localStorage for guests or if backend fails
      console.warn('Telemetry backend unavailable, using localStorage:', error.message);
      const list = getAllEvents();
      list.push(ev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        // If storage quota exceeded, drop the oldest 10% and retry once
        const trimmed = list.slice(Math.floor(list.length * 0.1));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch {
          // Give up silently
        }
      }
    });
}

export function clearEvents() {
  if (typeof window === 'undefined') return;
  
  // Clear from backend
  axios.delete('/api/telemetry/events')
    .then(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    })
    .catch((error) => {
      console.warn('Failed to clear backend telemetry:', error.message);
    });
  
  // Always clear localStorage
  localStorage.removeItem(STORAGE_KEY);
}

export type AggregatedMetrics = {
  overall: {
    sessions: number;
    interactions: number; // correct + incorrect
    correct: number;
    incorrect: number;
    accuracy: number; // 0..1
    avgReactionMs: number | null;
  };
  byGame: Record<string, {
    interactions: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    avgReactionMs: number | null;
    byCategory: Record<string, { correct: number; incorrect: number; accuracy: number }>;
    quizzes: Array<{ percentage: number; correct: number; total?: number; ts: number }>;
    sessions: number;
  }>;
  recommendations: string[];
};

export function aggregateMetrics(events: TelemetryEvent[]): AggregatedMetrics {
  const overall = { sessions: 0, interactions: 0, correct: 0, incorrect: 0, accuracy: 0, avgReactionMs: null as number | null };
  const byGame: AggregatedMetrics['byGame'] = {};

  const reactionTimes: number[] = [];

  for (const ev of events) {
    if (ev.type === 'game_started') {
      overall.sessions += 1;
      byGame[ev.game] = byGame[ev.game] || { interactions: 0, correct: 0, incorrect: 0, accuracy: 0, avgReactionMs: null, byCategory: {}, quizzes: [], sessions: 0 };
      byGame[ev.game].sessions += 1;
    }
    if (ev.type === 'popup_correct') {
      overall.interactions += 1; overall.correct += 1;
      byGame[ev.game] = byGame[ev.game] || { interactions: 0, correct: 0, incorrect: 0, accuracy: 0, avgReactionMs: null, byCategory: {}, quizzes: [], sessions: 0 };
      const g = byGame[ev.game];
      g.interactions += 1; g.correct += 1;
      if (ev.reaction_ms != null) reactionTimes.push(ev.reaction_ms);
      if (ev.category) {
        const cat = g.byCategory[ev.category] || { correct: 0, incorrect: 0, accuracy: 0 };
        cat.correct += 1;
        g.byCategory[ev.category] = cat;
      }
    }
    if (ev.type === 'popup_incorrect') {
      overall.interactions += 1; overall.incorrect += 1;
      byGame[ev.game] = byGame[ev.game] || { interactions: 0, correct: 0, incorrect: 0, accuracy: 0, avgReactionMs: null, byCategory: {}, quizzes: [], sessions: 0 };
      const g = byGame[ev.game];
      g.interactions += 1; g.incorrect += 1;
      if (ev.reaction_ms != null) reactionTimes.push(ev.reaction_ms);
      if (ev.category) {
        const cat = g.byCategory[ev.category] || { correct: 0, incorrect: 0, accuracy: 0 };
        cat.incorrect += 1;
        g.byCategory[ev.category] = cat;
      }
    }
    if (ev.type === 'quiz_result') {
      byGame[ev.game] = byGame[ev.game] || { interactions: 0, correct: 0, incorrect: 0, accuracy: 0, avgReactionMs: null, byCategory: {}, quizzes: [], sessions: 0 };
      byGame[ev.game].quizzes.push({ percentage: ev.percentage, correct: ev.correct, total: ev.total, ts: ev.ts });
    }
  }

  overall.accuracy = overall.interactions > 0 ? overall.correct / overall.interactions : 0;
  overall.avgReactionMs = reactionTimes.length ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : null;

  for (const game of Object.keys(byGame)) {
    const g = byGame[game];
    g.accuracy = g.interactions > 0 ? g.correct / g.interactions : 0;
    // Per-category accuracy
    for (const cat of Object.keys(g.byCategory)) {
      const c = g.byCategory[cat];
      c.accuracy = (c.correct + c.incorrect) > 0 ? c.correct / (c.correct + c.incorrect) : 0;
      g.byCategory[cat] = c;
    }
  }

  // Simple recommendations based on weakest categories across games
  const recommendations: string[] = [];
  const weaknesses: Array<{ game: string; category: string; attempts: number; accuracy: number }> = [];
  for (const game of Object.keys(byGame)) {
    const g = byGame[game];
    for (const cat of Object.keys(g.byCategory)) {
      const c = g.byCategory[cat];
      const attempts = c.correct + c.incorrect;
      if (attempts >= 3 && c.accuracy < 0.6) {
        weaknesses.push({ game, category: cat, attempts, accuracy: c.accuracy });
      }
    }
  }
  weaknesses.sort((a, b) => (a.accuracy - b.accuracy) || (b.attempts - a.attempts));
  for (const w of weaknesses.slice(0, 5)) {
    recommendations.push(`Practice ${w.category} in ${w.game} (accuracy ${(w.accuracy * 100).toFixed(0)}%, ${w.attempts} attempts). Focus on indicators and close malicious popups quickly.`);
  }

  return { overall, byGame, recommendations };
}
export function useTelemetryMetrics(): AggregatedMetrics {
  const emptyMetrics = { overall: { sessions: 0, interactions: 0, correct: 0, incorrect: 0, accuracy: 0, avgReactionMs: null }, byGame: {}, recommendations: [] };
  
  if (typeof window === 'undefined') {
    return emptyMetrics;
  }
  
  const [metrics, setMetrics] = useState<AggregatedMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get('/api/telemetry/metrics');
      setMetrics(response.data);
      setLoading(false);
    } catch (error) {
      // Fallback to localStorage for guests
      console.warn('Using localStorage telemetry fallback');
      setMetrics(aggregateMetrics(getAllEvents()));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    const handler = () => fetchMetrics();
    window.addEventListener('storage', handler);
    const id = setInterval(handler, 5000);
    return () => { window.removeEventListener('storage', handler); clearInterval(id); };
  }, []);
  
  return metrics;
}
