'use client';

import { useQuery } from '@tanstack/react-query';
import type { PNodesResponse, NetworkResponse } from '@/types/pnode';

export function usePNodes() {
  return useQuery<PNodesResponse>({
    queryKey: ['pnodes'],
    queryFn: async () => {
      const response = await fetch('/api/pnodes');
      if (!response.ok) {
        throw new Error('Failed to fetch pNodes');
      }
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useNetworkOverview() {
  return useQuery<NetworkResponse>({
    queryKey: ['network'],
    queryFn: async () => {
      const response = await fetch('/api/network');
      if (!response.ok) {
        throw new Error('Failed to fetch network overview');
      }
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
