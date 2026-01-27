import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { track } from '../utils/tracking.js';

const REGISTRY_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/registry.json';
const SKILLS_BASE_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/skills';

interface InstallOptions {
  local?: boolean;
  force?: boolean;
}

export async function install(name: string, options: InstallOptions): Promise<void> {
  const spinner = ora(`Installing ${chalk.cyan(name)}...`).start();

  try {
    // Determine install directory
    const baseDir = options.local
      ? join(process.cwd(), '.claude', 'commands')
      : join(homedir(), '.claude', 'commands');

    // Ensure directory exists
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }

    const targetPath = join(baseDir, `${name}.md`);

    // Check if already exists
    if (existsSync(targetPath) && !options.force) {
      spinner.fail(`Skill ${chalk.cyan(name)} already exists. Use --force to overwrite.`);
      return;
    }

    // Fetch registry to validate skill exists
    spinner.text = 'Fetching registry...';
    const registryRes = await fetch(REGISTRY_URL);
    if (!registryRes.ok) {
      throw new Error('Failed to fetch registry');
    }
    const registry = await registryRes.json();

    const skill = registry.find((s: any) => s.name === name);
    if (!skill) {
      spinner.fail(`Skill ${chalk.cyan(name)} not found. Try ${chalk.yellow('skillhu search')} to find skills.`);
      return;
    }

    // Fetch skill content
    spinner.text = `Downloading ${name}...`;
    const skillUrl = `${SKILLS_BASE_URL}/${name}/skill.md`;
    const skillRes = await fetch(skillUrl);
    if (!skillRes.ok) {
      throw new Error(`Failed to fetch skill: ${skillRes.status}`);
    }
    const content = await skillRes.text();

    // Write skill file
    writeFileSync(targetPath, content);

    // Track install event
    track({ event: 'install', skill: name });

    spinner.succeed(
      `Installed ${chalk.cyan(name)} to ${chalk.gray(targetPath)}\n` +
      `  Run with: ${chalk.yellow(`/${name}`)}`
    );

  } catch (error) {
    spinner.fail(`Failed to install: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
