
# MCP API Documentation

## Overview
The MCP (Model Context Protocol) server exposes tools for integration with Claude Desktop and other MCP clients.

---

## Using with Claude Desktop


### Prerequisites
- **Node.js** (v18+ recommended)
- **NPM dependencies installed** (`npm install` in project root)
- **Project built** (`npm run build` to generate `dist/server.js`)
- **Leetify API key** and (optionally) a running Ollama instance for AI features


### 1. Build the Project
In your project directory, run:

```sh
npm install
npm run build
```

This will generate the production server at `dist/server.js`.

### 2. Configure Claude Desktop (settings.json)

1. Open your Claude Desktop `settings.json` file (location may vary by OS; see Claude Desktop docs).
2. Add an entry for your MCP server, for example:

```json
{
	"cs2-coach": {
		"command": "node",
		"args": [
			"C:\\Users\\stefa\\Desktop\\cs2-projects\\mcp-coach\\dist\\server.js"
		],
		"env": {
			"OLLAMA_BASE_URL": "http://localhost:11434",
			"OLLAMA_MODEL": "cs2-coach"
		}
	}
}
```

Adjust the path as needed for your system. You can add your Leetify API key and other environment variables to the `env` section if required.

3. Save the file and restart Claude Desktop (CRTL + R). The CS2 Coach MCP server should appear as an available tool.


### 3. Environment Variables
Set up your `.env` file (see `.env.example`) with your Leetify API key and Ollama config if using AI features. You can also specify environment variables directly in the Claude Desktop `settings.json` entry as shown above.


### 4. Troubleshooting
- If tools do not appear, check the MCP server logs for errors (run the command manually to debug).
- Ensure your Leetify API key is valid and not rate-limited.
- For AI features, ensure Ollama is running and the model is available (see `modelfiles/`).
- Use `npm run test:mcp-compliance` to verify MCP protocol compatibility.

---


## Core MCP Tools

### 1. `get_coaching_advice`
Get personalized CS2 coaching advice based on recent match performance with enhanced analytics.

**Parameters:**
- `playerId` (string, required): Steam ID or Leetify player identifier
- `analysisType` (string, optional): Type of analysis ('general', 'aim', 'positioning', 'utility', 'teamwork')
- `timeRange` (string, optional): Time period ('recent', 'week', 'month', '3months')
- `matchCount` (number, optional): Number of recent matches to analyze (1-50)
- `skipAI` (boolean, optional): Skip AI analysis for faster response (default: true)
- `enhancedAnalysis` (boolean, optional): Enable enhanced statistical analysis (default: true when sufficient data)

### 2. `analyze_specific_area`
Deep dive analysis into a specific skill area with statistical correlation analysis.

**Parameters:**
- `playerId` (string, required): Steam ID or Leetify player identifier
- `area` (string, required): Specific area ('aim', 'positioning', 'utility', 'teamwork')
- `timeRange` (string, optional): Time period for analysis
- `matchCount` (number, optional): Number of recent matches to analyze
- `skipAI` (boolean, optional): Skip AI analysis for faster response (default: true)
- `enhancedAnalysis` (boolean, optional): Enable enhanced correlation and pattern analysis

### 3. `track_improvement`
Track performance improvement over a specified time period with statistical significance testing.

**Parameters:**
- `playerId` (string, required): Steam ID or Leetify player identifier
- `fromDate` (string, required): Start date (YYYY-MM-DD format)
- `toDate` (string, required): End date (YYYY-MM-DD format)
- `metrics` (array, optional): Metrics to track (['rating', 'kd', 'adr', 'kast', 'hs_percentage'])
- `enhancedAnalysis` (boolean, optional): Enable statistical trend analysis and baseline comparison

### 4. `compare_to_rank`
Compare player performance to others in a target rank with adaptive benchmarking.

**Parameters:**
- `playerId` (string, required): Steam ID or Leetify player identifier
- `targetRank` (string, required): Target rank ('silver', 'gold_nova', 'mg', 'dmg', 'le', 'lem', 'supreme', 'global')
- `timeRange` (string, optional): Time period for comparison
- `enhancedAnalysis` (boolean, optional): Enable adaptive benchmarking and statistical gap analysis

## Example Usage
See [README.md](../README.md) for example conversations and usage flows.
