import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function timeSince(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-500',
    inactive: 'text-yellow-500',
    delinquent: 'text-red-500',
    unknown: 'text-gray-500',
  };
  return colors[status] || colors.unknown;
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-500/10',
    inactive: 'bg-yellow-500/10',
    delinquent: 'bg-red-500/10',
    unknown: 'bg-gray-500/10',
  };
  return colors[status] || colors.unknown;
}
