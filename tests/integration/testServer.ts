// tests/integration/testServer.ts
import { createServer, Server as HTTPServer } from 'http';
import { AddressInfo } from 'net';
import { CS2CoachHTTPService } from '../../src/api/server';

export async function startRestServer() {
  const service = new CS2CoachHTTPService();
  const server = createServer(async (req, res) => {
    let bodyBuffer: Buffer[] = [];
    if (req.method === 'POST') {
      for await (const chunk of req) {
        bodyBuffer.push(chunk);
      }
    }
    const fullBody = Buffer.concat(bodyBuffer);
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers as any,
      body: req.method === 'POST' ? fullBody : undefined,
    });
    const response = await service.handleHTTPRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const respBody = await response.text();
    res.end(respBody);
  });
  await new Promise<void>(resolve => server.listen(0, () => resolve()));
  const port = (server.address() as AddressInfo).port;
  return {
    server,
    url: `http://localhost:${port}`,
    close: () => new Promise<void>(resolve => server.close(() => resolve())),
  };
}

// Placeholder for MCP server test harness (not implemented here)
export async function startMcpServer() {
  throw new Error('MCP server test harness not implemented yet');
}
