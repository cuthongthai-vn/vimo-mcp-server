# 🦉 VIMO Financial Intelligence — MCP Server

[![npm](https://img.shields.io/npm/v/@vimo.cuthongthai.vn/mcp-server)](https://www.npmjs.com/package/@vimo.cuthongthai.vn/mcp-server)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Vietnam's first MCP server for financial AI agents.**

Gives Claude, ChatGPT, Gemini, and any AI agent instant access to VIMO's proprietary financial intelligence platform — covering **2,000+ Vietnamese stocks** across HOSE, HNX, UPCOM.

> 🔗 **Live data:** [vimo.cuthongthai.vn](https://vimo.cuthongthai.vn)  
> 📖 **API Docs:** [vimo.cuthongthai.vn/finance/ai/api-docs](https://vimo.cuthongthai.vn/finance/ai/api-docs)  
> 📜 **Terms of Use:** [vimo.cuthongthai.vn/terms-of-use](https://vimo.cuthongthai.vn/terms-of-use)

---

## 🚀 Quick Start

### 1. Get a Free API Key

Register at [vimo.cuthongthai.vn/finance/ai/api-docs](https://vimo.cuthongthai.vn/finance/ai/api-docs)  
Free tier: **100 calls/day**

### 2. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vimo": {
      "command": "npx",
      "args": ["-y", "@vimo.cuthongthai.vn/mcp-server"],
      "env": {
        "VIMO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. Done! 🎉

### 3. Test It

In Claude, try:
> *"Phân tích cổ phiếu FPT cho tôi"*  
> *"Thị trường chứng khoán VN hôm nay thế nào?"*  
> *"Cổ phiếu nào ngoại tệ đang mua nhiều nhất?"*

---

## 🛠️ 22 Available Tools

### Intelligence Layer (VIMO Proprietary)

| Tool | Description |
|------|-------------|
| `get_ta_narrative` | TA signals (RSI, MACD, Bollinger, MFI) + AI narrative |
| `get_bctc_summary` | Financial health (Z-Score, F-Score, M-Score, DuPont) |
| `get_ai_performance` | Forward-test verified AI pick win rate & Sharpe |
| `get_ai_performance_reports` | Monthly per-stock performance breakdown |
| `get_factor_importance` | Why AI picked a specific stock (explainability) |

### Market Data

| Tool | Description |
|------|-------------|
| `get_foreign_flow` | Foreign investor net buy/sell — top 10 stocks |
| `get_sector_rotation` | Sector heatmap (hot/cold by daily return) |
| `get_whale_activity` | Unusual volume detector (>2× average) |
| `get_market_snapshot` | **Full daily snapshot** (all 13 collectors in 1 call) |

### Investment Playbooks (13 Categories)

| Tool | Category |
|------|---------|
| `get_warwatch_playbooks` | 🌍 Geopolitical risk strategies |
| `get_political_playbooks` | 🏛️ Policy impact (NQ68, infrastructure) |
| `get_macro_playbooks` | 📊 GDP, CPI, FDI scenarios |
| `get_bank_rate_playbooks` | 🏦 Interest rate strategies |
| `get_sector_rotation_playbooks` | 🔄 Market cycle rotation |
| `get_dong_tien_playbooks` | 💰 Smart money flow |
| `get_commodity_playbooks` | 🛢️ Oil, gold, steel impact |
| `get_bds_playbooks` | 🏠 Real estate sector |
| `get_fund_playbooks` | 📈 ETF & mutual fund strategies |
| `get_gia_toc_playbooks` | 🏢 Business dynasty analysis |
| `get_psychology_playbooks` | 🧠 Behavioral finance |
| `get_wealth_playbooks` | 💎 Personal wealth building |
| `get_investment_checklists` | ✅ Pre-investment due diligence |

---

## 📦 Installation (Developers)

```bash
npm install @vimo.cuthongthai.vn/mcp-server
```

Or run directly:
```bash
VIMO_API_KEY=your_key npx @vimo.cuthongthai.vn/mcp-server
```

---

## 💻 Usage in Code

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@vimo.cuthongthai.vn/mcp-server"],
  env: { VIMO_API_KEY: "your_key" },
});

const client = new Client({ name: "my-app", version: "1.0.0" });
await client.connect(transport);

// Analyze FPT stock
const result = await client.callTool({
  name: "get_ta_narrative",
  arguments: { symbol: "FPT" },
});
console.log(result.content[0].text);

// Get foreign flow
const flow = await client.callTool({ name: "get_foreign_flow", arguments: {} });
```

---

## ⚡ API Tiers

| Tier | Calls/Day | Price |
|------|-----------|-------|
| Free | 100 | $0 |
| Developer | 1,000 | $19/mo |
| Pro | 3,000 | $49/mo |
| Enterprise | Unlimited | $299/mo |

---

## 🔒 Security

- All tools are **read-only** (`readOnlyHint: true`)
- No trade execution — VIMO never places orders
- Input sanitization on all parameters
- API key authentication via `x-api-key` header
- Rate limiting per tier

---

## ⚠️ Disclaimer

All VIMO data is for **informational purposes only**. This is NOT investment advice. Always consult a qualified financial professional before making investment decisions. Past AI pick performance does not guarantee future results.

---

## 📄 License

MIT © [Cú Thông Thái](https://cuthongthai.vn)

---

## 🔗 Links

- [VIMO Platform](https://vimo.cuthongthai.vn)
- [API Documentation](https://vimo.cuthongthai.vn/finance/ai/api-docs)
- [Terms of Use](https://vimo.cuthongthai.vn/terms-of-use)
- [MCP Discovery](https://vimo.cuthongthai.vn/.well-known/mcp.json)
- [Report Issues](https://github.com/cuthongthai-vn/vimo-mcp-server/issues)
