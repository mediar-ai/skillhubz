import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { track } from '../utils/tracking.js';

const REGISTRY_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/registry.json';
const SKILLS_BASE_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/skills';
const COLLECTIONS_URL = 'https://raw.githubusercontent.com/mediar-ai/skillhubz/master/packages/skills/collections.json';

interface InstallOptions {
  local?: boolean;
  force?: boolean;
  pack?: boolean;
}

interface CollectionSkill {
  name: string;
  role: string;
  description: string;
}

interface Collection {
  id: string;
  name: string;
  installCommand: string;
  skills: CollectionSkill[];
}

export async function install(name: string, options: InstallOptions): Promise<void> {
  if (options.pack) {
    return installPack(name, options);
  }
  return installSkill(name, options);
}

async function installPack(packId: string, options: InstallOptions): Promise<void> {
  const spinner = ora(`Fetching pack ${chalk.cyan(packId)}...`).start();

  try {
    const res = await fetch(COLLECTIONS_URL);
    if (!res.ok) throw new Error('Failed to fetch collections');
    const collections: Collection[] = await res.json();

    const pack = collections.find(c => c.id === packId);
    if (!pack) {
      spinner.fail(`Pack ${chalk.cyan(packId)} not found.`);
      return;
    }

    spinner.succeed(`Found pack ${chalk.cyan(pack.name)} (${pack.skills.length} skills)`);
    console.log();
    console.log(chalk.gray('  Install command:'));
    console.log(`  ${chalk.yellow(pack.installCommand)}`);
    console.log();
    console.log(chalk.gray('  Skills included:'));
    for (const skill of pack.skills) {
      console.log(`  ${chalk.cyan(`/${skill.name}`)} ${chalk.gray('—')} ${skill.role}`);
    }
    console.log();

    // Run the pack's native install command
    spinner.start('Installing pack...');
    const { execSync } = await import('child_process');
    execSync(pack.installCommand, { stdio: 'inherit' });

    track({ event: 'install_pack', skill: packId });

    spinner.succeed(
      `Pack ${chalk.cyan(pack.name)} installed successfully!\n` +
      `  ${pack.skills.length} skills are now available as slash commands.`
    );
  } catch (error) {
    spinner.fail(`Failed to install pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function installSkill(name: string, options: InstallOptions): Promise<void> {
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
