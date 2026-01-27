import { useState, useEffect } from 'react';
import type { Skill, Category } from '../types';

const REGISTRY_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/registry.json';
const SKILLS_BASE_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/skills';

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

function transformSkill(registrySkill: RegistrySkill): Skill {
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
    installCount: Math.floor(Math.random() * 1000) + 100, // Placeholder
    stars: Math.floor(Math.random() * 200) + 10, // Placeholder
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
        const response = await fetch(REGISTRY_URL);
        if (!response.ok) throw new Error('Failed to fetch registry');

        const registry: RegistrySkill[] = await response.json();
        const transformedSkills = registry.map(transformSkill);

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
        // First fetch registry to get skill metadata
        const registryResponse = await fetch(REGISTRY_URL);
        if (!registryResponse.ok) throw new Error('Failed to fetch registry');

        const registry: RegistrySkill[] = await registryResponse.json();
        const registrySkill = registry.find(s => s.name === id);

        if (!registrySkill) {
          setError('Skill not found');
          setLoading(false);
          return;
        }

        // Fetch the actual skill.md content
        const skillUrl = `${SKILLS_BASE_URL}/${id}/skill.md`;
        const skillResponse = await fetch(skillUrl);
        if (!skillResponse.ok) throw new Error('Failed to fetch skill content');

        const code = await skillResponse.text();

        const transformedSkill = transformSkill(registrySkill);
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
