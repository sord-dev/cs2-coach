
# HTTP API Documentation

## Getting Started

This section will help you quickly get up and running with the CS2 Coach HTTP API, including making your first request and deploying your own instance.

### Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node.js)
- (For deployment) A Cloudflare account and the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Making Your First API Request

You can use `curl`, Postman, or any HTTP client. Here’s a quick example using `curl`:

```bash
curl -X POST "https://cs2-coach.cs2-stats.workers.dev/api/coaching-advice" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "76561198850657011",
    "analysisType": "general", 
    "skillLevel": "intermediate",
    "enhancedAnalysis": true
  }'
```

Or with Node.js (using `node-fetch`):

```js
const fetch = require('node-fetch');

fetch('https://cs2-coach.cs2-stats.workers.dev/api/coaching-advice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerId: '76561198850657011',
    analysisType: 'general',
    skillLevel: 'intermediate',
    enhancedAnalysis: true
  })
})
  .then(res => res.json())
  .then(console.log);
```

### Deploying Your Own API Instance

You can deploy your own version of this API using Cloudflare Workers. Here’s a quick guide:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sord-dev/cs2-coach.git
   cd cs2-coach
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in required values (Leetify API key, etc.)
4. **Test locally:**
   ```bash
   npm run dev
   # or for HTTP API:
   npm run start:http
   ```
5. **Deploy to Cloudflare Workers:**
   - Install Wrangler if you haven’t: `npm install -g wrangler`
   - Authenticate: `wrangler login`
   - Deploy:
     ```bash
     wrangler deploy
     ```

For more details, see the project [README.md](../README.md).

---

## Base URL
`https://cs2-coach.cs2-stats.workers.dev/`

## Endpoints

| Endpoint                  | Method | Description                                 |
|--------------------------|--------|---------------------------------------------|
| `/api/coaching-advice`   | POST   | Get personalized coaching advice             |
| `/api/enhanced-analysis` | POST   | Deep statistical performance analysis        |
| `/api/player-performance`| POST   | Track improvement over time                  |
| `/api/rank-analysis`     | POST   | Compare to target ranks                      |

## Example Request
```bash
curl -X POST "https://cs2-coach.cs2-stats.workers.dev/api/coaching-advice" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "76561198850657011",
    "analysisType": "general", 
    "skillLevel": "intermediate",
    "enhancedAnalysis": true
  }'
```

## Notes
- AI is disabled in the public HTTP API for consistent performance.
- See [architecture.md](architecture.md) for backend data flow and component details.
