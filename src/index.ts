#!/usr/bin/env node
/**
 * VIMO Financial Intelligence — MCP Server
 * Vietnam's first MCP server for financial AI agents
 * 
 * 22 tools: TA signals, BCTC analysis, AI picks, playbooks, market data
 * Covers 2,000+ Vietnamese stocks (HOSE, HNX, UPCOM)
 * 
 * @see https://vimo.cuthongthai.vn
 * @see https://modelcontextprotocol.io
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://vimo.cuthongthai.vn";
const API_KEY = process.env.VIMO_API_KEY || "";

if (!API_KEY) {
  console.error("[VIMO MCP] Warning: VIMO_API_KEY not set. Get your free key at https://vimo.cuthongthai.vn/finance/ai/api-docs");
}

// ─── API Client ──────────────────────────────────────────────
async function vimoFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": API_KEY,
      "User-Agent": "vimo-mcp-server/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`VIMO API error ${res.status}: ${res.statusText}. Check your VIMO_API_KEY.`);
  }
  return res.json();
}

// ─── MCP Server ──────────────────────────────────────────────
const server = new McpServer({
  name: "vimo-financial-intelligence",
  version: "1.2.0",
});

// ════════════════════════════════════════════════════════════
// TOOL 1: Technical Analysis + AI Narrative
// ════════════════════════════════════════════════════════════
server.tool(
  "get_ta_narrative",
  "Returns technical analysis signals (RSI, MACD, SMA, Bollinger, MFI) and an AI-generated narrative for a Vietnamese stock. Signal: STRONG_BUY/BUY/NEUTRAL/SELL/STRONG_SELL with confidence (0-100). Use when: user asks about TA signals or price action. Do NOT use for: real-time tick data.",
  {
    symbol: z.string().describe("Vietnamese stock ticker, e.g., FPT, VCB, VNM, HPG"),
  },
  async ({ symbol }) => {
    const data = await vimoFetch("/api/mcp/ta-narrative", { symbol: symbol.toUpperCase() });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOL 2: BCTC Financial Health (Z/F/M Scores)
// ════════════════════════════════════════════════════════════
server.tool(
  "get_bctc_summary",
  "VIMO proprietary 3D financial health analysis: Altman Z-Score (bankruptcy risk), Beneish M-Score (fraud detection), Piotroski F-Score (0-9 strength), DuPont ROE decomposition, 5 investment strategy scores. Use when: user asks about financial health or fundamentals.",
  {
    symbol: z.string().describe("Vietnamese stock ticker"),
  },
  async ({ symbol }) => {
    const data = await vimoFetch("/api/mcp/bctc-summary", { symbol: symbol.toUpperCase() });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOL 3: AI Performance (Forward-Test Verified)
// ════════════════════════════════════════════════════════════
server.tool(
  "get_ai_performance",
  "Returns VIMO AI trading system performance: win rate, average return, Sharpe ratio. ALL metrics are forward-test verified with real market data (not backtested). Use when: user asks about AI accuracy or track record.",
  {},
  async () => {
    const data = await vimoFetch("/api/mcp/ai-performance");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOL 4: AI Performance Reports (Monthly)
// ════════════════════════════════════════════════════════════
server.tool(
  "get_ai_performance_reports",
  "Monthly AI pick performance breakdown including per-stock results. Use when: user wants historical performance for a specific month.",
  {
    month: z.string().optional().describe("Month in YYYY-MM format, e.g., 2026-04. Defaults to current month."),
  },
  async ({ month }) => {
    const params = month ? { month } : {};
    const data = await vimoFetch("/api/mcp/ai-performance-reports", params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOL 5: Factor Importance (AI Explainability)
// ════════════════════════════════════════════════════════════
server.tool(
  "get_factor_importance",
  "VIMO proprietary: explains which factors drove the AI pick decision for a stock (TA weight, BCTC health, macro, WarWatch risk, political alpha). Use when: user asks WHY VIMO picked a stock.",
  {
    symbol: z.string().describe("Vietnamese stock ticker"),
  },
  async ({ symbol }) => {
    const data = await vimoFetch("/api/mcp/factor-importance", { symbol: symbol.toUpperCase() });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOL 6: Foreign Investor Flow
// ════════════════════════════════════════════════════════════
server.tool(
  "get_foreign_flow",
  "Daily foreign investor net buy/sell: top 10 stocks by foreign activity (net value VND, buy/sell volume). Use when: user asks what foreigners are buying/selling. Refreshes daily at market close.",
  {},
  async () => {
    const data = await vimoFetch("/api/mcp/foreign-flow");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOL 7: Sector Rotation Heatmap
// ════════════════════════════════════════════════════════════
server.tool(
  "get_sector_rotation",
  "Real-time sector performance heatmap — which VN market sectors are outperforming (hot) vs underperforming (cold) by daily return. Use when: user asks about sector trends.",
  {},
  async () => {
    const data = await vimoFetch("/api/mcp/sector-rotation");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOL 8: Whale Activity (Unusual Volume)
// ════════════════════════════════════════════════════════════
server.tool(
  "get_whale_activity",
  "Detects Vietnamese stocks with unusual volume (>2× 20-day average), signaling institutional/whale activity. Use when: user asks about unusual activity or wants institutional signals.",
  {},
  async () => {
    const data = await vimoFetch("/api/mcp/whale-activity");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOL 9: Market Snapshot (All 13 Collectors)
// ════════════════════════════════════════════════════════════
server.tool(
  "get_market_snapshot",
  "VIMO's aggregated daily snapshot from all 13 data collectors: foreign flow, sector rotation, whale activity, ETF data, macro indicators, oil prices, Fear & Greed Index, WarWatch score. Most comprehensive single tool. Use when: user asks for full market overview.",
  {},
  async () => {
    const data = await vimoFetch("/api/mcp/market-snapshot");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════
// TOOLS 10-22: Investment Playbooks (13 Categories)
// ════════════════════════════════════════════════════════════
const PLAYBOOK_TOOLS = [
  {
    name: "get_bank_rate_playbooks",
    description: "Investment strategies by interest rate scenario (rising/falling/stable). Use when: SBV changes rates or user asks how to position given rate outlook.",
    category: "bank-rate",
  },
  {
    name: "get_political_playbooks",
    description: "VIMO proprietary: investment strategies based on Vietnamese government policy signals (NQ68, infrastructure spend). Maps policies to stock beneficiaries. Use when: user asks about policy impact on stocks.",
    category: "political",
  },
  {
    name: "get_warwatch_playbooks",
    description: "VIMO WarWatch system: investment strategies for different geopolitical risk levels. Includes oil scenarios, defense stocks, sector rotation during conflict. Use when: geopolitical events occur.",
    category: "warwatch",
  },
  {
    name: "get_macro_playbooks",
    description: "Investment strategies for macro scenarios (high GDP, high CPI, strong FDI, weak VND). Use when: user asks about macro environment impact on portfolio.",
    category: "macro",
  },
  {
    name: "get_sector_rotation_playbooks",
    description: "VN market cycle sector rotation strategies: which sectors lead/lag in different market phases (recovery, expansion, late cycle, contraction).",
    category: "sector-rotation",
  },
  {
    name: "get_dong_tien_playbooks",
    description: "Money flow strategies: foreign net buy/sell trends, institutional accumulation, retail vs smart money divergence. Use when: user asks about following smart money.",
    category: "dong-tien",
  },
  {
    name: "get_commodity_playbooks",
    description: "How commodity price changes (oil, gold, steel, rubber) impact VN stocks. E.g., oil price rise → which VN stocks benefit. Use when: commodity prices spike.",
    category: "commodity",
  },
  {
    name: "get_bds_playbooks",
    description: "Vietnam real estate investment playbooks: property sector stocks, REIT strategies, real estate cycle analysis for VN market.",
    category: "bds",
  },
  {
    name: "get_fund_playbooks",
    description: "ETF and mutual fund comparison playbooks for Vietnamese investors. Fund selection strategies, passive vs active in VN context.",
    category: "fund",
  },
  {
    name: "get_gia_toc_playbooks",
    description: "VN business dynasty analysis: how family-controlled conglomerates (Vingroup, Masan, Hoa Phat) drive sector dynamics.",
    category: "gia-toc",
  },
  {
    name: "get_psychology_playbooks",
    description: "Behavioral finance and trading psychology strategies for Vietnamese retail investors. Covers FOMO, loss aversion, herd behavior in VN context.",
    category: "psychology",
  },
  {
    name: "get_wealth_playbooks",
    description: "Personal wealth building strategies by age, risk profile, and investment horizon. Based on Value Investing + VN market dynamics.",
    category: "wealth",
  },
  {
    name: "get_investment_checklists",
    description: "Pre-investment due diligence checklists: financial health gates, valuation gates, momentum gates, macro gates. Use when: user is about to make an investment decision.",
    category: "investment-checklists",
  },
] as const;

for (const { name, description, category } of PLAYBOOK_TOOLS) {
  server.tool(
    name,
    description,
    {
      limit: z.number().optional().default(10).describe("Max number of playbooks to return"),
    },
    async ({ limit }) => {
      const data = await vimoFetch(`/api/mcp/playbooks/${category}`, { limit: String(limit) });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}

// ─── Start Server ─────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[VIMO MCP] Server running. Tools: 22. Coverage: 2,000+ VN stocks.");
