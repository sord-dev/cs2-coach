// Service configuration types
export interface LeetifyConfig {
  baseUrl: string;
  rateLimitMs: number;
  timeout: number;
  retryAttempts: number;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  temperature: number;
  maxTokens: number;
}

export interface CacheConfig {
  statsTtlMs: number;
  aiResponseTtlMs: number;
  maxCacheSize: number;
}
