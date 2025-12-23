import { NextResponse } from 'next/server';
import { XAND_MINT, XANDSOL_MINT, SOL_MINT, JUPITER_PRICE_API, HELIUS_RPC, XAND_TOKEN_CONFIG } from '@/config/solana';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface JupiterPriceV3Response {
  [mint: string]: {
    usdPrice: number;
    blockId: number;
    decimals: number;
    priceChange24h: number;
    createdAt?: string;
    liquidity?: number;
  };
}

async function getTokenSupply(mint: string): Promise<{ total: number; circulating: number } | null> {
  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenSupply',
        params: [mint],
      }),
    });

    const data = await response.json();
    if (data.result?.value?.uiAmount) {
      const total = data.result.value.uiAmount;
      const circulating = total * XAND_TOKEN_CONFIG.circulatingRatio;
      return { total, circulating };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch token supply:', error);
    return null;
  }
}

export async function GET() {
  const startTime = Date.now();

  try {
    const [priceResponse, supplyData] = await Promise.all([
      fetch(`${JUPITER_PRICE_API}?ids=${[XAND_MINT, XANDSOL_MINT, SOL_MINT].join(',')}`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 30 },
      }),
      getTokenSupply(XAND_MINT),
    ]);

    if (!priceResponse.ok) {
      throw new Error(`Jupiter API error: ${priceResponse.status}`);
    }

    const data: JupiterPriceV3Response = await priceResponse.json();

    const xandData = data[XAND_MINT];
    const xandsolData = data[XANDSOL_MINT];
    const solData = data[SOL_MINT];

    const xandPrice = xandData?.usdPrice ?? null;
    const xandsolPrice = xandsolData?.usdPrice ?? null;
    const solPrice = solData?.usdPrice ?? null;

    const xandSupply = supplyData?.total ?? XAND_TOKEN_CONFIG.fallbackTotalSupply;
    const xandCirculating = supplyData?.circulating ?? XAND_TOKEN_CONFIG.fallbackCirculatingSupply;
    const marketCap = xandPrice ? xandPrice * xandCirculating : null;
    const fdv = xandPrice ? xandPrice * xandSupply : null;

    const exchangeRate = xandsolPrice && solPrice ? solPrice / xandsolPrice : null;

    const result = {
      xand: {
        price: xandPrice,
        priceFormatted: xandPrice ? `$${xandPrice.toFixed(6)}` : null,
        marketCap,
        marketCapFormatted: marketCap ? `$${(marketCap / 1_000_000).toFixed(2)}M` : null,
        fdv,
        fdvFormatted: fdv ? `$${(fdv / 1_000_000).toFixed(2)}M` : null,
        circulatingSupply: xandCirculating,
        circulatingSupplyFormatted: xandCirculating >= 1_000_000_000
          ? `${(xandCirculating / 1_000_000_000).toFixed(2)}B`
          : `${(xandCirculating / 1_000_000).toFixed(2)}M`,
        maxSupply: xandSupply,
        maxSupplyFormatted: xandSupply >= 1_000_000_000
          ? `${(xandSupply / 1_000_000_000).toFixed(2)}B`
          : `${(xandSupply / 1_000_000).toFixed(2)}M`,
        supplyFromChain: supplyData !== null,
        priceChange24h: xandData?.priceChange24h ?? null,
      },
      xandsol: {
        price: xandsolPrice,
        priceFormatted: xandsolPrice ? `$${xandsolPrice.toFixed(2)}` : null,
        exchangeRate,
        exchangeRateFormatted: exchangeRate ? exchangeRate.toFixed(4) : null,
        priceChange24h: xandsolData?.priceChange24h ?? null,
      },
      sol: {
        price: solPrice,
        priceFormatted: solPrice ? `$${solPrice.toFixed(2)}` : null,
        priceChange24h: solData?.priceChange24h ?? null,
      },
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };

    const res = NextResponse.json(result);
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    return res;
  } catch (error) {
    console.error('Price API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch prices',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
