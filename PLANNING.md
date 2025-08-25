# CS2 AI Coach - Project Architecture & Status

## 🎯 Project Overview

CS2 AI Coach is a sophisticated Counter-Strike 2 statistical analysis engine available in two deployment modes:

1. **Live HTTP API**: Production-ready statistical analysis deployed on Cloudflare Workers
2. **Local MCP Server**: For Claude Desktop integration with optional AI enhancement

**Current Status**: ✅ **Production Ready** - Successfully deployed and operational.

## 🌐 Deployment Architecture

### Production HTTP API (Primary)
- **URL**: https://cs2-coach.cs2-stats.workers.dev/
- **Platform**: Cloudflare Workers (Edge deployment)
- **Features**: Fast statistical analysis, automatic scaling, zero-downtime updates
- **Response Time**: <5 seconds for comprehensive analysis
- **AI**: Disabled for consistent performance (statistical insights only)

### Local MCP Server (Development/Power Users)
- **Platform**: Local Node.js server
- **Features**: Full statistical engine + optional AI commentary via Ollama
- **Integration**: Claude Desktop via MCP protocol
- **AI**: Optional Ollama integration for enhanced coaching commentary

## 📊 Core Capabilities

### Statistical Analysis Engine
- **Personal Baselines**: Rolling averages with confidence intervals
- **Tilt Detection**: Research-validated thresholds (>650ms reaction time, >15% preaim degradation)
- **Performance States**: Flow state, mechanical inconsistency, tilt cascade, baseline normal
- **Correlation Analysis**: Pearson/Spearman with statistical significance testing
- **Pattern Recognition**: Momentum analysis, cascade detection, contextual clustering

### API Endpoints (Production)
```
POST /api/coaching-advice     - Get personalized coaching advice
POST /api/enhanced-analysis   - Deep statistical performance analysis  
POST /api/player-performance  - Track improvement over time
POST /api/rank-analysis      - Compare to target ranks
```

### MCP Tools (Local)
```
get_coaching_advice          - Enhanced with personal baselines and state detection
analyze_specific_area        - Deep dive with correlation analysis
track_improvement           - Progress monitoring with statistical significance
compare_to_rank            - Adaptive benchmarks with tier-aware thresholds
```

## 🏗️ Technical Architecture

### Clean Project Structure (Post-Cleanup)
```
cs2-coach-mcp-server/
├── README.md                    # Main documentation
├── CLAUDE.md                    # Project instructions
├── PLANNING.md                  # This file - architecture overview
├── TASK.md                      # Development task tracking
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── wrangler.toml              # Cloudflare Workers config
├── vercel.json                # Vercel deployment config (alternate)
├── railway.json               # Railway deployment config (alternate)
│
├── modelfiles/                 # Ollama model definitions (local AI)
│   ├── cs2-coach-basic.modelfile
│   └── cs2-coach-enhanced.modelfile
│
├── scripts/                   # Utility scripts
│   ├── test-mcp-compliance.js
│   ├── test-ollama-health.js
│   └── verify-deployment-ready.js
│
├── src/                       # Source code
│   ├── server.ts             # MCP server entry point
│   ├── worker.ts             # Cloudflare Workers entry point
│   ├── http-server.ts        # HTTP API server
│   ├── http-server-standalone.ts
│   │
│   ├── commands/             # MCP tool definitions (embedded)
│   │   └── index.ts
│   │
│   ├── handlers/             # Request handlers (shared by MCP/HTTP)
│   │   ├── coachingHandler.ts
│   │   ├── enhancedAnalysisHandler.ts
│   │   ├── areaAnalysisHandler.ts
│   │   ├── improvementHandler.ts
│   │   └── rankComparisonHandler.ts
│   │
│   ├── services/             # Business logic
│   │   ├── leetify/          # Leetify API integration
│   │   │   ├── index.ts
│   │   │   └── stats.ts
│   │   │
│   │   ├── ollama/           # AI service (optional)
│   │   │   ├── index.ts      # Ollama implementation
│   │   │   ├── noop.ts       # No-op implementation
│   │   │   ├── interface.ts  # Service abstraction
│   │   │   ├── prompts.ts
│   │   │   └── error.ts
│   │   │
│   │   ├── data-transformer/ # Statistical engine
│   │   │   └── index.ts
│   │   │
│   │   ├── analysis/         # Statistical analysis components
│   │   │   ├── metrics.ts
│   │   │   ├── area.ts
│   │   │   ├── correlation-analyzer.ts
│   │   │   ├── pattern-detector.ts
│   │   │   ├── state-classifier.ts
│   │   │   └── adaptive-thresholds.ts
│   │   │
│   │   ├── baseline/         # Personal baseline system
│   │   │   ├── baseline-calculator.ts
│   │   │   └── baseline-storage.ts
│   │   │
│   │   ├── detection/        # Tilt detection
│   │   │   └── tilt-detector.ts
│   │   │
│   │   └── common/          # Shared constants
│   │       └── constants.ts
│   │
│   ├── types/               # TypeScript definitions
│   │   ├── index.ts
│   │   ├── coaching.ts
│   │   ├── leetify.ts
│   │   ├── analysis.ts
│   │   ├── tilt.ts
│   │   ├── config.ts
│   │   ├── errors.ts
│   │   └── utility.ts
│   │
│   ├── utils/               # Utility functions
│   │   └── helpers.ts
│   │
│   ├── data/                # Static data (embedded for deployment)
│   │   └── rank-distribution.ts
│   │
│   └── cs2-rank-distribution.json  # Rank distribution data
│
├── tests/                   # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── quality-assurance/  # QA tests
│
├── jest.config.cjs         # Jest configuration
├── jest.integration.config.cjs
└── dist/                   # Build output (generated)
```

## 🔄 Data Flow Architecture

### Production HTTP API Flow
```
HTTP Request → Worker → Handler → Service Layer → Leetify API → Statistical Analysis → JSON Response
```

### Local MCP Flow  
```
Claude Desktop → MCP Protocol → Handler → Service Layer → Statistical Analysis + Optional AI → MCP Response
```

### Service Layer Architecture
```
Interface Abstraction (IAICoachService)
├── OllamaCoachService (Local AI commentary)
└── NoOpAIService (Statistical-only analysis)

Shared Components:
├── LeetifyClient (API integration with rate limiting)
├── DataTransformer (Statistical analysis engine)
├── BaselineCalculator (Personal performance tracking)
├── TiltDetector (Performance state analysis)
├── CorrelationAnalyzer (Pattern identification)
└── StateClassifier (Performance categorization)
```

## ⚡ Performance Characteristics

### Response Times
- **HTTP API**: <5 seconds (statistical analysis only)
- **MCP + Statistics**: <5 seconds (same statistical engine)
- **MCP + AI**: <15 seconds (with Ollama commentary)

### Resource Usage
- **Cloudflare Workers**: 287KB compressed, starts in ~2ms
- **Local MCP**: <500MB RAM for statistical analysis
- **Local MCP + AI**: <2GB RAM (includes Ollama model)

### Caching Strategy
- **Personal baselines**: 24-hour TTL with incremental updates
- **Statistical computations**: 1-hour cache for complex analysis
- **API responses**: Edge caching on Cloudflare

## 🧠 AI Integration Strategy

### Deployment-Aware AI
- **Production (Workers)**: AI disabled (`DISABLE_AI=true`) for consistent performance
- **Local Development**: Optional AI via Ollama for enhanced coaching commentary
- **Service Abstraction**: Clean interface allows AI on/off without code changes

### AI Service Architecture
```typescript
interface IAICoachService {
  analyzeGameplay(request): Promise<CoachingResponse>;
  // ... other methods
}

// Production: NoOpAIService (statistics only)
// Development: OllamaCoachService (statistics + AI commentary)
```

## 🔒 Security & Privacy

### Data Handling
- **No persistent storage**: All processing is stateless
- **Privacy-first**: Statistical analysis without data retention
- **Rate limiting**: Respects Leetify API limits (1 req/second)
- **Environment separation**: Production uses minimal surface area

### Deployment Security
- **Edge deployment**: Automatic DDoS protection via Cloudflare
- **Minimal dependencies**: Reduced attack surface
- **Environment variables**: Secure configuration management
- **No secrets**: API calls to public Leetify endpoints only

## 🚀 Deployment Options

### 1. Cloudflare Workers (Primary)
```bash
npm run deploy:workers
```
- **Pros**: Global edge deployment, automatic scaling, zero maintenance
- **Cons**: No AI integration, resource limits

### 2. Vercel (Alternative)
```bash
npm run deploy:vercel  
```
- **Pros**: Easy deployment, good performance
- **Cons**: Function timeouts, cold starts

### 3. Railway (Alternative)
```bash
# Configure railway.json and deploy
```
- **Pros**: Full Node.js environment, can include AI
- **Cons**: More expensive, requires management

### 4. Local MCP Server
```bash
npm run dev
```
- **Pros**: Full feature set, AI integration, no limits
- **Cons**: Requires local setup, not globally accessible

## 🧪 Quality Assurance

### Test Coverage
- **Unit Tests**: ~77% coverage (handlers, services, utilities)
- **Integration Tests**: End-to-end workflow validation
- **Statistical Tests**: Property-based testing for mathematical correctness
- **Performance Tests**: Response time and memory usage benchmarks

### Validation Strategy
- **Type Safety**: Full TypeScript with strict mode
- **Input Validation**: Zod schemas for all API inputs
- **Statistical Accuracy**: Validation against known results
- **Error Handling**: Graceful degradation for all failure modes

## 📈 Success Metrics

### Technical Performance
- ✅ **Response Time**: <5 seconds achieved
- ✅ **Deployment**: Zero-downtime edge deployment
- ✅ **Reliability**: Automatic error recovery and fallbacks
- ✅ **Scalability**: Edge deployment handles global traffic

### User Experience
- ✅ **Accessibility**: No setup required (HTTP API)
- ✅ **Accuracy**: Research-validated statistical thresholds
- ✅ **Actionability**: Specific, statistical-backed recommendations
- ✅ **Consistency**: Same analysis engine across all deployment modes

## 🛠️ Development Workflow

### Adding New Features
1. **Design**: Plan in TASK.md with clear acceptance criteria
2. **Implement**: Follow modular architecture patterns
3. **Test**: Unit tests + integration tests + statistical validation
4. **Deploy**: Verify local MCP → deploy to production HTTP API
5. **Document**: Update README and PLANNING.md

### Code Quality Standards
- **TypeScript**: Strict mode with no implicit any
- **ESLint**: Consistent code style
- **File Limits**: Max 500 lines per file
- **Documentation**: JSDoc for all public functions
- **Testing**: >77% coverage with focus on critical paths

## 🔮 Future Roadmap

### Short Term
- **Enhanced Error Handling**: Better user feedback for edge cases
- **Performance Optimization**: Further statistical computation speedups
- **Additional Metrics**: Expand statistical analysis capabilities

### Long Term
- **Real-time Analysis**: Live match analysis integration
- **Team Analysis**: Multi-player coordination metrics
- **Advanced ML**: Neural network pattern recognition
- **Mobile Integration**: API client libraries and SDKs

---

This architecture provides a solid foundation for both immediate production use (HTTP API) and advanced local development (MCP + AI), with clear separation of concerns and deployment flexibility.