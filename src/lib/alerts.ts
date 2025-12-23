export type AlertType =
  | 'node_offline'
  | 'node_online'
  | 'health_drop'
  | 'health_recover'
  | 'high_cpu'
  | 'high_ram'
  | 'low_storage'
  | 'version_outdated'
  | 'network_health'
  | 'data_milestone';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  nodeAddress?: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  type: AlertType;
  enabled: boolean;
  threshold?: number;
  nodeAddresses?: string[];
  description: string;
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'node_offline',
    type: 'node_offline',
    enabled: true,
    description: 'Alert when a monitored node goes offline',
  },
  {
    id: 'node_online',
    type: 'node_online',
    enabled: true,
    description: 'Alert when a monitored node comes back online',
  },
  {
    id: 'health_drop',
    type: 'health_drop',
    enabled: true,
    threshold: 20,
    description: 'Alert when health score drops significantly',
  },
  {
    id: 'high_cpu',
    type: 'high_cpu',
    enabled: true,
    threshold: 90,
    description: 'Alert when CPU usage is critically high',
  },
  {
    id: 'high_ram',
    type: 'high_ram',
    enabled: true,
    threshold: 90,
    description: 'Alert when RAM usage is critically high',
  },
  {
    id: 'low_storage',
    type: 'low_storage',
    enabled: true,
    threshold: 10,
    description: 'Alert when storage is almost full',
  },
  {
    id: 'version_outdated',
    type: 'version_outdated',
    enabled: true,
    description: 'Alert when node is running an outdated version',
  },
  {
    id: 'network_health',
    type: 'network_health',
    enabled: true,
    threshold: 50,
    description: 'Alert when overall network health is poor',
  },
  {
    id: 'data_milestone',
    type: 'data_milestone',
    enabled: true,
    description: 'Celebrate when nodes reach data milestones',
  },
];

interface NodeState {
  address: string;
  online: boolean;
  healthScore: number;
  cpuPercent: number;
  ramPercent: number;
  storagePercent: number;
  version: string;
  totalBytes: number;
}

interface NetworkState {
  healthPercent: number;
  onlinePercent: number;
  latestVersion: string;
}

export function checkNodeAlerts(
  currentState: NodeState,
  previousState: NodeState | null,
  rules: AlertRule[],
  networkState: NetworkState
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  if (rules.find(r => r.id === 'node_offline')?.enabled) {
    if (previousState?.online && !currentState.online) {
      alerts.push({
        id: `offline-${currentState.address}-${now.getTime()}`,
        type: 'node_offline',
        severity: 'critical',
        title: 'Node Offline',
        message: `Node ${currentState.address.split(':')[0]} has gone offline`,
        nodeAddress: currentState.address,
        timestamp: now,
        read: false,
      });
    }
  }

  if (rules.find(r => r.id === 'node_online')?.enabled) {
    if (previousState && !previousState.online && currentState.online) {
      alerts.push({
        id: `online-${currentState.address}-${now.getTime()}`,
        type: 'node_online',
        severity: 'success',
        title: 'Node Online',
        message: `Node ${currentState.address.split(':')[0]} is back online`,
        nodeAddress: currentState.address,
        timestamp: now,
        read: false,
      });
    }
  }

  const healthRule = rules.find(r => r.id === 'health_drop');
  if (healthRule?.enabled && previousState) {
    const drop = previousState.healthScore - currentState.healthScore;
    if (drop >= (healthRule.threshold || 20)) {
      alerts.push({
        id: `health-drop-${currentState.address}-${now.getTime()}`,
        type: 'health_drop',
        severity: 'warning',
        title: 'Health Score Dropped',
        message: `Node ${currentState.address.split(':')[0]} health dropped from ${previousState.healthScore} to ${currentState.healthScore}`,
        nodeAddress: currentState.address,
        timestamp: now,
        read: false,
        data: { previous: previousState.healthScore, current: currentState.healthScore },
      });
    }
  }

  const cpuRule = rules.find(r => r.id === 'high_cpu');
  if (cpuRule?.enabled && currentState.online) {
    if (currentState.cpuPercent >= (cpuRule.threshold || 90)) {
      alerts.push({
        id: `high-cpu-${currentState.address}-${now.getTime()}`,
        type: 'high_cpu',
        severity: 'warning',
        title: 'High CPU Usage',
        message: `Node ${currentState.address.split(':')[0]} CPU at ${currentState.cpuPercent.toFixed(1)}%`,
        nodeAddress: currentState.address,
        timestamp: now,
        read: false,
        data: { cpuPercent: currentState.cpuPercent },
      });
    }
  }

  const ramRule = rules.find(r => r.id === 'high_ram');
  if (ramRule?.enabled && currentState.online) {
    if (currentState.ramPercent >= (ramRule.threshold || 90)) {
      alerts.push({
        id: `high-ram-${currentState.address}-${now.getTime()}`,
        type: 'high_ram',
        severity: 'warning',
        title: 'High RAM Usage',
        message: `Node ${currentState.address.split(':')[0]} RAM at ${currentState.ramPercent.toFixed(1)}%`,
        nodeAddress: currentState.address,
        timestamp: now,
        read: false,
        data: { ramPercent: currentState.ramPercent },
      });
    }
  }

  const storageRule = rules.find(r => r.id === 'low_storage');
  if (storageRule?.enabled && currentState.online) {
    const available = 100 - currentState.storagePercent;
    if (available <= (storageRule.threshold || 10)) {
      alerts.push({
        id: `low-storage-${currentState.address}-${now.getTime()}`,
        type: 'low_storage',
        severity: 'warning',
        title: 'Low Storage',
        message: `Node ${currentState.address.split(':')[0]} storage ${currentState.storagePercent.toFixed(1)}% full`,
        nodeAddress: currentState.address,
        timestamp: now,
        read: false,
        data: { storagePercent: currentState.storagePercent },
      });
    }
  }

  if (rules.find(r => r.id === 'version_outdated')?.enabled && currentState.online) {
    if (currentState.version !== networkState.latestVersion) {
      alerts.push({
        id: `outdated-${currentState.address}-${now.getTime()}`,
        type: 'version_outdated',
        severity: 'info',
        title: 'Outdated Version',
        message: `Node ${currentState.address.split(':')[0]} running v${currentState.version}, latest is v${networkState.latestVersion}`,
        nodeAddress: currentState.address,
        timestamp: now,
        read: false,
        data: { current: currentState.version, latest: networkState.latestVersion },
      });
    }
  }

  if (rules.find(r => r.id === 'data_milestone')?.enabled && previousState) {
    const GB = 1024 * 1024 * 1024;
    const prevGb = Math.floor(previousState.totalBytes / GB);
    const currGb = Math.floor(currentState.totalBytes / GB);
    if (currGb > prevGb && currGb > 0) {
      alerts.push({
        id: `milestone-${currentState.address}-${currGb}gb-${now.getTime()}`,
        type: 'data_milestone',
        severity: 'success',
        title: 'Data Milestone!',
        message: `Node ${currentState.address.split(':')[0]} served ${currGb} GB of data`,
        nodeAddress: currentState.address,
        timestamp: now,
        read: false,
        data: { gigabytes: currGb },
      });
    }
  }

  return alerts;
}

export function checkNetworkAlerts(
  currentState: NetworkState,
  _previousState: NetworkState | null,
  rules: AlertRule[]
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  const healthRule = rules.find(r => r.id === 'network_health');
  if (healthRule?.enabled) {
    if (currentState.healthPercent < (healthRule.threshold || 50)) {
      alerts.push({
        id: `network-health-${now.getTime()}`,
        type: 'network_health',
        severity: 'critical',
        title: 'Network Health Alert',
        message: `Network health is at ${currentState.healthPercent}% (below threshold of ${healthRule.threshold || 50}%)`,
        timestamp: now,
        read: false,
        data: { healthPercent: currentState.healthPercent },
      });
    }
  }

  return alerts;
}

export function getAlertColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'info': return '#3b82f6';
    case 'success': return '#22c55e';
  }
}

export function getAlertIcon(type: AlertType): string {
  switch (type) {
    case 'node_offline': return 'CircleOff';
    case 'node_online': return 'CircleCheck';
    case 'health_drop': return 'TrendingDown';
    case 'health_recover': return 'TrendingUp';
    case 'high_cpu': return 'Cpu';
    case 'high_ram': return 'MemoryStick';
    case 'low_storage': return 'HardDrive';
    case 'version_outdated': return 'RefreshCw';
    case 'network_health': return 'AlertTriangle';
    case 'data_milestone': return 'Award';
  }
}

export function saveAlerts(alerts: Alert[]): void {
  localStorage.setItem('xandeum_alerts', JSON.stringify(alerts));
}

export function loadAlerts(): Alert[] {
  const stored = localStorage.getItem('xandeum_alerts');
  if (!stored) return [];
  try {
    return JSON.parse(stored).map((a: { timestamp: string } & Omit<Alert, 'timestamp'>) => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));
  } catch {
    return [];
  }
}

export function saveAlertRules(rules: AlertRule[]): void {
  localStorage.setItem('xandeum_alert_rules', JSON.stringify(rules));
}

export function loadAlertRules(): AlertRule[] {
  const stored = localStorage.getItem('xandeum_alert_rules');
  if (!stored) return DEFAULT_ALERT_RULES;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_ALERT_RULES;
  }
}
