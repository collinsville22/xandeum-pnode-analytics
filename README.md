# Xandeum pNode Analytics

A real-time analytics and monitoring dashboard for the Xandeum distributed storage network. This application provides comprehensive insights into pNode network health, node performance metrics, token trading, and staking capabilities.

## Overview

Xandeum pNode Analytics serves as a central monitoring hub for the Xandeum network infrastructure. It enables node operators to track their pNode performance, provides network-wide analytics for stakeholders, and offers integrated DeFi features for XAND token holders.

## Features

### Network Monitoring
- Real-time pNode discovery via gossip protocol
- Live node status tracking (online/offline, public/private RPC)
- Geographic distribution visualization with interactive world map
- Network health scoring with component breakdown
- Version distribution tracking across the network

### Node Analytics
- Individual node performance metrics (CPU, RAM, storage, network traffic)
- Operational health scoring algorithm (A+ to F grades)
- Uptime tracking and historical data
- Node comparison tools
- Searchable and filterable node explorer

### Trading and Staking
- Live XAND and SOL price feeds with 24h change indicators
- Market cap and fully diluted valuation display
- Jupiter DEX integration for token swaps
- xandSOL stake pool interface for SOL staking
- Wallet integration supporting major Solana wallets

### Dashboard Features
- Auto-refreshing data (configurable intervals)
- Dark and light theme support
- Activity feed with real-time network events
- Export functionality for node data
- Responsive design for all screen sizes

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| State Management | TanStack React Query |
| Blockchain | @solana/web3.js, SPL Token |
| Wallet | Solana Wallet Adapter |
| Charts | Recharts |
| Maps | React Simple Maps |
| Icons | Lucide React |

## Project Structure

```
src/
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── network/            # Network statistics
│   │   ├── pnodes/             # pNode data aggregation
│   │   ├── pod-credits/        # Node earnings data
│   │   ├── prices/             # Token price feeds
│   │   ├── stake-pool/         # Staking pool metrics
│   │   └── swap/               # DEX integration
│   │
│   ├── dashboard/              # Dashboard pages
│   │   ├── page.tsx            # Main dashboard
│   │   ├── network/            # Network analytics
│   │   ├── nodes/              # Node explorer
│   │   ├── nodes/[ip]/         # Node details
│   │   ├── compare/            # Node comparison
│   │   ├── stake/              # Staking interface
│   │   ├── trade/              # Trading interface
│   │   ├── settings/           # User preferences
│   │   └── docs/               # Documentation
│   │
│   ├── pnode/[pubkey]/         # Public node view
│   └── pnodes/                 # Public node explorer
│
├── components/
│   ├── dashboard/              # Dashboard components
│   ├── layout/                 # Layout components
│   ├── swap/                   # Swap widget
│   ├── wallet/                 # Wallet components
│   ├── ai/                     # AI assistant
│   └── ui/                     # Reusable UI components
│
├── config/
│   ├── network.ts              # Network configuration
│   └── solana.ts               # Token and staking config
│
├── contexts/                   # React contexts
├── hooks/                      # Custom React hooks
├── lib/                        # Utilities and clients
│   ├── prpc.ts                 # pRPC client
│   ├── health-score.ts         # Health scoring
│   ├── geolocation.ts          # IP geolocation
│   ├── stake-pool.ts           # Staking transactions
│   └── alerts.ts               # Alert system
│
└── types/                      # TypeScript definitions
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- A Helius API key (for Solana RPC access)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/collinsville22/xandeum-pnode-analytics.git
cd xandeum-pnode-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env.local
```

4. Configure environment variables (see Configuration section below)

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Required: Helius RPC API Key
HELIUS_API_KEY=your_helius_api_key

# Alternative: Full Helius RPC URL
# HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Staking APY (percentage, default: 16)
XANDSOL_APY=16

# Token circulating supply ratio (decimal, default: 0.334)
# XAND_CIRCULATING_RATIO=0.334

# Custom bootstrap pNodes (comma-separated IPs)
# PUBLIC_PNODES=173.212.203.145,173.212.220.65

# Xandeum RPC endpoints (defaults provided)
# NEXT_PUBLIC_XANDEUM_RPC=https://api.devnet.xandeum.com:8899
# NEXT_PUBLIC_XANDEUM_WS=wss://api.devnet.xandeum.com:8900
```

### Obtaining a Helius API Key

1. Visit [helius.dev](https://helius.dev)
2. Create an account and generate an API key
3. Add the key to your `.env.local` file

## Production Deployment

### Option 1: Vercel (Recommended)

Vercel provides the simplest deployment path for Next.js applications.

1. Push your code to GitHub

2. Visit [vercel.com](https://vercel.com) and sign in with GitHub

3. Click "New Project" and import your repository

4. Configure environment variables in the Vercel dashboard:
   - Add `HELIUS_API_KEY` with your API key
   - Add `XANDSOL_APY` if using a custom APY value
   - Add any other optional variables as needed

5. Click "Deploy"

Vercel will automatically build and deploy your application. Subsequent pushes to the main branch will trigger automatic deployments.

### Option 2: Self-Hosted with Node.js

For self-hosted deployments on your own infrastructure:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The application runs on port 3000 by default. Use the `PORT` environment variable to change this.

### Option 3: Docker Deployment

Create a `Dockerfile` in your project root:

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t xandeum-analytics .
docker run -p 3000:3000 --env-file .env.local xandeum-analytics
```

### Option 4: PM2 Process Manager

For production deployments with PM2:

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Build the application:
```bash
npm run build
```

3. Create an ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'xandeum-analytics',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster'
  }]
};
```

4. Start the application:
```bash
pm2 start ecosystem.config.js
```

5. Save the process list and configure startup:
```bash
pm2 save
pm2 startup
```

### Reverse Proxy Configuration

For production deployments behind Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

For HTTPS, add SSL configuration or use Certbot for Let's Encrypt certificates.

### Production Checklist

Before deploying to production, ensure:

- [ ] All environment variables are properly configured
- [ ] Helius API key has sufficient rate limits for your expected traffic
- [ ] HTTPS is configured (required for wallet connections)
- [ ] Proper error monitoring is in place (Sentry, LogRocket, etc.)
- [ ] Caching headers are configured appropriately
- [ ] Health check endpoint is accessible for load balancers

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pnodes` | GET | Returns all discovered pNodes with stats |
| `/api/network` | GET | Returns network-wide statistics |
| `/api/pod-credits` | GET | Returns node credit/earnings data |
| `/api/prices` | GET | Returns XAND and SOL price data |
| `/api/stake-pool` | GET | Returns staking pool metrics |
| `/api/swap` | POST | Jupiter DEX swap endpoint |

## Network Configuration

### Default Endpoints

| Network | RPC Endpoint | WebSocket |
|---------|--------------|-----------|
| DevNet | `https://api.devnet.xandeum.com:8899` | `wss://api.devnet.xandeum.com:8900` |

### Port Reference

| Port | Service |
|------|---------|
| 6000 | pRPC (JSON-RPC) |
| 9001 | Gossip Protocol |
| 5000 | Atlas |
| 3000 | Application (default) |

### Token Addresses

| Token | Mint Address |
|-------|--------------|
| XAND | `XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx` |
| xandSOL | `XAnDeUmMcqFyCdef9jzpNgtZPjTj3xUMj9eXKn2reFN` |

## Health Score Algorithm

The operational health score (0-100) evaluates current node status across four weighted components:

| Component | Weight | Description |
|-----------|--------|-------------|
| Availability | 35% | Online status and public RPC accessibility |
| Performance | 35% | CPU and RAM utilization efficiency |
| Storage | 20% | Storage utilization ratio |
| Uptime | 10% | Current session duration |

Grades are assigned as follows:
- A+ (95-100), A (85-94), B+ (80-84), B (70-79)
- C+ (65-69), C (55-64), D (40-54), F (0-39)

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## External Services

This application integrates with:

- [Helius](https://helius.dev) - Solana RPC provider
- [Jupiter](https://jup.ag) - DEX aggregator for token swaps
- [ip-api.com](http://ip-api.com) - IP geolocation service

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/collinsville22/xandeum-pnode-analytics/issues) page.
