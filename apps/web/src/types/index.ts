export interface Skill {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  author: Author;
  code: string;
  language: 'yaml' | 'typescript' | 'javascript' | 'python';
  category: Category;
  tags: string[];
  installCount: number;
  stars: number;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
  verified?: boolean;
}

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  github?: string;
}

export interface Comment {
  id: string;
  skillId: string;
  author: Author;
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

export type Category =
  | 'browser-automation'
  | 'file-management'
  | 'data-entry'
  | 'web-scraping'
  | 'testing'
  | 'productivity'
  | 'integrations'
  | 'utilities'
  | 'marketing';

export const CATEGORIES: Record<Category, { label: string; icon: string; color: string }> = {
  'browser-automation': { label: 'Browser Automation', icon: 'Globe', color: '#00ffc8' },
  'file-management': { label: 'File Management', icon: 'Folder', color: '#ff8a50' },
  'data-entry': { label: 'Data Entry', icon: 'FormInput', color: '#a78bfa' },
  'web-scraping': { label: 'Web Scraping', icon: 'Database', color: '#f472b6' },
  'testing': { label: 'Testing', icon: 'FlaskConical', color: '#fbbf24' },
  'productivity': { label: 'Productivity', icon: 'Zap', color: '#34d399' },
  'integrations': { label: 'Integrations', icon: 'Puzzle', color: '#60a5fa' },
  'utilities': { label: 'Utilities', icon: 'Wrench', color: '#f87171' },
  'marketing': { label: 'Marketing & SEO', icon: 'Megaphone', color: '#ec4899' },
};
