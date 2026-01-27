import { existsSync, readFileSync } from 'fs';
import { join, basename, dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';

const SUBMIT_API_URL = 'https://skillhu.bz/api/submit';

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

  const spinner = ora('Publishing to skillhu.bz...').start();

  try {
    const response = await fetch(SUBMIT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      spinner.succeed(chalk.green('Skill published!'));
      console.log();
      console.log(`  URL: ${chalk.cyan(data.skill.url)}`);
      console.log();
      console.log(chalk.gray('Your skill is now live and available to everyone.'));
    } else {
      spinner.fail(chalk.red(`Failed to publish: ${data.error || 'Unknown error'}`));

      if (data.error?.includes('already exists')) {
        console.log();
        console.log(chalk.gray('A skill with this name already exists. Try a different name.'));
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
