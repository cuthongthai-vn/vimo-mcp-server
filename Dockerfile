FROM node:20-slim

LABEL maintainer="CuThongThai <support@cuthongthai.vn>"
LABEL description="VIMO Financial Intelligence — MCP Server for Vietnamese stock market"
LABEL org.opencontainers.image.source="https://github.com/cuthongthai-vn/vimo-mcp-server"

WORKDIR /app

# Copy package files first for layer caching
COPY package.json ./

# Install production dependencies only
RUN npm install --omit=dev --ignore-scripts

# Copy server source
COPY index.js ./

# MCP stdio transport: stdin/stdout
# API key must be provided via environment variable
ENV NODE_ENV=production

# Health check: server starts and responds to list_tools
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | timeout 5 node index.js || exit 1

ENTRYPOINT ["node", "index.js"]
