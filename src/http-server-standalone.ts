#!/usr/bin/env node
/**
 * Standalone HTTP server entry point for testing and Node.js deployment
 */

import { CS2CoachHTTPService } from './http-server.js';

const PORT = process.env.PORT || 3000;

async function main() {
  const service = new CS2CoachHTTPService();
  
  // Simple HTTP server implementation
  const server = require('http').createServer(async (req: any, res: any) => {
    try {
      const request = new Request(`http://localhost:${PORT}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
      });

      const response = await service.handleHTTPRequest(request);
      const body = await response.text();
      
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(body);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }));
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 CS2 AI Coach HTTP Server running on http://localhost:${PORT}`);
    console.log('📊 Statistical analysis mode - fast responses (<5s)');
    console.log('');
    console.log('📋 Endpoints:');
    console.log('  GET  /health                 - Health check');
    console.log('  POST /api/coaching-advice    - Get coaching advice');
    console.log('  POST /api/analyze-area       - Area-specific analysis');
    console.log('  POST /api/track-improvement  - Track improvement trends');  
    console.log('  POST /api/compare-to-rank    - Compare to rank benchmarks');
    console.log('  POST /api/enhanced-analysis  - Enhanced statistical analysis');
    console.log('');
    console.log('💡 Example: curl -X POST http://localhost:' + PORT + '/api/coaching-advice -H "Content-Type: application/json" -d \'{"playerId":"76561198850657011"}\'');
  });
}

if (require.main === module) {
  main().catch(console.error);
}