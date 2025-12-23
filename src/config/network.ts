export const XANDEUM_CONFIG = {
  devnet: {
    rpcEndpoint: process.env.NEXT_PUBLIC_XANDEUM_RPC || 'https://api.devnet.xandeum.com:8899',
    wsEndpoint: process.env.NEXT_PUBLIC_XANDEUM_WS || 'wss://api.devnet.xandeum.com:8900',
    programId: '6Bzz3KPvzQruqBg2vtsvkuitd6Qb4iCcr5DViifCwLsL',
    pnodeIndexAccount: 'GHTUesiECzPRHTShmBGt9LiaA89T8VAzw8ZWNE6EvZRs',
  },
  mainnet: {
    rpcEndpoint: process.env.NEXT_PUBLIC_XANDEUM_MAINNET_RPC || '',
    wsEndpoint: process.env.NEXT_PUBLIC_XANDEUM_MAINNET_WS || '',
    programId: 'xSHLJPXU8QW3A9kGiRoL94bksJ7ZZPY4dUwJPAT8CVK',
    pnodeIndexAccount: '',
  },
} as const;

const DEFAULT_PNODES = [
  '173.212.203.145',
  '173.212.220.65',
  '161.97.97.41',
  '192.190.136.36',
  '192.190.136.37',
  '192.190.136.38',
  '192.190.136.28',
  '192.190.136.29',
  '207.244.255.1',
];

export const PUBLIC_PNODES: readonly string[] = process.env.PUBLIC_PNODES
  ? process.env.PUBLIC_PNODES.split(',').map(ip => ip.trim()).filter(Boolean)
  : DEFAULT_PNODES;

export const PRPC_PORT = 6000;
export const GOSSIP_PORT = 9001;

export const PNODE_PORTS = {
  prpc: PRPC_PORT,
  gossip: GOSSIP_PORT,
  atlas: 5000,
  stats: 80,
  xandminerGui: 3000,
  xandminerd: 4000,
} as const;

export const getNetworkConfig = (network: 'devnet' | 'mainnet' = 'devnet') => {
  return XANDEUM_CONFIG[network];
};
