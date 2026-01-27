import type { VercelRequest, VercelResponse } from '@vercel/node';

const COMMENTS_RAW_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/comments.json';
const GITHUB_API_URL = 'https://api.github.com/repos/mediar-ai/skillhubz/contents/packages/skills/comments.json';

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

async function updateComments(comments: CommentsData): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN not configured');
    return false;
  }

  try {
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

    const content = Buffer.from(JSON.stringify(comments, null, 2) + '\n').toString('base64');

    const updateResponse = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update comments: ${new Date().toISOString()}`,
        content,
        sha,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update comments:', await updateResponse.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating comments:', error);
    return false;
  }
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

  // POST - add comment or like
  if (req.method === 'POST') {
    try {
      const { action, skill, author, content, commentId } = req.body || {};

      if (!action || !skill) {
        return res.status(400).json({ error: 'Missing action or skill' });
      }

      const comments = await getComments();

      if (!comments[skill]) {
        comments[skill] = [];
      }

      if (action === 'add') {
        if (!author || !content) {
          return res.status(400).json({ error: 'Missing author or content' });
        }

        const newComment: Comment = {
          id: `c${Date.now()}`,
          author: author.slice(0, 50), // Limit author name length
          content: content.slice(0, 500), // Limit content length
          createdAt: new Date().toISOString(),
          likes: 0,
        };

        comments[skill].unshift(newComment); // Add to beginning

        // Limit to 50 comments per skill
        if (comments[skill].length > 50) {
          comments[skill] = comments[skill].slice(0, 50);
        }

        const updated = await updateComments(comments);
        return res.status(200).json({ success: true, persisted: updated, comment: newComment });
      }

      if (action === 'like') {
        if (!commentId) {
          return res.status(400).json({ error: 'Missing commentId' });
        }

        const comment = comments[skill].find((c: Comment) => c.id === commentId);
        if (comment) {
          comment.likes += 1;
          const updated = await updateComments(comments);
          return res.status(200).json({ success: true, persisted: updated, likes: comment.likes });
        }

        return res.status(404).json({ error: 'Comment not found' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
      console.error('Comment action error:', error);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
