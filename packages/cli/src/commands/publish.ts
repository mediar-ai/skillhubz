import { existsSync, readFileSync } from 'fs';
import { join, basename, dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { getToken } from './auth.js';

// Hit skl.bz directly. skillhu.bz 308-redirects here, and both fetch and curl
// strip the Authorization header on cross-origin redirects, which would silently
// downgrade an authenticated submit to anonymous.
const SUBMIT_API_URL = 'https://skl.bz/api/submit';

interface Manifest {
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  category: string;
}

export async function publish(path?: string): Promise<void> {
  // Determine skill directory
  const skillDir = path ? join(process.cwd(), path) : process.cwd();

  // Check for skill.md (primary) or manifest.json (legacy)
  const skillPath = join(skillDir, 'skill.md');
  const manifestPath = join(skillDir, 'manifest.json');

  if (!existsSync(skillPath)) {
    console.log(chalk.red('skill.md not found'));
    console.log(chalk.gray('Run from a skill directory or specify path: npx skillhu publish ./my-skill'));
    console.log();
    console.log(chalk.gray('Create a new skill with: npx skillhu init my-skill'));
    return;
  }

  // Read skill content
  const skillContent = readFileSync(skillPath, 'utf-8');

  // Extract title from markdown (first # heading)
  const titleMatch = skillContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : basename(skillDir);

  // Extract first paragraph as description
  const lines = skillContent.split('\n');
  let description = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#')) {
      description = line;
      break;
    }
  }

  // Try to read manifest for additional metadata (optional)
  let manifest: Partial<Manifest> = {};
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    } catch {
      // Ignore invalid manifest
    }
  }

  // Use manifest values or defaults
  const name = manifest.name || title;
  const skillDescription = manifest.description || description || 'No description provided';
  const category = manifest.category || 'utilities';
  const tags = manifest.tags || [];
  const author = manifest.author || 'anonymous';

  console.log();
  console.log(chalk.bold('Publishing skill:'));
  console.log(`  Name: ${chalk.cyan(name)}`);
  console.log(`  Category: ${chalk.gray(category)}`);
  console.log(`  Author: ${chalk.gray(author)}`);
  if (tags.length > 0) {
    console.log(`  Tags: ${chalk.gray(tags.join(', '))}`);
  }
  console.log();

  const token = getToken();
  if (!token) {
    console.log(chalk.red('Not authenticated.'));
    console.log();
    console.log(`Authenticate with: ${chalk.cyan('gh auth login')}`);
    console.log(`Or set: ${chalk.cyan('export GITHUB_TOKEN=ghp_...')}`);
    console.log();
    console.log(chalk.gray('Install gh from https://cli.github.com if needed.'));
    process.exit(1);
  }

  const spinner = ora('Publishing to skillhu.bz...').start();

  try {
    const response = await fetch(SUBMIT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        description: skillDescription,
        category,
        tags,
        content: skillContent,
        authorGithub: author,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      spinner.succeed(chalk.green(data.updated ? 'Skill updated!' : 'Skill published!'));
      console.log();
      console.log(`  URL: ${chalk.cyan(data.skill.url)}`);
      console.log();
      console.log(chalk.gray(data.updated ? 'Your skill has been updated.' : 'Your skill is now live and available to everyone.'));
    } else {
      spinner.fail(chalk.red(`Failed to publish: ${data.error || 'Unknown error'}`));

      if (response.status === 403) {
        console.log();
        console.log(chalk.gray('This skill belongs to another author. Check the author field in manifest.json.'));
      }

      process.exit(1);
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`Network error: ${error.message}`));
    console.log();
    console.log(chalk.gray('Please check your internet connection and try again.'));
    process.exit(1);
  }
}
