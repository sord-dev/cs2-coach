/**
 * Embedded MCP tool definitions for edge deployment compatibility
 * Replaces filesystem-dependent commands.json loading
 */

export const COMMANDS = [
  {
    "name": "get_coaching_advice",
    "description": "Get personalized CS2 coaching advice based on recent match performance with statistical analysis",
    "inputSchema": {
      "type": "object",
      "properties": {
        "playerId": {
          "type": "string",
          "description": "Steam64 ID (e.g., 76561198850657011)"
        },
        "analysisType": {
          "type": "string",
          "enum": ["general", "aim", "positioning", "utility", "teamwork"],
          "default": "general",
          "description": "Type of analysis to perform"
        },
        "timeRange": {
          "type": "string",
          "enum": ["recent", "week", "month", "3months"],
          "default": "recent",
          "description": "Time period for match analysis"
        },
        "matchCount": {
          "type": "number",
          "minimum": 1,
          "maximum": 50,
          "default": 10,
          "description": "Number of recent matches to analyze"
        },
        "skipAI": {
          "type": "boolean",
          "default": true,
          "description": "Skip AI analysis for faster response (returns statistical analysis only)"
        },
        "enhancedAnalysis": {
          "type": "boolean",
          "default": false,
          "description": "Enable advanced statistical analysis with baselines and correlations"
        }
      },
      "required": ["playerId"]
    }
  },
  {
    "name": "analyze_specific_area",
    "description": "Deep analysis of a specific skill area with statistical correlations",
    "inputSchema": {
      "type": "object",
      "properties": {
        "playerId": {
          "type": "string",
          "description": "Steam64 ID"
        },
        "area": {
          "type": "string",
          "enum": ["aim", "positioning", "utility", "teamwork"],
          "description": "Specific area to analyze"
        },
        "timeRange": {
          "type": "string",
          "enum": ["recent", "week", "month", "3months"],
          "default": "recent",
          "description": "Time period for analysis"
        },
        "matchCount": {
          "type": "number",
          "minimum": 1,
          "maximum": 50,
          "default": 10,
          "description": "Number of recent matches to analyze"
        },
        "skipAI": {
          "type": "boolean",
          "default": true,
          "description": "Skip AI analysis for faster response"
        }
      },
      "required": ["playerId", "area"]
    }
  },
  {
    "name": "track_improvement",
    "description": "Track performance improvement trends over time",
    "inputSchema": {
      "type": "object",
      "properties": {
        "playerId": {
          "type": "string",
          "description": "Steam64 ID"
        },
        "fromDate": {
          "type": "string",
          "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
          "description": "Start date (YYYY-MM-DD)"
        },
        "toDate": {
          "type": "string",
          "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
          "description": "End date (YYYY-MM-DD)"
        },
        "metrics": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["rating", "kd", "adr", "kast", "hs_percentage"]
          },
          "default": ["rating"],
          "description": "Performance metrics to track"
        }
      },
      "required": ["playerId", "fromDate", "toDate"]
    }
  },
  {
    "name": "compare_to_rank",
    "description": "Compare player performance to rank benchmarks with statistical significance",
    "inputSchema": {
      "type": "object",
      "properties": {
        "playerId": {
          "type": "string",
          "description": "Steam64 ID"
        },
        "targetRank": {
          "type": "string",
          "enum": ["silver", "gold_nova", "mg", "dmg", "le", "lem", "supreme", "global"],
          "description": "Target rank for comparison"
        },
        "timeRange": {
          "type": "string",
          "enum": ["recent", "week", "month", "3months"],
          "default": "recent",
          "description": "Time period for comparison"
        },
        "skipAI": {
          "type": "boolean",
          "default": true,
          "description": "Skip AI analysis for faster response"
        }
      },
      "required": ["playerId", "targetRank"]
    }
  },
  {
    "name": "get_enhanced_analysis",
    "description": "Advanced statistical analysis with personal baselines, tilt detection, and predictive insights",
    "inputSchema": {
      "type": "object",
      "properties": {
        "playerId": {
          "type": "string",
          "description": "Steam64 ID"
        },
        "matchCount": {
          "type": "number",
          "minimum": 5,
          "maximum": 50,
          "default": 20,
          "description": "Number of matches for enhanced analysis"
        },
        "components": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["tilt_detection", "performance_state", "correlation_analysis", "pattern_recognition", "all"]
          },
          "default": ["all"],
          "description": "Analysis components to include"
        },
        "includeBaseline": {
          "type": "boolean",
          "default": true,
          "description": "Include personal baseline calculations"
        },
        "skipAI": {
          "type": "boolean",
          "default": true,
          "description": "Skip AI analysis for faster response"
        }
      },
      "required": ["playerId"]
    }
  }
];