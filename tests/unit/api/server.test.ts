/**
 * Tests for the new modular API server
 */

import { CS2CoachHTTPService } from '../../../src/api/server.js';

describe('CS2CoachHTTPService (Modular)', () => {
  let service: CS2CoachHTTPService;

  beforeEach(() => {
    service = new CS2CoachHTTPService();
  });

  describe('Health endpoint', () => {
    it('should return health status', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET',
      });

      const response = await service.handleHTTPRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.mode).toBe('statistical_analysis');
      expect(data.ai_enabled).toBe(false);
    });
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const request = new Request('http://localhost/api/coaching-advice', {
        method: 'OPTIONS',
      });

      const response = await service.handleHTTPRequest(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    });

    it('should add CORS headers to all responses', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET',
      });

      const response = await service.handleHTTPRequest(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const request = new Request('http://localhost/api/unknown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await service.handleHTTPRequest(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not Found');
      expect(data.message).toContain('Endpoint /api/unknown not found');
    });

    it('should return 405 for non-POST requests to API endpoints', async () => {
      const request = new Request('http://localhost/api/coaching-advice', {
        method: 'GET',
      });

      const response = await service.handleHTTPRequest(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method Not Allowed');
    });
  });

  describe('API endpoints structure', () => {
    it('should recognize all expected endpoints', async () => {
      const endpoints = [
        '/api/coaching-advice',
        '/api/analyze-area',
        '/api/track-improvement', 
        '/api/compare-to-rank',
        '/api/enhanced-analysis'
      ];

      for (const endpoint of endpoints) {
        const request = new Request(`http://localhost${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: 'test' }),
        });

        const response = await service.handleHTTPRequest(request);
        
        // Should not be 404 (endpoint exists), might be 500 due to invalid test data
        expect(response.status).not.toBe(404);
      }
    });
  });
});