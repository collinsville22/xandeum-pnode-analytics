'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type RealtimeEventType =
  | 'node_status_change'
  | 'node_metrics_update'
  | 'network_stats_update'
  | 'price_update'
  | 'new_node'
  | 'node_removed';

export interface RealtimeEvent {
  type: RealtimeEventType;
  timestamp: Date;
  data: any;
}

interface UseRealtimeOptions {
  enabled?: boolean;
  pollInterval?: number;
  endpoints?: string[];
  onEvent?: (event: RealtimeEvent) => void;
}

interface RealtimeState {
  connected: boolean;
  lastUpdate: Date | null;
  eventCount: number;
  connectionType: 'sse' | 'polling' | 'none';
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    enabled = true,
    pollInterval = 5000,
    endpoints = ['/api/pnodes', '/api/prices'],
    onEvent,
  } = options;

  const [state, setState] = useState<RealtimeState>({
    connected: false,
    lastUpdate: null,
    eventCount: 0,
    connectionType: 'none',
  });

  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const previousDataRef = useRef<Map<string, any>>(new Map());
  const pollTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const detectChanges = useCallback((endpoint: string, newData: any): RealtimeEvent[] => {
    const detectedEvents: RealtimeEvent[] = [];
    const prevData = previousDataRef.current.get(endpoint);
    const now = new Date();

    if (!prevData) {
      previousDataRef.current.set(endpoint, newData);
      return detectedEvents;
    }

    if (endpoint === '/api/pnodes') {
      const prevNodes = prevData.pNodes || [];
      const newNodes = newData.pNodes || [];
      const prevMap = new Map(prevNodes.map((n: any) => [n.address, n]));
      const newMap = new Map(newNodes.map((n: any) => [n.address, n]));

      newNodes.forEach((node: any) => {
        const prev = prevMap.get(node.address) as any;
        if (prev) {
          if (prev.online !== node.online) {
            detectedEvents.push({
              type: 'node_status_change',
              timestamp: now,
              data: {
                address: node.address,
                previousStatus: prev.online,
                newStatus: node.online,
              },
            });
          }

          if (node.stats && prev.stats) {
            const cpuDiff = Math.abs((node.stats.cpu_percent || 0) - (prev.stats.cpu_percent || 0));
            const ramDiff = Math.abs((node.stats.ram_percent || 0) - (prev.stats.ram_percent || 0));
            const bytesDiff = (node.stats.total_bytes || 0) - (prev.stats.total_bytes || 0);

            if (cpuDiff > 10 || ramDiff > 10 || bytesDiff > 10 * 1024 * 1024) {
              detectedEvents.push({
                type: 'node_metrics_update',
                timestamp: now,
                data: {
                  address: node.address,
                  metrics: node.stats,
                  previousMetrics: prev.stats,
                },
              });
            }
          }
        } else {
          detectedEvents.push({
            type: 'new_node',
            timestamp: now,
            data: { node },
          });
        }
      });

      prevNodes.forEach((prev: any) => {
        if (!newMap.has(prev.address)) {
          detectedEvents.push({
            type: 'node_removed',
            timestamp: now,
            data: { address: prev.address },
          });
        }
      });

      const prevOnline = prevNodes.filter((n: any) => n.online).length;
      const newOnline = newNodes.filter((n: any) => n.online).length;
      if (prevOnline !== newOnline) {
        detectedEvents.push({
          type: 'network_stats_update',
          timestamp: now,
          data: {
            previousOnline: prevOnline,
            currentOnline: newOnline,
            total: newNodes.length,
          },
        });
      }
    }

    if (endpoint === '/api/prices') {
      const prevPrice = prevData?.xand?.price;
      const newPrice = newData?.xand?.price;
      if (prevPrice !== undefined && newPrice !== undefined && prevPrice !== newPrice) {
        detectedEvents.push({
          type: 'price_update',
          timestamp: now,
          data: {
            previousPrice: prevPrice,
            currentPrice: newPrice,
            change: ((newPrice - prevPrice) / prevPrice) * 100,
          },
        });
      }
    }

    previousDataRef.current.set(endpoint, newData);
    return detectedEvents;
  }, []);

  const pollEndpoints = useCallback(async () => {
    if (!enabled) return;

    try {
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const res = await fetch(endpoint);
          const data = await res.json();
          return { endpoint, data };
        })
      );

      const allEvents: RealtimeEvent[] = [];
      results.forEach(({ endpoint, data }) => {
        const events = detectChanges(endpoint, data);
        allEvents.push(...events);
      });

      if (allEvents.length > 0) {
        setEvents((prev) => [...allEvents, ...prev].slice(0, 100));
        allEvents.forEach((event) => onEvent?.(event));
      }

      setState((prev) => ({
        ...prev,
        connected: true,
        lastUpdate: new Date(),
        eventCount: prev.eventCount + allEvents.length,
        connectionType: 'polling',
      }));
    } catch (error) {
      console.error('Realtime poll error:', error);
      setState((prev) => ({ ...prev, connected: false }));
    }
  }, [enabled, endpoints, detectChanges, onEvent]);

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, connected: false, connectionType: 'none' }));
      return;
    }

    pollEndpoints();

    pollTimerRef.current = setInterval(pollEndpoints, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [enabled, pollInterval, pollEndpoints]);

  const refresh = useCallback(() => {
    pollEndpoints();
  }, [pollEndpoints]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    ...state,
    events,
    refresh,
    clearEvents,
  };
}

export function formatRealtimeEvent(event: RealtimeEvent): { title: string; description: string; icon: string } {
  switch (event.type) {
    case 'node_status_change':
      return {
        title: event.data.newStatus ? 'Node Online' : 'Node Offline',
        description: `${event.data.address.split(':')[0]} is now ${event.data.newStatus ? 'online' : 'offline'}`,
        icon: event.data.newStatus ? 'CircleCheck' : 'CircleOff',
      };

    case 'node_metrics_update':
      return {
        title: 'Metrics Updated',
        description: `${event.data.address.split(':')[0]} metrics changed`,
        icon: 'BarChart3',
      };

    case 'network_stats_update':
      const diff = event.data.currentOnline - event.data.previousOnline;
      return {
        title: 'Network Update',
        description: `${event.data.currentOnline}/${event.data.total} nodes online (${diff >= 0 ? '+' : ''}${diff})`,
        icon: diff >= 0 ? 'TrendingUp' : 'TrendingDown',
      };

    case 'price_update':
      const priceChange = event.data.change;
      return {
        title: 'Price Update',
        description: `XAND price ${priceChange >= 0 ? 'up' : 'down'} ${Math.abs(priceChange).toFixed(2)}%`,
        icon: priceChange >= 0 ? 'TrendingUp' : 'TrendingDown',
      };

    case 'new_node':
      return {
        title: 'New Node',
        description: `${event.data.node.address.split(':')[0]} joined the network`,
        icon: 'Plus',
      };

    case 'node_removed':
      return {
        title: 'Node Removed',
        description: `${event.data.address.split(':')[0]} left the network`,
        icon: 'Minus',
      };

    default:
      return {
        title: 'Event',
        description: JSON.stringify(event.data),
        icon: 'Activity',
      };
  }
}
