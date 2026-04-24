# Changelog

All notable changes to the VIMO MCP Server will be documented in this file.

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
