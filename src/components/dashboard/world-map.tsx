'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { usePreferences } from '@/contexts/preferences-context';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface NodeMarker {
  coordinates: [number, number];
  status: 'public' | 'private' | 'offline';
  address: string;
}

interface Cluster {
  coordinates: [number, number];
  nodes: NodeMarker[];
  counts: { public: number; private: number; offline: number };
}

interface WorldMapProps {
  nodes: NodeMarker[];
  onNodeClick?: (address: string) => void;
  showConnections?: boolean;
  showClusters?: boolean;
}

function distance(a: [number, number], b: [number, number]): number {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function clusterNodes(nodes: NodeMarker[], threshold: number): Cluster[] {
  const clusters: Cluster[] = [];
  const assigned = new Set<number>();

  nodes.forEach((node, i) => {
    if (assigned.has(i)) return;

    const cluster: Cluster = {
      coordinates: [...node.coordinates] as [number, number],
      nodes: [node],
      counts: { public: 0, private: 0, offline: 0 },
    };
    cluster.counts[node.status]++;
    assigned.add(i);

    nodes.forEach((other, j) => {
      if (i === j || assigned.has(j)) return;
      if (distance(node.coordinates, other.coordinates) < threshold) {
        cluster.nodes.push(other);
        cluster.counts[other.status]++;
        assigned.add(j);
      }
    });

    if (cluster.nodes.length > 1) {
      const avgLng = cluster.nodes.reduce((sum, n) => sum + n.coordinates[0], 0) / cluster.nodes.length;
      const avgLat = cluster.nodes.reduce((sum, n) => sum + n.coordinates[1], 0) / cluster.nodes.length;
      cluster.coordinates = [avgLng, avgLat];
    }

    clusters.push(cluster);
  });

  return clusters;
}

export function WorldMap({ nodes, onNodeClick, showConnections = true, showClusters = true }: WorldMapProps) {
  const [zoom, setZoom] = useState(1.3);
  const [center, setCenter] = useState<[number, number]>([20, 30]);
    const [animatedConnections, setAnimatedConnections] = useState<number[]>([]);
  const { resolvedTheme } = usePreferences();

  const statusColors = {
    public: '#22c55e',
    private: '#f59e0b',
    offline: '#ef4444',
  };

  const bgMap = resolvedTheme === 'light' ? '#e8e8f0' : '#1a1a2e';
  const landColor = resolvedTheme === 'light' ? '#d0d0d8' : '#3a3a4a';
  const landStroke = resolvedTheme === 'light' ? '#b0b0b8' : '#4a4a5a';
  const borderColor = resolvedTheme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const textPrimary = resolvedTheme === 'light' ? '#1a1a1a' : '#ffffff';
  const textSecondary = resolvedTheme === 'light' ? '#666666' : '#888888';
  const bgPanel = resolvedTheme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(26, 26, 26, 0.95)';

  const clusterThreshold = 15 / zoom;

  const clusters = useMemo(() => {
    if (!showClusters || zoom > 3) return null;
    return clusterNodes(nodes, clusterThreshold);
  }, [nodes, clusterThreshold, showClusters, zoom]);

  const locationCounts = useMemo(() => {
    const counts = new Set(nodes.map((n) => `${n.coordinates[0]},${n.coordinates[1]}`));
    return counts.size;
  }, [nodes]);

  const connections = useMemo(() => {
    if (!showConnections || nodes.length < 2) return [];
    const onlineNodes = nodes.filter(n => n.status !== 'offline');
    const conns: Array<{ from: [number, number]; to: [number, number] }> = [];

    for (let i = 0; i < Math.min(8, onlineNodes.length); i++) {
      const from = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
      const to = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
      if (from !== to) {
        conns.push({ from: from.coordinates, to: to.coordinates });
      }
    }
    return conns;
  }, [nodes, showConnections]);

  useEffect(() => {
    if (!showConnections) return;
    const interval = setInterval(() => {
      setAnimatedConnections(prev => {
        const next = prev.map(v => (v + 0.02) % 1);
        if (Math.random() > 0.7) {
          return [...next.slice(-8), 0];
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [showConnections]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.4, 6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.4, 1));
  const handleReset = () => { setZoom(1.3); setCenter([20, 30]); };

  const renderMarkers = () => {
    if (clusters && zoom <= 3) {
      return clusters.map((cluster, idx) => {
        const total = cluster.nodes.length;
        const radius = Math.min(8 + total * 2, 24);
        const mainColor = cluster.counts.public > 0 ? statusColors.public :
                          cluster.counts.private > 0 ? statusColors.private : statusColors.offline;

        return (
          <Marker
            key={`cluster-${idx}`}
            coordinates={cluster.coordinates}
          >
            {(cluster.counts.public > 0 || cluster.counts.private > 0) && (
              <circle
                r={radius + 4}
                fill={mainColor}
                opacity={0.2}
                className="pulse-ring"
              />
            )}
            <circle
              r={radius}
              fill={mainColor}
              stroke={bgMap}
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
              opacity={0.9}
            />
            {total > 1 && (
              <text
                textAnchor="middle"
                y={4}
                style={{
                  fontSize: total > 99 ? 8 : 10,
                  fontWeight: 700,
                  fill: '#fff',
                  pointerEvents: 'none',
                }}
              >
                {total}
              </text>
            )}
          </Marker>
        );
      });
    }

    return nodes.map((node, idx) => (
      <Marker
        key={idx}
        coordinates={node.coordinates}
        onClick={() => onNodeClick?.(node.address)}
      >
        {node.status !== 'offline' && (
          <circle
            r={8}
            fill={statusColors[node.status]}
            opacity={0.3}
            className="pulse-ring"
          />
        )}
        <circle
          r={4}
          fill={statusColors[node.status]}
          stroke={bgMap}
          strokeWidth={1}
          style={{ cursor: 'pointer' }}
          opacity={0.9}
        />
      </Marker>
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${borderColor}` }}>
        <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600 }}>Global Node Distribution</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={handleZoomOut} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: resolvedTheme === 'light' ? '#f0f0f0' : '#252525', border: `1px solid ${borderColor}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 16 }}>
            -
          </button>
          <span style={{ minWidth: 50, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: resolvedTheme === 'light' ? '#f0f0f0' : '#252525', border: `1px solid ${borderColor}`, borderRadius: 6, color: textPrimary, fontSize: 12, fontWeight: 600 }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: resolvedTheme === 'light' ? '#f0f0f0' : '#252525', border: `1px solid ${borderColor}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 16 }}>
            +
          </button>
          <button onClick={handleReset} style={{ height: 32, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: resolvedTheme === 'light' ? '#f0f0f0' : '#252525', border: `1px solid ${borderColor}`, borderRadius: 6, cursor: 'pointer', color: textSecondary, fontSize: 12, fontWeight: 600 }}>
            Reset
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', background: bgMap, minHeight: 350 }}>
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: bgPanel, border: `1px solid ${borderColor}`, borderRadius: 4 }}>
          <span style={{ color: textSecondary, fontSize: 11 }}>Locations</span>
          <span style={{ color: textPrimary, fontSize: 12, fontWeight: 600 }}>{locationCounts}</span>
        </div>


        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 140 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ coordinates, zoom: z }) => {
              setCenter(coordinates as [number, number]);
              setZoom(z);
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={landColor}
                    stroke={landStroke}
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: resolvedTheme === 'light' ? '#c0c0c8' : '#4a4a5a' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {renderMarkers()}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '10px 16px', borderTop: `1px solid ${borderColor}` }}>
        {[
          { label: 'Public RPC', color: '#22c55e' },
          { label: 'Private', color: '#f59e0b' },
          { label: 'Offline', color: '#ef4444' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
            <span style={{ color: textSecondary, fontSize: 11, fontWeight: 600 }}>{item.label}</span>
          </div>
        ))}
        {clusters && zoom <= 3 && (
          <span style={{ color: textSecondary, fontSize: 10, marginLeft: 8 }}>
            (Zoom in to see individual nodes)
          </span>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        .pulse-ring {
          animation: pulse-ring 2s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
