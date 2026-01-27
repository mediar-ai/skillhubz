import type { VercelRequest, VercelResponse } from '@vercel/node';

const STATS_RAW_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/stats.json';
const GITHUB_API_URL = 'https://api.github.com/repos/mediar-ai/skillhubz/contents/packages/skills/stats.json';

interface Stats {
  installs: Record<string, number>;
  stars: Record<string, number>;
  searches: Record<string, number>;
  lastUpdated: string;
}

async function getStats(): Promise<Stats> {
  const response = await fetch(STATS_RAW_URL + `?t=${Date.now()}`); // Cache bust
  if (!response.ok) {
    return { installs: {}, stars: {}, searches: {}, lastUpdated: new Date().toISOString() };
  }
  return response.json();
}

async function updateStats(stats: Stats): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN not configured');
    return false;
  }

  try {
    // Get current file SHA (required for update)
    const getResponse = await fetch(GITHUB_API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      console.error('Failed to get file SHA:', await getResponse.text());
      return false;
    }

    const fileData = await getResponse.json();
    const sha = fileData.sha;

    // Update file
    stats.lastUpdated = new Date().toISOString();
    const content = Buffer.from(JSON.stringify(stats, null, 2) + '\n').toString('base64');

    const updateResponse = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update stats: ${new Date().toISOString()}`,
        content,
        sha,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update stats:', await updateResponse.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating stats:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { event, skill, query, cli_version } = req.body || {};

      if (!event) {
        return res.status(400).json({ error: 'Missing event' });
      }

      // Log the event (visible in Vercel logs)
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event,
        skill: skill || null,
        query: query || null,
        cli_version: cli_version || null,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
      }));

      // Update persistent stats
      const stats = await getStats();

      if (event === 'install' && skill) {
        stats.installs[skill] = (stats.installs[skill] || 0) + 1;
      } else if (event === 'star' && skill) {
        stats.stars = stats.stars || {};
        stats.stars[skill] = (stats.stars[skill] || 0) + 1;
      } else if (event === 'search' && query) {
        stats.searches[query] = (stats.searches[query] || 0) + 1;
      }

      const updated = await updateStats(stats);

      return res.status(200).json({ success: true, persisted: updated });
    } catch (error) {
      console.error('Track error:', error);
      return res.status(500).json({ error: 'Internal error' });
    }
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
