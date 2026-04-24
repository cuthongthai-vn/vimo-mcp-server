# VIMO Financial Intelligence — MCP Server

> 🦉 Vietnam's most comprehensive financial data and AI analysis platform, accessible via the Model Context Protocol.

[![npm](https://img.shields.io/npm/v/@vimo.cuthongthai.vn/mcp-server)](https://www.npmjs.com/package/@vimo.cuthongthai.vn/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

### 1. Get your API key (free)

Visit [vimo.cuthongthai.vn/finance/ai/api-docs](https://vimo.cuthongthai.vn/finance/ai/api-docs) → Create key → Copy.

Or use the demo key: `vimo_demo_public_readonly_2026` (rate-limited, VN30 only)

### 2. Connect to Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vimo": {
      "command": "npx",
      "args": ["-y", "@vimo.cuthongthai.vn/mcp-server"],
      "env": {
        "VIMO_API_KEY": "vimo_demo_public_readonly_2026"
      }
    }
  }
}
```

**Claude Code:**

```bash
claude config add-mcp vimo-financial-intel -- env VIMO_API_KEY=vimo_demo_public_readonly_2026 npx -y @vimo.cuthongthai.vn/mcp-server
```

**Cursor:** Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vimo": {
      "command": "npx",
      "args": ["-y", "@vimo.cuthongthai.vn/mcp-server"],
      "env": {
        "VIMO_API_KEY": "vimo_demo_public_readonly_2026"
      }
    }
  }
}
```

**Windsurf / Cline:** Add to MCP settings:

```json
{
  "command": "npx",
  "args": ["-y", "@vimo.cuthongthai.vn/mcp-server"],
  "env": { "VIMO_API_KEY": "vimo_demo_public_readonly_2026" }
}
```

### 3. Ask Claude about Vietnamese stocks

```
"FPT giá bao nhiêu hôm nay?"
"Phân tích kỹ thuật VCB"
"Sàng lọc cổ phiếu tăng trưởng"
"AI pick win rate tháng này?"
"Best commodity playbook for rising oil?"
```

## Available Tools (35)

### L0: DISCOVER (3)
| Tool | Description |
|------|-------------|
| `search_stocks` | Search Vietnamese stocks by name or ticker |
| `get_stock_info` | Company profile + latest price + key financial ratios + moat score |
| `get_realtime_quote` | Real-time price from SSI FastConnect + foreign flow + optional 1-min bars |

### L1: CONTEXT (5)
| Tool | Description |
|------|-------------|
| `get_index_history` | VNINDEX/VN30/HNX30 daily OHLCV history |
| `get_macro_snapshot` | Vietnam + global macro indicators (SBV rates, CPI, GDP, PMI) |
| `get_foreign_flow` | Foreign investor net buy/sell — top 10 stocks |
| `get_sector_rotation` | Sector heatmap — hot/cold sectors by daily return |
| `get_warwatch_osint` | WarWatch geopolitical risk score + Iran-Hormuz oil risk |

### L2: SCREEN (2)
| Tool | Description |
|------|-------------|
| `screen_stocks` | Stock screener — 13 built-in strategies (growth, value, dividend, etc.) |
| `get_sector_rotation` | Sector heatmap for rotation timing |

### L3: ANALYZE (6)
| Tool | Description |
|------|-------------|
| `get_price_history` | Daily OHLCV price history for any stock |
| `get_financials` | Balance sheet, income statement, cash flow, ratios |
| `get_technical_signals` | Technical indicators: RSI, MACD, MA cross, volume |
| `get_ta_narrative` | Technical analysis + AI narrative for VN stocks |
| `get_bctc_summary` | Financial statement analysis (ROE, Z-score, 5 strategies) |
| `get_factor_importance` | Factor importance breakdown per stock |

### L4: VALIDATE (5)
| Tool | Description |
|------|-------------|
| `get_opinion` | Analyst consensus + AI recommendation |
| `get_insider_activity` | Insider trading transactions |
| `get_corporate_events` | Dividends, shareholder meetings, rights issues |
| `get_whale_activity` | Unusual volume stocks (>2× avg) — institutional signals |
| `get_ai_performance` | AI pick win rate and performance metrics |

### L5: DECIDE (1)
| Tool | Description |
|------|-------------|
| `get_news_sentiment` | News sentiment score per stock — bullish/bearish/neutral |

### L8: LEARN — Investment Playbooks (13)
| Tool | Description |
|------|-------------|
| `get_bank_rate_playbooks` | Interest rate scenario strategies |
| `get_bds_playbooks` | Real estate investment playbooks |
| `get_commodity_playbooks` | Commodity impact analysis |
| `get_dong_tien_playbooks` | Money flow (foreign, institutional, retail) |
| `get_fund_playbooks` | ETF and mutual fund comparison |
| `get_gia_toc_playbooks` | Business dynasty analysis |
| `get_investment_checklists` | Pre-investment due diligence |
| `get_macro_playbooks` | Macroeconomic scenario strategies |
| `get_political_playbooks` | Political alpha (policy impact) |
| `get_psychology_playbooks` | Trading psychology |
| `get_sector_rotation_playbooks` | Sector rotation by market cycle |
| `get_warwatch_playbooks` | Geopolitical risk strategies |
| `get_wealth_playbooks` | Personal wealth building |

## Security

- 🔒 **API key required** — server refuses to start without valid `VIMO_API_KEY`
- 🔑 **Key format validation** — must match `vimo_[a-zA-Z0-9]{32+}` or `vimo_demo*`
- ⏱️ **30s request timeout** — prevents hanging connections
- 🛡️ **12-layer defense** on server side (rate limiting, input sanitization, canary detection)
- 🧹 **Input sanitized** — symbols and categories validated before sending

## Data Coverage

- **~2,000 VN stocks** (HOSE, HNX, UPCOM)
- **50+ data sources** (SBV, GSO, SSI FastConnect, FMP, Yahoo, Binance)
- **Real-time prices** via SSI FastConnect (15-min delay during market hours)
- **Daily updates** (6:00 AM ICT) for fundamentals, signals, and AI picks

## Rate Limits

| Tier | Calls/day | Calls/min | Price |
|------|-----------|-----------|-------|
| Demo | 50 | 3 | Free |
| Free | 100 | 5 | $0/mo |
| Developer | 1,000 | 10 | $19/mo |
| Pro | 3,000 | 20 | $49/mo |
| Enterprise | Unlimited | 60 | $299/mo |

Get your API key at [vimo.cuthongthai.vn/finance/ai/api-docs](https://vimo.cuthongthai.vn/finance/ai/api-docs)

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `VIMO_API_KEY` | **Yes** | — | Your VIMO API key |
| `VIMO_API_BASE` | No | `https://vimo.cuthongthai.vn` | API base URL |

## Also Available

- **REST API**: `GET https://vimo.cuthongthai.vn/api/mcp/realtime-quote?symbol=FPT` (+ `x-api-key` header)
- **MCP manifest**: `https://vimo.cuthongthai.vn/api/mcp/manifest.json` (35 tools)
- **Discovery**: `/.well-known/mcp.json`, `/llms.txt`
- **LLM info**: `https://vimo.cuthongthai.vn/llms.txt`

## License

MIT — © CuThongThai 2026
