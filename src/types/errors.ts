/**
 * Runtime error classes for Leetify, Ollama, and validation errors.
 * These must match the global types in types.d.ts.
 */

export class LeetifyAPIError extends Error {
  statusCode?: number;
  rateLimited?: boolean;
  constructor(message: string, statusCode?: number, rateLimited?: boolean) {
    super(message);
    this.name = "LeetifyAPIError";
    this.statusCode = statusCode;
    this.rateLimited = rateLimited;
  }
}

export class OllamaError extends Error {
  modelName?: string;
  responseTime?: number;
  constructor(message: string, modelName?: string, responseTime?: number) {
    super(message);
    this.name = "OllamaError";
    this.modelName = modelName;
    this.responseTime = responseTime;
  }
}

export class ValidationError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}