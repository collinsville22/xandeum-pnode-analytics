import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const JUPITER_QUOTE_API = 'https://public.jupiterapi.com/quote';
const JUPITER_SWAP_API = 'https://public.jupiterapi.com/swap';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const inputMint = searchParams.get('inputMint');
  const outputMint = searchParams.get('outputMint');
  const amount = searchParams.get('amount');
  const slippageBps = searchParams.get('slippageBps') || '50';

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: 'Missing required parameters: inputMint, outputMint, amount' },
      { status: 400 }
    );
  }

  try {
    const quoteUrl = new URL(JUPITER_QUOTE_API);
    quoteUrl.searchParams.set('inputMint', inputMint);
    quoteUrl.searchParams.set('outputMint', outputMint);
    quoteUrl.searchParams.set('amount', amount);
    quoteUrl.searchParams.set('slippageBps', slippageBps);

    const response = await fetch(quoteUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jupiter Quote API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get quote', details: errorText },
        { status: response.status }
      );
    }

    const quoteResponse = await response.json();
    return NextResponse.json(quoteResponse);
  } catch (error) {
    console.error('Quote error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteResponse, userPublicKey } = body;

    if (!quoteResponse || !userPublicKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: quoteResponse, userPublicKey' },
        { status: 400 }
      );
    }

    const response = await fetch(JUPITER_SWAP_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 10000000,
            priorityLevel: 'veryHigh',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jupiter Swap API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to build swap transaction', details: errorText },
        { status: response.status }
      );
    }

    const swapResponse = await response.json();
    return NextResponse.json(swapResponse);
  } catch (error) {
    console.error('Swap error:', error);
    return NextResponse.json(
      { error: 'Failed to build swap', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
