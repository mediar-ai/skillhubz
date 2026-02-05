import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_API_URL = 'https://api.github.com/repos/mediar-ai/skillhubz/contents';
const REGISTRY_PATH = 'packages/skills/registry.json';
const SKILLS_PATH = 'packages/skills/skills';

interface SubmitRequest {
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  authorName?: string;
  authorGithub?: string;
}

interface RegistryEntry {
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractExcerpt(content: string): string {
  // Get first paragraph after the title
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      return trimmed.slice(0, 150);
    }
  }
  return '';
}

async function getFileContent(path: string, token: string): Promise<{ content: string; sha: string } | null> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get file: ${response.status}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, sha: data.sha };
  } catch (error) {
    console.error('Error getting file:', error);
    return null;
  }
}

async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
  token: string,
  sha?: string
): Promise<boolean> {
  try {
    const body: Record<string, string> = {
      message,
      content: Buffer.from(content).toString('base64'),
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(`${GITHUB_API_URL}/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Failed to create/update file:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating/updating file:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { name, description, category, tags, content, authorName, authorGithub } = req.body as SubmitRequest;

    // Validate required fields
    if (!name || !description || !category || !content) {
      return res.status(400).json({ error: 'Missing required fields: name, description, category, content' });
    }

    // Normalize category (lowercase, hyphenated)
    const normalizedCategory = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Generate slug from name
    const slug = slugify(name);
    if (!slug) {
      return res.status(400).json({ error: 'Invalid skill name' });
    }

    // Check if skill already exists
    const existingSkill = await getFileContent(`${SKILLS_PATH}/${slug}/skill.md`, token);
    if (existingSkill) {
      return res.status(409).json({ error: 'A skill with this name already exists' });
    }

    // Get current registry
    const registryData = await getFileContent(REGISTRY_PATH, token);
    if (!registryData) {
      return res.status(500).json({ error: 'Failed to read registry' });
    }

    const registry: RegistryEntry[] = JSON.parse(registryData.content);

    // Create new registry entry
    const author = authorGithub || authorName || 'anonymous';
    const newEntry: RegistryEntry = {
      name: slug,
      description: description.slice(0, 200),
      author,
      version: '1.0.0',
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      category: normalizedCategory,
      excerpt: extractExcerpt(content),
      lines: content.split('\n').length,
      size: content.length,
      updated: new Date().toISOString(),
    };

    // Add to registry
    registry.push(newEntry);

    // Create skill.md file
    const skillCreated = await createOrUpdateFile(
      `${SKILLS_PATH}/${slug}/skill.md`,
      content,
      `Add skill: ${slug}`,
      token
    );

    if (!skillCreated) {
      return res.status(500).json({ error: 'Failed to create skill file' });
    }

    // Update registry
    const registryUpdated = await createOrUpdateFile(
      REGISTRY_PATH,
      JSON.stringify(registry, null, 2) + '\n',
      `Add ${slug} to registry`,
      token,
      registryData.sha
    );

    if (!registryUpdated) {
      return res.status(500).json({ error: 'Failed to update registry' });
    }

    return res.status(200).json({
      success: true,
      skill: {
        slug,
        url: `https://skillhu.bz/skill/${slug}`,
      },
    });
  } catch (error) {
    console.error('Submit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
