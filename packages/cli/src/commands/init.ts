import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { getUser } from './auth.js';

const SKILL_TEMPLATE = `# {{TITLE}}

{{DESCRIPTION}}

## Prerequisites

- Browser installed
- Logged into required service

## Instructions

1. First step
   - What to look for to confirm success

2. Second step
   - Include specific UI elements

3. Continue with steps...

4. Final step
   - Report results to user

## Error Handling

- If X happens, do Y
- When to stop and ask for help

## Notes

- Additional context
- Customization options
`;

export async function init(name?: string): Promise<void> {
  const user = getUser();

  // Get skill details
  const response = await prompts([
    {
      type: name ? null : 'text',
      name: 'name',
      message: 'Skill name (lowercase, hyphens):',
      initial: name,
      validate: (v) => /^[a-z0-9-]+$/.test(v) || 'Use lowercase letters, numbers, and hyphens only',
    },
    {
      type: 'text',
      name: 'title',
      message: 'Title:',
      initial: (prev: string) => {
        const n = prev || name || '';
        return n.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      },
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
    },
    {
      type: 'select',
      name: 'category',
      message: 'Category:',
      choices: [
        { title: 'Browser Automation', value: 'browser-automation' },
        { title: 'File Management', value: 'file-management' },
        { title: 'Data Entry', value: 'data-entry' },
        { title: 'Web Scraping', value: 'web-scraping' },
        { title: 'Testing', value: 'testing' },
        { title: 'Productivity', value: 'productivity' },
        { title: 'Integrations', value: 'integrations' },
        { title: 'Utilities', value: 'utilities' },
      ],
    },
    {
      type: 'text',
      name: 'tags',
      message: 'Tags (comma-separated):',
    },
  ]);

  if (!response.name && !name) {
    console.log(chalk.yellow('Cancelled'));
    return;
  }

  const skillName = response.name || name;
  const skillDir = join(process.cwd(), skillName);

  // Check if directory exists
  if (existsSync(skillDir)) {
    console.log(chalk.red(`Directory ${skillName} already exists`));
    return;
  }

  // Create directory
  mkdirSync(skillDir, { recursive: true });

  // Create skill.md
  const skillContent = SKILL_TEMPLATE
    .replace('{{TITLE}}', response.title || skillName)
    .replace('{{DESCRIPTION}}', response.description || 'Description of what this skill does.');

  writeFileSync(join(skillDir, 'skill.md'), skillContent);

  // Create manifest.json
  const manifest = {
    name: skillName,
    description: response.description || '',
    author: user || 'your-github-username',
    version: '1.0.0',
    tags: (response.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
    category: response.category || 'utilities',
    license: 'MIT',
  };

  writeFileSync(join(skillDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log();
  console.log(chalk.green(`Created skill in ${chalk.cyan(skillDir)}`));
  console.log();
  console.log('Files created:');
  console.log(`  ${chalk.gray('├─')} skill.md`);
  console.log(`  ${chalk.gray('└─')} manifest.json`);
  console.log();
  console.log('Next steps:');
  console.log(`  1. Edit ${chalk.cyan(`${skillName}/skill.md`)} with your instructions`);
  console.log(`  2. Run ${chalk.yellow(`npx skillhu publish ${skillName}`)}`);
  console.log();
}
