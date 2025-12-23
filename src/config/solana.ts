export const XAND_MINT = 'XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx';

export const XAND_TOKEN_CONFIG = {
  circulatingRatio: parseFloat(process.env.XAND_CIRCULATING_RATIO || '0.334'),
  fallbackTotalSupply: 4_014_997_405,
  fallbackCirculatingSupply: 1_342_530_966,
};

export const XANDSOL_STAKE_POOL = {
  address: 'xanDnetFGrZkp49s8brXbg6T215JeDTeSfDF19wBiNQ',
  manager: 'Ec3nzEVcQ7jxgJWoHF9eECa2ysyjK95h6agNQVesNXnK',
  staker: '6WUhUqePeW728kWM3YgKgUKBo2x3f787Coi2hYju7F7c',
  stakeDepositAuthority: 'AjGjuB6gUHY9JtvGLvMpHeViWRjVGFLvrqBZ8kpX4eAf',
  poolWithdrawAuthority: '5uJR4QjnRPzHnt4R2FogtpbzQaUE2HKo3Z9yEYxPTi1H',
  validatorList: '6WtbtEjZA5G9iYHcMyGYhdsUxtPuRt5SFQKmpGbUz9Gc',
  poolMint: 'XAnDeUmMcqFyCdef9jzpNgtZPjTj3xUMj9eXKn2reFN',
  managerFeeAccount: '6WJBLpP3pv7NYUUsTpctu5SChyBALjC1zFi4n8CHnBw7',
  reserveStake: 'HRvig1Z3mezo7WYH2KcVvR9AL6QWcHbYkGQmEwpaiCPs',
};

export const XANDSOL_STAKING_CONFIG = {
  apy: parseFloat(process.env.XANDSOL_APY || '16'),
};

export const XANDSOL_MINT = 'XAnDeUmMcqFyCdef9jzpNgtZPjTj3xUMj9eXKn2reFN';

export const SOL_MINT = 'So11111111111111111111111111111111111111112';

export const HELIUS_RPC = process.env.HELIUS_RPC_URL || `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`;

export const JUPITER_PRICE_API = 'https://lite-api.jup.ag/price/v3';
export const JUPITER_QUOTE_API = 'https://api.jup.ag/swap/v1/quote';
export const JUPITER_SWAP_API = 'https://api.jup.ag/swap/v1/swap';
