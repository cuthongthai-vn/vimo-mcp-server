# Changelog

All notable changes to the VIMO MCP Server will be documented in this file.

## [2.1.0] - 2026-04-25

### Added
- **MCP Prompts Primitive** (MCP 2025 spec): 5 workflow templates
  - `analyze_stock` — comprehensive stock analysis (6 tools in sequence)
  - `market_outlook` — daily market intelligence briefing
  - `screener_strategy` — investment strategy screening + analysis
  - `portfolio_review` — multi-stock portfolio review and rebalancing
  - `macro_briefing` — comprehensive Vietnam macro briefing
- **Streamable HTTP Transport** at `POST /api/mcp` — enables 1-click install on Glama and remote MCP clients (Cursor, Windsurf, Zed)
- **Structured error codes**: `VIMO_AUTH_ERROR`, `VIMO_RATE_LIMIT`, `VIMO_TIMEOUT`, `VIMO_UPSTREAM_ERROR`
- **Batch JSON-RPC** support — handle multiple requests in one HTTP call
- `GET /api/mcp` health endpoint with server metadata
- `glama.json` registry metadata file for Glama quality score

### Changed
- Server version: `2.0.0` → `2.1.0`
- `capabilities`: added `prompts: {}` declaration
- Startup log: `35 tools + 5 prompts ready`

---

## [2.0.0] - 2026-04-24


### Added
- **13 new tools**: `search_stocks`, `get_stock_info`, `get_realtime_quote`, `get_index_history`, `get_macro_snapshot`, `screen_stocks`, `get_price_history`, `get_financials`, `get_technical_signals`, `get_opinion`, `get_insider_activity`, `get_corporate_events`, `get_news_sentiment`
- **Real-time quotes** via SSI FastConnect API
- **MCP 2025 tool annotations**: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
- **Dockerfile** for Glama quality checks
- **Demo API key**: `vimo_demo_public_readonly_2026` for instant testing
- **Glama listing** with quality badge

### Changed
- Architecture: migrated from TypeScript (`src/index.ts`) to pure JavaScript (`index.js`)
- Zero build step — runs directly with Node.js 18+
- Tool count: 22 → 35
- MCP SDK: `@modelcontextprotocol/sdk@^1.20.0`

### Security
- API key format validation (`vimo_[a-zA-Z0-9]{32+}` or `vimo_demo*`)
- 30s request timeout
- Input sanitization (symbol + category regex)
- All tools read-only — no trade execution capability

## [1.2.0] - 2026-04-21

### Added
- 22 tools covering TA signals, financial health scores, foreign flow
- 13 investment playbook categories
- WarWatch geopolitical risk monitoring
- Claude Desktop + Cursor integration

## [1.1.0] - 2026-04-18

### Added
- Initial release with core analysis tools
- Technical analysis narrative (`ta-narrative`)
- BCTC financial statement summary
- AI performance tracking
