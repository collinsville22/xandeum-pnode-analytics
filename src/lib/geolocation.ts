export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  ll: [number, number];
  timezone: string;
}

const geoCache = new Map<string, GeoLocation>();

const BATCH_SIZE = 100;

export async function getLocationFromIP(ip: string): Promise<GeoLocation | null> {
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.status === 'success') {
      const geo: GeoLocation = {
        country: data.country || 'Unknown',
        region: data.regionName || 'Unknown',
        city: data.city || 'Unknown',
        ll: [data.lat || 0, data.lon || 0],
        timezone: data.timezone || 'Unknown',
      };

      geoCache.set(ip, geo);
      return geo;
    }

    return null;
  } catch {
    return null;
  }
}

export async function batchGetLocations(ips: string[]): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();
  const uncachedIps: string[] = [];

  for (const ip of ips) {
    if (geoCache.has(ip)) {
      results.set(ip, geoCache.get(ip)!);
    } else {
      uncachedIps.push(ip);
    }
  }

  if (uncachedIps.length === 0) {
    return results;
  }

  const uniqueIps = [...new Set(uncachedIps)];

  for (let i = 0; i < uniqueIps.length; i += BATCH_SIZE) {
    const batch = uniqueIps.slice(i, i + BATCH_SIZE);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://ip-api.com/batch?fields=status,query,country,regionName,city,lat,lon,timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.status === 'success') {
            const geo: GeoLocation = {
              country: item.country || 'Unknown',
              region: item.regionName || 'Unknown',
              city: item.city || 'Unknown',
              ll: [item.lat || 0, item.lon || 0],
              timezone: item.timezone || 'Unknown',
            };
            geoCache.set(item.query, geo);
            results.set(item.query, geo);
          }
        }
      }
    } catch {
      continue;
    }
  }

  return results;
}

export async function getCountryFromIP(ip: string): Promise<string> {
  const geo = await getLocationFromIP(ip);
  return geo?.country || 'Unknown';
}

export function extractIP(address: string): string {
  return address.split(':')[0];
}

export function clearGeoCache(): void {
  geoCache.clear();
}
