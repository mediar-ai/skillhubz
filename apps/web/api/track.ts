import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory stats (resets on cold start, but logs persist)
const stats: Record<string, number> = {};

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
      const { event, skill, cli_version } = req.body || {};

      if (!event) {
        return res.status(400).json({ error: 'Missing event' });
      }

      // Log the event (visible in Vercel logs)
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event,
        skill: skill || null,
        cli_version: cli_version || null,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
      }));

      // Update in-memory stats
      const key = skill ? `${event}:${skill}` : event;
      stats[key] = (stats[key] || 0) + 1;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Track error:', error);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  if (req.method === 'GET') {
    // Return current stats (for debugging)
    return res.status(200).json({ stats, note: 'Stats reset on cold start' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
