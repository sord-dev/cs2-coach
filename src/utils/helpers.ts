


// Embedded CS2 rank benchmarks to avoid file system dependencies
const CS2_RANK_BENCHMARKS = {
  "0-4999": {
    "tier": "gray",
    "rating": { "solid": 0.7, "strong": 0.8, "excellent": 0.9 },
    "kd": { "average": 0.6, "good": 0.8, "exceptional": 1.0 },
    "adr": { "solid": 45, "strong": 55, "excellent": 65 },
    "kast": { "good": 55, "strong": 60, "excellent": 65 },
    "hs_percentage": { "average": 20, "good": 25, "exceptional": 30 }
  },
  "5000-9999": {
    "tier": "light_blue",
    "rating": { "solid": 0.8, "strong": 0.9, "excellent": 1.0 },
    "kd": { "average": 0.7, "good": 0.9, "exceptional": 1.1 },
    "adr": { "solid": 55, "strong": 65, "excellent": 75 },
    "kast": { "good": 60, "strong": 65, "excellent": 70 },
    "hs_percentage": { "average": 25, "good": 30, "exceptional": 35 }
  },
  "10000-14999": {
    "tier": "blue",
    "rating": { "solid": 0.9, "strong": 1.0, "excellent": 1.1 },
    "kd": { "average": 0.8, "good": 1.0, "exceptional": 1.2 },
    "adr": { "solid": 65, "strong": 75, "excellent": 85 },
    "kast": { "good": 65, "strong": 70, "excellent": 75 },
    "hs_percentage": { "average": 30, "good": 35, "exceptional": 40 }
  },
  "15000-19999": {
    "tier": "purple",
    "rating": { "solid": 1.0, "strong": 1.1, "excellent": 1.2 },
    "kd": { "average": 0.9, "good": 1.1, "exceptional": 1.3 },
    "adr": { "solid": 75, "strong": 85, "excellent": 95 },
    "kast": { "good": 70, "strong": 75, "excellent": 80 },
    "hs_percentage": { "average": 35, "good": 40, "exceptional": 45 }
  },
  "20000-24999": {
    "tier": "pink",
    "rating": { "solid": 1.1, "strong": 1.2, "excellent": 1.3 },
    "kd": { "average": 1.0, "good": 1.2, "exceptional": 1.4 },
    "adr": { "solid": 85, "strong": 95, "excellent": 105 },
    "kast": { "good": 75, "strong": 80, "excellent": 85 },
    "hs_percentage": { "average": 40, "good": 45, "exceptional": 50 }
  },
  "25000-29999": {
    "tier": "red",
    "rating": { "solid": 1.2, "strong": 1.3, "excellent": 1.4 },
    "kd": { "average": 1.1, "good": 1.3, "exceptional": 1.5 },
    "adr": { "solid": 95, "strong": 105, "excellent": 115 },
    "kast": { "good": 80, "strong": 85, "excellent": 90 },
    "hs_percentage": { "average": 45, "good": 50, "exceptional": 55 }
  },
  "30000-99999": {
    "tier": "gold",
    "rating": { "solid": 1.3, "strong": 1.4, "excellent": 1.5 },
    "kd": { "average": 1.2, "good": 1.4, "exceptional": 1.6 },
    "adr": { "solid": 105, "strong": 115, "excellent": 125 },
    "kast": { "good": 85, "strong": 90, "excellent": 95 },
    "hs_percentage": { "average": 50, "good": 55, "exceptional": 60 }
  }
} as const;

/**
 * Returns CS2 performance benchmarks for a given rank using embedded benchmark data.
 * @param rank One of: silver, gold_nova, mg, dmg, le, lem, supreme, global
 * @returns { rating, kdRatio, adr, kast, headshotPercentage }
 */
export function getCS2RankBenchmarks(rank: string): {
  rating: number;
  kdRatio: number;
  adr: number;
  kast: number;
  headshotPercentage: number;
} {
  // Map rank to benchmark range
  const rankMap: Record<string, keyof typeof CS2_RANK_BENCHMARKS> = {
    silver: '0-4999',
    gold_nova: '5000-9999',
    mg: '10000-14999',
    dmg: '15000-19999',
    le: '20000-24999',
    lem: '25000-29999',
    supreme: '30000-99999',
    global: '30000-99999',
  };
  
  const range = rankMap[rank] || '10000-14999';
  const perf = CS2_RANK_BENCHMARKS[range];
  
  if (!perf) throw new Error('No benchmark data for rank: ' + rank);
  
  return {
    rating: perf.rating.solid,
    kdRatio: perf.kd.average,
    adr: perf.adr.solid,
    kast: perf.kast.good,
    headshotPercentage: perf.hs_percentage.average,
  };
}

/**
 * Utility helpers for sleep, cache, and math operations.
 */

// Sleep for a specified duration (ms)
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Rounds a number to a given number of decimals
export function roundTo(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}


import type { CacheEntry } from '../types/index.js';

export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  constructor(private maxSize = 1000) { }

  get(key: string, ttlMs: number): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data;
    }
    return null;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < Math.min(200, entries.length); i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Utility helper to determine cs rank from a number ranging from 0-18
 */

export function determineCSRank(score: number): string {
  if (score < 0 || score > 20) throw new Error('Invalid CS rank score');
  const ranks = [
    'Unranked',
    'Silver I',
    'Silver II',
    'Silver III',
    'Silver IV',
    'Silver Elite',
    'Silver Elite Master',
    'Gold I',
    'Gold II',
    'Gold III',
    'Gold IV',
    'Master Guardian I',
    'Master Guardian II',
    'Master Guardian III',
    'Master Guardian Elite',
    'Distinguished Master Guardian',
    'Legendary Eagle',
    'Legendary Eagle Master',
    'Supreme Master First Class',
    'The Global Elite'
  ];
  return ranks[score] || 'Unknown';
}

/**
 * Safe JSON stringification that handles Date objects, circular references, and undefined values.
 * @param obj Object to serialize
 * @param space Optional spacing for pretty printing
 * @returns JSON string
 */
export function safeJsonStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    // Handle Date objects by converting to ISO strings
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    
    // Handle undefined values
    if (value === undefined) {
      return null;
    }
    
    return value;
  }, space);
}