export interface PNodeStats {
  cpu_percent: number;
  ram_used: number;
  ram_total: number;
  ram_percent: number;
  disk_used: number;
  disk_total: number;
  uptime: number;
  packets_received: number;
  packets_sent: number;
  active_streams: number;
  file_size: number;
  total_bytes: number;
  total_pages: number;
  last_updated: number;
  current_index: number;
}

export interface PNodeLocation {
  country: string;
  region: string;
  city: string;
  ll: [number, number];
  timezone: string;
}

export interface PNode {
  address: string;
  pubkey: string | null;
  version: string;
  stats: PNodeStats | null;
  last_seen_timestamp: number;
  online: boolean;
  location?: PNodeLocation;
  is_public?: boolean;
  rpc_port?: number;
  storage_committed?: number;
  storage_used?: number;
  storage_usage_percent?: number;
  uptime?: number;
}

export interface NetworkOverview {
  total_pnodes: number;
  online_pnodes: number;
  offline_pnodes: number;
  public_pnodes: number;
  private_pnodes: number;
  total_storage: number;
  total_storage_committed: number;
  total_storage_used: number;
  total_ram: number;
  avg_cpu_percent: number;
  avg_ram_percent: number;
  avg_uptime: number;
  total_pages: number;
  total_bytes: number;
  total_packets_received: number;
  total_packets_sent: number;
  total_active_streams: number;
  version_distribution: Record<string, number>;
  location_distribution: Record<string, number>;
}

export interface PNodesResponse {
  pNodes: PNode[];
  total: number;
  online: number;
  offline: number;
  timestamp: number;
  responseTime: number;
  cached?: boolean;
}

export interface NetworkResponse {
  overview: NetworkOverview;
  timestamp: number;
  responseTime: number;
  cached?: boolean;
}

export interface VersionData {
  name: string;
  value: number;
  percentage: number;
}

export interface LocationData {
  country: string;
  count: number;
}
