// Polyfill LeetifyAPIError for test environment if not present
if (typeof (globalThis as any).LeetifyAPIError === 'undefined') {
  (globalThis as any).LeetifyAPIError = class LeetifyAPIError extends Error {
    statusCode?: number;
    rateLimited?: boolean;
    constructor(message: string, statusCode?: number, rateLimited?: boolean) {
      super(message);
      this.name = 'LeetifyAPIError';
      this.statusCode = statusCode;
      this.rateLimited = rateLimited;
    }
  };
}
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to reduce noise in test output
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global test timeout
jest.setTimeout(30000);