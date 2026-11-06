import type { VercelRequest, VercelResponse } from '@vercel/node';

const STATS_RAW_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/stats.json';

interface Stats {
  installs: Record<string, number>;
  stars: Record<string, number>;
  searches: Record<string, number>;
  lastUpdated: string;
}

// This project is paused. Stats are frozen: POST events are accepted so older
// CLI and web clients keep working, but nothing is written back to the repo.
async function getStats(): Promise<Stats> {
  const response = await fetch(STATS_RAW_URL + `?t=${Date.now()}`);
  if (!response.ok) {
    return { installs: {}, stars: {}, searches: {}, lastUpdated: new Date().toISOString() };
  }
  return response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return res.status(200).json({ success: true, persisted: false });
  }

  if (req.method === 'GET') {
    try {
      const stats = await getStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
