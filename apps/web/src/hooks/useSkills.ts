import { useState, useEffect } from 'react';
import type { Skill, Category } from '../types';

const REGISTRY_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/registry.json';
const SKILLS_BASE_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/skills';
const TRACKING_URL = 'https://skillhu.bz/api/track';

interface RegistrySkill {
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  category: string;
  excerpt: string;
  lines: number;
  size: number;
  updated: string;
}

interface TrackingStats {
  installs: Record<string, number>;
  stars: Record<string, number>;
  searches: Record<string, number>;
  lastUpdated: string;
}

function transformSkill(registrySkill: RegistrySkill, installs: Record<string, number>, stars: Record<string, number>): Skill {
  const installCount = installs[registrySkill.name] || 0;
  const starCount = stars[registrySkill.name] || 0;
  return {
    id: registrySkill.name,
    name: formatName(registrySkill.name),
    description: registrySkill.description,
    author: {
      id: registrySkill.author,
      name: registrySkill.author,
      github: registrySkill.author,
    },
    code: '', // Will be loaded on demand
    language: 'yaml',
    category: registrySkill.category as Category,
    tags: registrySkill.tags,
    installCount,
    stars: starCount,
    createdAt: registrySkill.updated,
    updatedAt: registrySkill.updated,
    verified: true,
    featured: ['gmail-reply', 'github-pr-review', 'slack-automator'].includes(registrySkill.name),
  };
}

function formatName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkills() {
      try {
        // Fetch registry and stats in parallel
        const [registryResponse, statsResponse] = await Promise.all([
          fetch(REGISTRY_URL),
          fetch(TRACKING_URL).catch(() => null), // Don't fail if stats unavailable
        ]);

        if (!registryResponse.ok) throw new Error('Failed to fetch registry');

        const registry: RegistrySkill[] = await registryResponse.json();

        // Get stats or default to empty
        let installs: Record<string, number> = {};
        let stars: Record<string, number> = {};
        if (statsResponse?.ok) {
          const trackingData: TrackingStats = await statsResponse.json();
          installs = trackingData.installs || {};
          stars = trackingData.stars || {};
        }

        const transformedSkills = registry.map(skill => transformSkill(skill, installs, stars));

        setSkills(transformedSkills);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    fetchSkills();
  }, []);

  return { skills, loading, error };
}

export function useSkill(id: string) {
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkill() {
      try {
        // Fetch registry, skill content, and stats in parallel
        const [registryResponse, skillResponse, statsResponse] = await Promise.all([
          fetch(REGISTRY_URL),
          fetch(`${SKILLS_BASE_URL}/${id}/skill.md`),
          fetch(TRACKING_URL).catch(() => null),
        ]);

        if (!registryResponse.ok) throw new Error('Failed to fetch registry');

        const registry: RegistrySkill[] = await registryResponse.json();
        const registrySkill = registry.find(s => s.name === id);

        if (!registrySkill) {
          setError('Skill not found');
          setLoading(false);
          return;
        }

        if (!skillResponse.ok) throw new Error('Failed to fetch skill content');
        const code = await skillResponse.text();

        // Get stats or default to empty
        let installs: Record<string, number> = {};
        let stars: Record<string, number> = {};
        if (statsResponse?.ok) {
          const trackingData: TrackingStats = await statsResponse.json();
          installs = trackingData.installs || {};
          stars = trackingData.stars || {};
        }

        const transformedSkill = transformSkill(registrySkill, installs, stars);
        transformedSkill.code = code;
        transformedSkill.longDescription = code;

        setSkill(transformedSkill);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    fetchSkill();
  }, [id]);

  return { skill, loading, error };
}

export const featuredSkillIds = ['gmail-reply', 'github-pr-review', 'slack-automator'];
