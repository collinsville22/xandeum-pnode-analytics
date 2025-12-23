import { PRPC_PORT, PUBLIC_PNODES } from '@/config/network';
import http from 'http';

const DEFAULT_TIMEOUT = 8000;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  id: number;
  params?: unknown[];
}

interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

interface PNodeVersionResult {
  version: string;
}

interface PNodeStatsResult {
  total_bytes: number;
  total_pages: number;
  last_updated: number;
  cpu_percent: number;
  ram_used: number;
  ram_total: number;
  disk_used?: number;
  disk_total?: number;
  uptime: number;
  packets_received: number;
  packets_sent: number;
  active_streams: number;
  file_size: number;
  current_index?: number;
}

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

export interface Pod {
  address: string;
  version: string;
  last_seen: string;
  last_seen_timestamp: number;
  pubkey: string | null;
}

export interface PodWithStats {
  address: string;
  version: string;
  last_seen_timestamp: number;
  pubkey: string;
  uptime: number;
  is_public: boolean;
  rpc_port: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
}

interface PNodePodsResult {
  pods: Pod[];
  total_count: number;
}

interface PNodePodsWithStatsResult {
  pods: PodWithStats[];
}

function httpPost<T>(host: string, port: number, path: string, body: string, timeout: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: host,
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as T;
            resolve(parsed);
          } catch {
            reject(new Error(`Failed to parse response: ${data.slice(0, 100)}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(new Error(`HTTP request failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.write(body);
    req.end();
  });
}

export class PRPCClient {
  private host: string;
  private port: number;
  private requestId = 0;
  private timeout: number;

  constructor(host: string, port: number = PRPC_PORT, timeout: number = DEFAULT_TIMEOUT) {
    this.host = host;
    this.port = port;
    this.timeout = timeout;
  }

  private async makeRequest<T>(method: string, params?: unknown[]): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      id: ++this.requestId,
      params,
    };

    const body = JSON.stringify(request);
    const response = await httpPost<JsonRpcResponse<T>>(
      this.host,
      this.port,
      '/rpc',
      body,
      this.timeout
    );

    if (response.error) {
      throw new Error(`RPC Error ${response.error.code}: ${response.error.message}`);
    }

    if (response.result === undefined) {
      throw new Error('No result in RPC response');
    }

    return response.result;
  }

  async getVersion(): Promise<string> {
    const result = await this.makeRequest<PNodeVersionResult>('get-version');
    return result.version;
  }

  async getStats(): Promise<PNodeStats> {
    const result = await this.makeRequest<PNodeStatsResult>('get-stats');

    const ramPercent = result.ram_total > 0
      ? (result.ram_used / result.ram_total) * 100
      : 0;

    return {
      cpu_percent: result.cpu_percent,
      ram_used: result.ram_used,
      ram_total: result.ram_total,
      ram_percent: ramPercent,
      disk_used: result.disk_used ?? result.file_size ?? 0,
      disk_total: result.disk_total ?? result.total_bytes ?? 0,
      uptime: result.uptime,
      packets_received: result.packets_received,
      packets_sent: result.packets_sent,
      active_streams: result.active_streams,
      file_size: result.file_size,
      total_bytes: result.total_bytes ?? 0,
      total_pages: result.total_pages ?? 0,
      last_updated: result.last_updated ?? 0,
      current_index: result.current_index ?? 0,
    };
  }

  async getPods(): Promise<Pod[]> {
    const result = await this.makeRequest<PNodePodsResult>('get-pods');
    return result.pods;
  }

  async getPodCount(): Promise<number> {
    const result = await this.makeRequest<PNodePodsResult>('get-pods');
    return result.total_count;
  }

  async getPodsWithStats(): Promise<PodWithStats[]> {
    const result = await this.makeRequest<PNodePodsWithStatsResult>('get-pods-with-stats');
    return result.pods || [];
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.getVersion();
      return true;
    } catch {
      return false;
    }
  }
}

export function createPRPCClient(host: string, port?: number, timeout?: number): PRPCClient {
  return new PRPCClient(host, port, timeout);
}

export async function discoverPodsFromBootstrap(): Promise<Pod[]> {
  for (const host of PUBLIC_PNODES) {
    try {
      const client = createPRPCClient(host);
      const pods = await client.getPods();
      if (pods.length > 0) {
        return pods;
      }
    } catch {
      continue;
    }
  }
  return [];
}
