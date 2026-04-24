#!/usr/bin/env node
/**
 * VIMO Financial Intelligence — MCP Server
 * ═══════════════════════════════════════════
 * Exposes 35 financial analysis tools for Claude, GPT, and other AI agents
 * via the Model Context Protocol (stdio transport).
 *
 * Usage:
 *   VIMO_API_KEY=your_key npx @vimo.cuthongthai.vn/mcp-server    # Quick start
 *   node mcp-server/index.js                       # Local dev
 *
 * Security:
 *   - API key REQUIRED — server refuses to start without VIMO_API_KEY
 *   - All requests go through x-api-key auth (12-layer defense on server)
 *   - Request timeout: 30s (prevents hanging connections)
 *   - Input sanitized: symbol/category validated before sending
 *
 * NOTE: Uses raw Server API (not McpServer) to avoid Zod 4 vs 3 conflict.
 *       Project uses Zod 4.3.6, SDK expects Zod 3.x.
 *
 * Ref: FEATURE_GUIDE §12 (AI Agent Infrastructure)
 *      DATA-MOAT-STRATEGY §4 (Distribution Flywheel)
 * ═══════════════════════════════════════════
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG + SECURITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_BASE = process.env.VIMO_API_BASE || 'https://vimo.cuthongthai.vn';
const API_KEY = process.env.VIMO_API_KEY;
const REQUEST_TIMEOUT_MS = 30_000; // 30s timeout

// ═══ Security Gate: Refuse to start without API key ═══
if (!API_KEY || API_KEY.length < 10) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ VIMO_API_KEY is required                                ║');
  console.error('║                                                              ║');
  console.error('║  Get your free API key at:                                   ║');
  console.error('║  https://vimo.cuthongthai.vn/finance/ai/api-docs             ║');
  console.error('║                                                              ║');
  console.error('║  Then set it:                                                ║');
  console.error('║  export VIMO_API_KEY=vimo_your_key_here                      ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

// ═══ Validate key format (production or demo) ═══
const isDemoKey = API_KEY.startsWith('vimo_demo');
if (!isDemoKey && !/^vimo_[a-zA-Z0-9]{32,}$/.test(API_KEY)) {
  console.error('❌ Invalid VIMO_API_KEY format. Keys start with "vimo_" followed by 32+ alphanumeric characters.');
  console.error('   Or use the demo key: vimo_demo_public_readonly_2026');
  console.error('   Get a production key at: https://vimo.cuthongthai.vn/finance/ai/api-docs');
  process.exit(1);
}

// ═══ Input validation ═══
const SYMBOL_REGEX = /^[A-Z0-9]{1,10}$/;
const CATEGORY_REGEX = /^[a-z0-9_-]{1,50}$/;

function sanitizeSymbol(s) {
  if (!s) return undefined;
  const upper = String(s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  return SYMBOL_REGEX.test(upper) ? upper : undefined;
}

function sanitizeCategory(c) {
  if (!c) return undefined;
  const lower = String(c).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 50);
  return CATEGORY_REGEX.test(lower) ? lower : undefined;
}

// ═══ API caller with timeout + auth ═══
async function callVIMO(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const resp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'User-Agent': `vimo-mcp-server/2.0.0`,
      },
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      if (resp.status === 401) throw new Error('Invalid API key. Check your VIMO_API_KEY.');
      if (resp.status === 429) throw new Error('Rate limit exceeded. Wait and retry, or upgrade at vimo.cuthongthai.vn/finance/ai/pricing');
      throw new Error(`VIMO API error ${resp.status}: ${errText.slice(0, 200)}`);
    }
    return resp.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Request timeout (${REQUEST_TIMEOUT_MS / 1000}s). Try again.`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOL DEFINITIONS (JSON Schema — no Zod dependency)
// MCP 2025 spec: all tools annotated with hints
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// All VIMO tools are read-only data queries — no side effects
const TOOL_ANNOTATIONS = {
  readOnlyHint: true,       // No data mutations
  destructiveHint: false,   // No destructive actions
  idempotentHint: true,     // Same input → same output
  openWorldHint: false,     // Finite, known data domain
};

const TOOLS = [
  // ── L0: DISCOVER ──
  {
    name: 'search_stocks',
    description: 'Search Vietnamese stocks by ticker or company name. Filter by sector (VN30, Banking, Tech). Tìm cổ phiếu theo mã hoặc tên.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query: ticker or company name, e.g. FPT, Vinamilk' },
        sector: { type: 'string', description: 'Optional sector filter: VN30, Banking, Tech, etc.' },
        limit: { type: 'number', description: 'Max results (default: 10, max: 50)' },
      },
      required: ['q'],
    },
    endpoint: '/api/mcp/search',
    mapParams: (args) => ({ q: args.q, sector: sanitizeCategory(args.sector), limit: Math.min(parseInt(args.limit) || 10, 50) }),
  },
  {
    name: 'get_stock_info',
    description: 'Company profile + latest price + key financial ratios + moat score — all in 1 call. Thông tin tổng quan cổ phiếu: giá, tài chính, moat.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. FPT, VCB, HPG' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/stock-info',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol) }),
  },
  {
    name: 'get_realtime_quote',
    description: 'Latest stock price from SSI FastConnect — real-time during market hours (15min delay). Includes foreign buy/sell flow and optional 1-min intraday OHLC bars. Giá cổ phiếu real-time từ SSI.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. FPT, VCB' },
        intraday: { type: 'boolean', description: 'Include 1-min OHLC bars (default: false)' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/realtime-quote',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol), intraday: args.intraday ? 'true' : undefined }),
  },

  // ── L1: CONTEXT ──
  {
    name: 'get_index_history',
    description: 'VNINDEX/VN30/HNX historical closing prices + market breadth. Lịch sử chỉ số VNINDEX/VN30/HNX.',
    inputSchema: {
      type: 'object',
      properties: {
        index: { type: 'string', description: 'Index: VNINDEX, VN30, or HNX' },
        days: { type: 'number', description: 'Number of trading days (max 365)' },
      },
    },
    endpoint: '/api/mcp/index-history',
    mapParams: (args) => ({ index: args.index || 'VNINDEX', days: Math.min(parseInt(args.days) || 30, 365) }),
  },
  {
    name: 'get_macro_snapshot',
    description: 'Vietnam + US + China macro indicators: GDP, CPI, interest rates, FX, gold, oil. Chỉ số vĩ mô Việt Nam, Mỹ, Trung Quốc.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter: vietnam, us, china, commodities' },
      },
    },
    endpoint: '/api/mcp/macro-snapshot',
    mapParams: (args) => ({ category: sanitizeCategory(args.category) }),
  },

  // ── L2: SCREEN ──
  {
    name: 'screen_stocks',
    description: 'Multi-strategy stock screening (13 strategies: Buffett, Graham, Piotroski, Lynch, O\'Neil...). Sàng lọc cổ phiếu theo 13 chiến lược đầu tư.',
    inputSchema: {
      type: 'object',
      properties: {
        strategy: { type: 'string', description: 'Strategy: buffett, graham, piotroski, lynch, oneil, canslim, etc.' },
        min_score: { type: 'number', description: 'Minimum score (default: 60)' },
      },
    },
    endpoint: '/api/mcp/screener',
    mapParams: (args) => ({ strategy: sanitizeCategory(args.strategy), min_score: parseInt(args.min_score) || 60 }),
  },

  // ── L3: ANALYZE ──
  {
    name: 'get_price_history',
    description: 'OHLCV price history for individual Vietnamese stocks. Lịch sử giá OHLCV cổ phiếu.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. FPT' },
        days: { type: 'number', description: 'Number of trading days (max 365)' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/price-history',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol), days: Math.min(parseInt(args.days) || 30, 365) }),
  },
  {
    name: 'get_financials',
    description: 'Annual financial ratios: ROE, ROA, margins, P/E, P/B for a Vietnamese stock. Chỉ số tài chính hàng năm.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. VCB' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/financials',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol) }),
  },
  {
    name: 'get_technical_signals',
    description: 'Technical analysis signals: RSI, MACD, Bollinger Bands, buy/sell votes, confidence score. Tín hiệu kỹ thuật MUA/BÁN.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. FPT' },
        days: { type: 'number', description: 'Number of days (max 30)' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/technical-signals',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol), days: Math.min(parseInt(args.days) || 5, 30) }),
  },

  // ── L4: VALIDATE ──
  {
    name: 'get_opinion',
    description: 'AI-synthesized opinion: moat score + ESG score + insider signal + analyst consensus for a stock. Ý kiến tổng hợp AI: moat, ESG, nội bộ, chuyên gia.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. VCB' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/opinion',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol) }),
  },
  {
    name: 'get_insider_activity',
    description: 'Insider trading transactions — buy/sell by executives and major shareholders. Giao dịch nội bộ cổ đông lớn.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. HPG' },
        days: { type: 'number', description: 'Lookback days (default: 90)' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/insider-activity',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol), days: parseInt(args.days) || 90 }),
  },
  {
    name: 'get_corporate_events',
    description: 'Corporate events: personnel changes, shareholder meetings (ĐHCĐ), dividends. Sự kiện doanh nghiệp: nhân sự, ĐHCĐ.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker (optional, omit for all)' },
        type: { type: 'string', description: 'Event type: personnel, shareholder' },
      },
    },
    endpoint: '/api/mcp/corporate-events',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol), type: sanitizeCategory(args.type) }),
  },

  // ── L5: DECIDE ──
  {
    name: 'get_news_sentiment',
    description: 'Daily news sentiment scores per ticker — bullish/bearish/neutral %, top events. AI-powered from Perplexity. Sentiment tin tức hàng ngày.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker (optional, omit for market-wide)' },
        days: { type: 'number', description: 'Lookback days (default: 7)' },
      },
    },
    endpoint: '/api/mcp/news-sentiment',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol), days: parseInt(args.days) || 7 }),
  },

  // ── Core Analysis Tools (existing) ──
  {
    name: 'get_ta_narrative',
    description: 'Get technical analysis signals and AI-generated narrative for a Vietnamese stock. Returns RSI, MACD, moving averages, buy/sell votes, and market commentary. Lấy tín hiệu phân tích kỹ thuật và bình luận AI cho cổ phiếu Việt Nam.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol, e.g. FPT, VNM, VCB' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/ta-narrative',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol) }),
  },
  {
    name: 'get_bctc_summary',
    description: 'Get financial statement (BCTC) analysis for a Vietnamese stock. Includes ROE, ROA, debt ratios, Altman Z-score. Supports 5 strategies: Buffett, Graham, Lynch, O\'Neil, Piotroski. Phân tích báo cáo tài chính cổ phiếu Việt Nam.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. FPT, VNM, VCB' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/bctc-summary',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol) }),
  },
  {
    name: 'get_ai_performance',
    description: 'Get AI stock pick performance metrics — win rate, average return, Sharpe ratio. Forward-test data (not backtest). Hiệu suất AI chọn cổ phiếu — tỷ lệ thắng, lợi nhuận trung bình.',
    inputSchema: { type: 'object', properties: {} },
    endpoint: '/api/mcp/ai-performance',
    mapParams: () => ({}),
  },
  {
    name: 'get_ai_performance_reports',
    description: 'Get detailed monthly AI performance reports with per-stock breakdown. Báo cáo hiệu suất AI picks hàng tháng chi tiết.',
    inputSchema: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'Month in YYYY-MM format, e.g. 2026-03' },
      },
    },
    endpoint: '/api/mcp/ai-performance-reports',
    mapParams: (args) => ({ month: args.month }),
  },
  {
    name: 'get_factor_importance',
    description: 'Get factor importance breakdown for a stock — shows which data factors (technical, fundamental, macro, sentiment, etc.) most influenced the AI pick decision. Phân tích tầm quan trọng của từng yếu tố ảnh hưởng đến quyết định AI.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker, e.g. FPT, VNM, VCB' },
      },
      required: ['symbol'],
    },
    endpoint: '/api/mcp/factor-importance',
    mapParams: (args) => ({ symbol: sanitizeSymbol(args.symbol) }),
  },

  // ── Playbook Tools (13) ──
  ...[
    ['get_bank_rate_playbooks', '/api/mcp/bank-rate-playbooks',
      'Investment playbooks based on bank interest rate scenarios in Vietnam. Chiến lược đầu tư theo kịch bản lãi suất.'],
    ['get_bds_playbooks', '/api/mcp/bds-playbooks',
      'Real estate investment playbooks for Vietnam — pricing, location, financing. Chiến lược đầu tư bất động sản.'],
    ['get_commodity_playbooks', '/api/mcp/commodity-playbooks',
      'Commodity investment playbooks — oil, gold, agricultural impact on VN market. Chiến lược hàng hoá.'],
    ['get_dong_tien_playbooks', '/api/mcp/dong-tien-playbooks',
      'Money flow analysis — foreign flow, institutional, retail patterns. Phân tích dòng tiền.'],
    ['get_fund_playbooks', '/api/mcp/fund-playbooks',
      'Investment fund comparison — ETFs, mutual funds, DCDS. So sánh quỹ đầu tư.'],
    ['get_gia_toc_playbooks', '/api/mcp/gia-toc-playbooks',
      'Vietnam business dynasty analysis — family-owned conglomerate insights. Phân tích gia tộc kinh doanh.'],
    ['get_investment_checklists', '/api/mcp/investment-checklists',
      'Pre-investment due diligence checklists for Vietnamese stocks. Danh sách kiểm tra đầu tư.'],
    ['get_macro_playbooks', '/api/mcp/macro-playbooks',
      'Macroeconomic scenario playbooks — GDP, CPI, FDI impact on stocks. Chiến lược vĩ mô.'],
    ['get_political_playbooks', '/api/mcp/political-playbooks',
      'Political alpha — policy events, government personnel changes impact. Alpha chính trị.'],
    ['get_psychology_playbooks', '/api/mcp/psychology-playbooks',
      'Trading psychology — behavioral finance, fear/greed management. Tâm lý giao dịch.'],
    ['get_sector_rotation_playbooks', '/api/mcp/sector-rotation-playbooks',
      'Sector rotation by market cycle — identify outperforming VN sectors. Luân chuyển ngành.'],
    ['get_warwatch_playbooks', '/api/mcp/warwatch-playbooks',
      'Geopolitical risk playbooks — war impact, oil price, defense stocks. Chiến lược địa chính trị.'],
    ['get_wealth_playbooks', '/api/mcp/wealth-playbooks',
      'Personal wealth building — savings, allocation by age/risk. Xây dựng tài sản cá nhân.'],
  ].map(([name, endpoint, description]) => ({
    name,
    description,
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by playbook category/tag' },
        limit: { type: 'number', description: 'Max results to return (default: 10)' },
      },
    },
    endpoint,
    mapParams: (args) => ({
      category: sanitizeCategory(args.category),
      limit: Math.min(Math.max(parseInt(args.limit) || 10, 1), 20),
    }),
  })),

  // ── C0 Data Intelligence Tools (4) ──
  {
    name: 'get_foreign_flow',
    description: 'Foreign investor net buy/sell flow for Vietnamese stock market (HOSE). Includes top 10 net-buy and net-sell stocks by foreign investors, total buy/sell value, and foreign % of market volume. Dòng tiền khối ngoại mua/bán ròng.',
    inputSchema: { type: 'object', properties: {} },
    endpoint: '/api/mcp/foreign-flow',
    mapParams: () => ({}),
  },
  {
    name: 'get_sector_rotation',
    description: 'Sector rotation heatmap — average daily return, total volume, and stock count per industry group. Identifies hottest and coldest sectors. Luân chuyển dòng tiền giữa các ngành.',
    inputSchema: { type: 'object', properties: {} },
    endpoint: '/api/mcp/sector-rotation',
    mapParams: () => ({}),
  },
  {
    name: 'get_whale_activity',
    description: 'Whale/institutional activity detector — stocks with abnormal trading volume (>2× 20-day average). Sorted by volume ratio. Phát hiện cổ phiếu có khối lượng bất thường (cá mập giao dịch).',
    inputSchema: { type: 'object', properties: {} },
    endpoint: '/api/mcp/whale-activity',
    mapParams: () => ({}),
  },
  {
    name: 'get_market_snapshot',
    description: 'Complete daily market intelligence snapshot — combines all 13 data collectors: market, macro, sentiment, risk, commodity, top stocks, insider, moat, foreign flow, whale, sector rotation, ETF, dividend. Single call for comprehensive overview. Bức tranh toàn cảnh thị trường.',
    inputSchema: { type: 'object', properties: {} },
    endpoint: '/api/mcp/market-snapshot',
    mapParams: () => ({}),
  },
];


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MCP SERVER (raw Server API — Zod-free)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const server = new Server(
  {
    name: 'vimo-financial-intelligence',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);


// Handler: List all tools (with MCP 2025 annotations)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: t.annotations || TOOL_ANNOTATIONS,
  })),
}));


// Handler: Call a tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  const tool = TOOLS.find(t => t.name === name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}. Available: ${TOOLS.map(t => t.name).join(', ')}` }],
      isError: true,
    };
  }

  try {
    const params = tool.mapParams(args);
    const data = await callVIMO(tool.endpoint, params);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error calling ${name}: ${error.message}` }],
      isError: true,
    };
  }
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[VIMO MCP] ✅ Server v2.0.0 started — ${TOOLS.length} tools ready`);
  console.error(`[VIMO MCP] 🔑 API key: ${API_KEY.slice(0, 13)}...`);
  console.error(`[VIMO MCP] 🌐 Base: ${API_BASE}`);
}

main().catch((err) => {
  console.error('[VIMO MCP] ❌ Fatal:', err.message);
  process.exit(1);
});
