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
  | 'development'
  | 'devops'
  | 'data'
  | 'content'
  | 'creative'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'research'
  | 'communication'
  | 'integrations'
  | 'productivity'
  | 'testing'
  | 'security'
  | 'utilities';

export const CATEGORIES: Record<Category, { label: string; icon: string; color: string }> = {
  'development': { label: 'Development', icon: 'Code', color: '#06b6d4' },
  'devops': { label: 'DevOps', icon: 'GitBranch', color: '#f97316' },
  'data': { label: 'Data & Analytics', icon: 'BarChart', color: '#a78bfa' },
  'content': { label: 'Content', icon: 'FileText', color: '#3b82f6' },
  'creative': { label: 'Creative', icon: 'Palette', color: '#ec4899' },
  'marketing': { label: 'Marketing', icon: 'Megaphone', color: '#f43f5e' },
  'sales': { label: 'Sales', icon: 'DollarSign', color: '#22c55e' },
  'operations': { label: 'Operations', icon: 'Briefcase', color: '#64748b' },
  'research': { label: 'Research', icon: 'Search', color: '#6366f1' },
  'communication': { label: 'Communication', icon: 'MessageSquare', color: '#0ea5e9' },
  'integrations': { label: 'Integrations', icon: 'Puzzle', color: '#8b5cf6' },
  'productivity': { label: 'Productivity', icon: 'Zap', color: '#10b981' },
  'testing': { label: 'Testing & QA', icon: 'FlaskConical', color: '#f59e0b' },
  'security': { label: 'Security', icon: 'Shield', color: '#ef4444' },
  'utilities': { label: 'Utilities', icon: 'Wrench', color: '#71717a' },
};
