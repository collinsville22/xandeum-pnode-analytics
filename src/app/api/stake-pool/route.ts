import { NextResponse } from 'next/server';
import { XANDSOL_STAKE_POOL, HELIUS_RPC, XANDSOL_MINT, SOL_MINT, JUPITER_PRICE_API, XANDSOL_STAKING_CONFIG } from '@/config/solana';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface StakePoolData {
  totalLamports: number;
  poolTokenSupply: number;
  lastUpdateEpoch: number;
  solWithdrawalFee: { numerator: number; denominator: number };
  stakeWithdrawalFee: { numerator: number; denominator: number };
  nextStakeWithdrawalFee: { numerator: number; denominator: number } | null;
  stakeDepositFee: { numerator: number; denominator: number };
  solDepositFee: { numerator: number; denominator: number };
  referralFee: number;
  solDepositAuthority: string | null;
  solWithdrawAuthority: string | null;
}

async function getStakePoolAccount(): Promise<StakePoolData | null> {
  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [
          XANDSOL_STAKE_POOL.address,
          { encoding: 'jsonParsed' }
        ],
      }),
    });

    const data = await response.json();
    if (data.result?.value?.data) {
      return data.result.value.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to get stake pool account:', error);
    return null;
  }
}

async function getTokenSupply(mint: string): Promise<number> {
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
      return data.result.value.uiAmount;
    }
    return 0;
  } catch (error) {
    console.error('Failed to get token supply:', error);
    return 0;
  }
}

async function getReserveBalance(): Promise<number> {
  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [XANDSOL_STAKE_POOL.reserveStake],
      }),
    });

    const data = await response.json();
    if (data.result?.value) {
      return data.result.value / 1e9;
    }
    return 0;
  } catch (error) {
    console.error('Failed to get reserve balance:', error);
    return 0;
  }
}

interface PriceResult {
  sol: number;
  xandsol: number;
  solPriceChange24h: number | null;
  xandsolPriceChange24h: number | null;
}

async function getPrices(): Promise<PriceResult | null> {
  try {
    const tokenIds = [SOL_MINT, XANDSOL_MINT].join(',');
    const response = await fetch(`${JUPITER_PRICE_API}?ids=${tokenIds}`);
    const data = await response.json();

    const solPrice = data[SOL_MINT]?.usdPrice ?? null;
    const xandsolPrice = data[XANDSOL_MINT]?.usdPrice ?? null;
    const solPriceChange24h = data[SOL_MINT]?.priceChange24h ?? null;
    const xandsolPriceChange24h = data[XANDSOL_MINT]?.priceChange24h ?? null;

    if (solPrice && xandsolPrice) {
      return { sol: solPrice, xandsol: xandsolPrice, solPriceChange24h, xandsolPriceChange24h };
    }
    return null;
  } catch (error) {
    console.error('Failed to get prices:', error);
    return null;
  }
}

export async function GET() {
  const startTime = Date.now();

  try {
    const [xandsolSupply, reserveBalance, prices] = await Promise.all([
      getTokenSupply(XANDSOL_MINT),
      getReserveBalance(),
      getPrices(),
    ]);

    const exchangeRate = prices ? prices.xandsol / prices.sol : null;

    const tvlSol = xandsolSupply * (exchangeRate || 1);
    const tvlUsd = prices ? tvlSol * prices.sol : null;

    const apy = XANDSOL_STAKING_CONFIG.apy;

    const result = {
      stakePool: {
        address: XANDSOL_STAKE_POOL.address,
        poolMint: XANDSOL_STAKE_POOL.poolMint,
      },
      stats: {
        xandsolSupply,
        xandsolSupplyFormatted: xandsolSupply.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        reserveBalance,
        reserveBalanceFormatted: `${reserveBalance.toFixed(2)} SOL`,
        tvlSol,
        tvlSolFormatted: `${tvlSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`,
        tvlUsd,
        tvlUsdFormatted: tvlUsd ? `$${(tvlUsd / 1_000_000).toFixed(2)}M` : null,
        apy,
        apyFormatted: `${apy}%`,
      },
      prices: {
        sol: prices?.sol || null,
        solFormatted: prices?.sol ? `$${prices.sol.toFixed(2)}` : null,
        solPriceChange24h: prices?.solPriceChange24h ?? null,
        xandsol: prices?.xandsol || null,
        xandsolFormatted: prices?.xandsol ? `$${prices.xandsol.toFixed(2)}` : null,
        xandsolPriceChange24h: prices?.xandsolPriceChange24h ?? null,
        exchangeRate,
        exchangeRateFormatted: exchangeRate ? `1 SOL = ${(1/exchangeRate).toFixed(4)} xandSOL` : null,
      },
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };

    const res = NextResponse.json(result);
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    return res;
  } catch (error) {
    console.error('Stake pool API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch stake pool data',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
