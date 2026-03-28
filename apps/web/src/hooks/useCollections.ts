import { useState, useEffect } from 'react';
import type { SkillPack } from '../types';

const COLLECTIONS_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/collections.json';

export function useCollections() {
  const [collections, setCollections] = useState<SkillPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await fetch(COLLECTIONS_URL);
        if (!res.ok) throw new Error('Failed to fetch collections');
        const data: SkillPack[] = await res.json();
        setCollections(data);
      } catch {
        // Silently fail — packs section just won't show
        setCollections([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCollections();
  }, []);

  return { collections, loading };
}

export function useCollection(id: string) {
  const [collection, setCollection] = useState<SkillPack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch(COLLECTIONS_URL);
        if (!res.ok) throw new Error('Failed to fetch collections');
        const data: SkillPack[] = await res.json();
        setCollection(data.find(c => c.id === id) || null);
      } catch {
        setCollection(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCollection();
  }, [id]);

  return { collection, loading };
}
