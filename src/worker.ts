/**
 * Cloudflare Workers entry point for CS2 AI Coach
 * Optimized for edge deployment with statistical analysis
 */

import { CS2CoachHTTPService } from './http-server.js';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Set environment variables for Workers (using globalThis for compatibility)
    if (typeof globalThis !== 'undefined') {
      globalThis.process = globalThis.process || { env: {} };
      
      if (env.LEETIFY_API_BASE_URL) {
        globalThis.process.env.LEETIFY_API_BASE_URL = env.LEETIFY_API_BASE_URL;
      }
      if (env.LEETIFY_API_RATE_LIMIT_MS) {
        globalThis.process.env.LEETIFY_API_RATE_LIMIT_MS = env.LEETIFY_API_RATE_LIMIT_MS;
      }
      
      // Disable AI for Workers environment
      globalThis.process.env.DISABLE_AI = 'true';
    }

    const service = new CS2CoachHTTPService();
    return service.handleHTTPRequest(request);
  },
};