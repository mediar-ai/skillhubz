import chalk from 'chalk';
import ora from 'ora';
import { track } from '../utils/tracking.js';

const REGISTRY_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/registry.json';

interface SearchOptions {
  category?: string;
  tag?: string;
}

interface Skill {
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  category: string;
  excerpt: string;
}

export async function search(query: string, options: SearchOptions): Promise<void> {
  const spinner = ora('Searching skills...').start();

  // Track search event
  track({ event: 'search', query });

  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) {
      throw new Error('Failed to fetch registry');
    }

    const registry: Skill[] = await res.json();

    // Filter by query
    let results = registry.filter((skill) => {
      const searchText = `${skill.name} ${skill.description} ${skill.tags.join(' ')}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    // Filter by category
    if (options.category) {
      results = results.filter((s) => s.category === options.category);
    }

    // Filter by tag
    if (options.tag) {
      results = results.filter((s) => s.tags.includes(options.tag));
    }

    spinner.stop();

    if (results.length === 0) {
      console.log(chalk.yellow(`No skills found for "${query}"`));
      console.log(chalk.gray('Try a different search term or browse at https://skillhu.bz'));
      return;
    }

    console.log(chalk.bold(`\nFound ${results.length} skill${results.length > 1 ? 's' : ''}:\n`));

    for (const skill of results) {
      console.log(
        chalk.cyan.bold(skill.name) +
        chalk.gray(` v${skill.version}`) +
        chalk.gray(` by ${skill.author}`)
      );
      console.log(chalk.white(`  ${skill.description}`));
      console.log(
        chalk.gray(`  Tags: `) +
        skill.tags.map((t) => chalk.yellow(t)).join(chalk.gray(', '))
      );
      console.log(chalk.gray(`  Install: `) + chalk.green(`npx skillhu install ${skill.name}`));
      console.log();
    }

  } catch (error) {
    spinner.fail(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
