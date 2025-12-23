export interface HealthScoreBreakdown {
  overall: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  components: {
    availability: { score: number; weight: number; raw: boolean };
    performance: { score: number; weight: number; raw: { cpu: number; ram: number } };
    storage: { score: number; weight: number; raw: number };
    uptime: { score: number; weight: number; raw: number };
  };
  percentile?: number;
}

interface NodeMetrics {
  online: boolean;
  uptime?: number;
  cpu_percent?: number;
  ram_percent?: number;
  storage_used?: number;
  storage_committed?: number;
  is_public?: boolean;
}

const WEIGHTS = {
  availability: 0.35,
  performance: 0.35,
  storage: 0.20,
  uptime: 0.10,
};

function calculateUptimeScore(uptimeSeconds: number | undefined): number {
  if (!uptimeSeconds || uptimeSeconds <= 0) return 0;

  const ONE_DAY = 86400;
  const ONE_WEEK = 604800;
  const ONE_MONTH = 2592000;

  if (uptimeSeconds >= ONE_MONTH) return 100;
  if (uptimeSeconds >= ONE_WEEK) return 80 + (uptimeSeconds - ONE_WEEK) / (ONE_MONTH - ONE_WEEK) * 20;
  if (uptimeSeconds >= ONE_DAY) return 60 + (uptimeSeconds - ONE_DAY) / (ONE_WEEK - ONE_DAY) * 20;

  return (uptimeSeconds / ONE_DAY) * 60;
}

function calculatePerformanceScore(cpuPercent: number | undefined, ramPercent: number | undefined): number {
  const cpu = cpuPercent ?? 50;
  const ram = ramPercent ?? 50;

  let cpuScore = 100 - cpu;
  if (cpu < 10) cpuScore = 95;
  if (cpu > 90) cpuScore = 10;

  let ramScore: number;
  if (ram >= 20 && ram <= 60) {
    ramScore = 100;
  } else if (ram < 20) {
    ramScore = 70 + ram;
  } else {
    ramScore = Math.max(0, 100 - (ram - 60) * 2);
  }

  return (cpuScore * 0.5 + ramScore * 0.5);
}

function calculateAvailabilityScore(online: boolean, isPublic: boolean | undefined): number {
  if (!online) return 0;
  if (isPublic) return 100;
  return 70;
}

function calculateStorageScore(storageUsed: number | undefined, storageCommitted: number | undefined): number {
  if (!storageCommitted || storageCommitted <= 0) return 50;
  if (!storageUsed) return 30;

  const utilization = (storageUsed / storageCommitted) * 100;

  if (utilization >= 40 && utilization <= 80) return 100;
  if (utilization < 40) return 60 + utilization;
  return Math.max(50, 100 - (utilization - 80) * 2);
}

function getGrade(score: number): HealthScoreBreakdown['grade'] {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function calculateHealthScore(node: NodeMetrics): HealthScoreBreakdown {
  const availabilityScore = calculateAvailabilityScore(node.online, node.is_public);
  const performanceScore = calculatePerformanceScore(node.cpu_percent, node.ram_percent);
  const storageScore = calculateStorageScore(node.storage_used, node.storage_committed);
  const uptimeScore = calculateUptimeScore(node.uptime);

  const overall = Math.round(
    availabilityScore * WEIGHTS.availability +
    performanceScore * WEIGHTS.performance +
    storageScore * WEIGHTS.storage +
    uptimeScore * WEIGHTS.uptime
  );

  return {
    overall,
    grade: getGrade(overall),
    components: {
      availability: {
        score: Math.round(availabilityScore),
        weight: WEIGHTS.availability,
        raw: node.online,
      },
      performance: {
        score: Math.round(performanceScore),
        weight: WEIGHTS.performance,
        raw: {
          cpu: node.cpu_percent || 0,
          ram: node.ram_percent || 0,
        },
      },
      storage: {
        score: Math.round(storageScore),
        weight: WEIGHTS.storage,
        raw: node.storage_used || 0,
      },
      uptime: {
        score: Math.round(uptimeScore),
        weight: WEIGHTS.uptime,
        raw: node.uptime || 0,
      },
    },
  };
}

export function calculateNetworkHealthScores(nodes: NodeMetrics[]): Map<string, HealthScoreBreakdown> {
  const scores = new Map<string, HealthScoreBreakdown>();
  const scoreValues: number[] = [];

  nodes.forEach((node, index) => {
    const score = calculateHealthScore(node);
    scores.set(String(index), score);
    scoreValues.push(score.overall);
  });

  const sortedScores = [...scoreValues].sort((a, b) => a - b);

  scores.forEach((score) => {
    const rank = sortedScores.indexOf(score.overall);
    score.percentile = Math.round((rank / sortedScores.length) * 100);
  });

  return scores;
}

export function getHealthScoreColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 55) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function getGradeColor(grade: HealthScoreBreakdown['grade']): { bg: string; text: string } {
  switch (grade) {
    case 'A+':
    case 'A':
      return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' };
    case 'B+':
    case 'B':
      return { bg: 'rgba(132, 204, 22, 0.15)', text: '#84cc16' };
    case 'C+':
    case 'C':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' };
    case 'D':
      return { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' };
    case 'F':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' };
  }
}

export function formatUptime(seconds: number): string {
  if (seconds <= 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
