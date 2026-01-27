import { useState, useEffect, useCallback } from 'react';

const COMMENTS_URL = 'https://skillhu.bz/api/comments';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
}

export function useComments(skillId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        const response = await fetch(`${COMMENTS_URL}?skill=${skillId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        setComments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (skillId) {
      fetchComments();
    }
  }, [skillId]);

  const addComment = useCallback(async (author: string, content: string): Promise<boolean> => {
    try {
      const response = await fetch(COMMENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', skill: skillId, author, content }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.comment) {
        setComments(prev => [data.comment, ...prev]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [skillId]);

  const likeComment = useCallback(async (commentId: string): Promise<boolean> => {
    // Check if already liked (stored in localStorage)
    const likeKey = `liked-${commentId}`;
    if (localStorage.getItem(likeKey) === 'true') {
      return false;
    }

    // Optimistic update
    setComments(prev =>
      prev.map(c => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
    );
    localStorage.setItem(likeKey, 'true');

    try {
      const response = await fetch(COMMENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', skill: skillId, commentId }),
      });

      if (!response.ok) {
        // Revert on failure
        setComments(prev =>
          prev.map(c => (c.id === commentId ? { ...c, likes: c.likes - 1 } : c))
        );
        localStorage.removeItem(likeKey);
        return false;
      }

      return true;
    } catch {
      // Revert on error
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, likes: c.likes - 1 } : c))
      );
      localStorage.removeItem(likeKey);
      return false;
    }
  }, [skillId]);

  const hasLiked = useCallback((commentId: string): boolean => {
    return localStorage.getItem(`liked-${commentId}`) === 'true';
  }, []);

  return { comments, loading, error, addComment, likeComment, hasLiked };
}
