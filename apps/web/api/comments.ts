import type { VercelRequest, VercelResponse } from '@vercel/node';

const COMMENTS_RAW_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/comments.json';

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
}

type CommentsData = Record<string, Comment[]>;

async function getComments(): Promise<CommentsData> {
  const response = await fetch(COMMENTS_RAW_URL + `?t=${Date.now()}`);
  if (!response.ok) {
    return {};
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

  // GET - fetch comments for a skill
  if (req.method === 'GET') {
    try {
      const { skill } = req.query;
      const comments = await getComments();

      if (skill && typeof skill === 'string') {
        return res.status(200).json(comments[skill] || []);
      }

      return res.status(200).json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  // This project is paused: comments are read-only.
  if (req.method === 'POST') {
    return res.status(410).json({ error: 'Comments are closed.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
