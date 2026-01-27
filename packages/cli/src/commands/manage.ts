import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readdirSync, unlinkSync, readFileSync } from 'fs';
import chalk from 'chalk';

export async function list(): Promise<void> {
  const globalDir = join(homedir(), '.claude', 'commands');
  const localDir = join(process.cwd(), '.claude', 'commands');

  const globalSkills = getSkillsInDir(globalDir);
  const localSkills = getSkillsInDir(localDir);

  if (globalSkills.length === 0 && localSkills.length === 0) {
    console.log(chalk.yellow('No skills installed'));
    console.log(chalk.gray('Install one with: npx skillhu install <name>'));
    return;
  }

  if (globalSkills.length > 0) {
    console.log(chalk.bold('\nGlobal skills') + chalk.gray(` (~/.claude/commands/)`));
    for (const skill of globalSkills) {
      console.log(`  ${chalk.cyan(skill.name)} ${chalk.gray(`- ${skill.title}`)}`);
    }
  }

  if (localSkills.length > 0) {
    console.log(chalk.bold('\nLocal skills') + chalk.gray(` (./.claude/commands/)`));
    for (const skill of localSkills) {
      console.log(`  ${chalk.cyan(skill.name)} ${chalk.gray(`- ${skill.title}`)}`);
    }
  }

  console.log();
}

interface SkillInfo {
  name: string;
  title: string;
  path: string;
}

function getSkillsInDir(dir: string): SkillInfo[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  const skills: SkillInfo[] = [];

  for (const file of files) {
    const name = file.replace('.md', '');
    const filePath = join(dir, file);

    // Try to get title from first line
    let title = '';
    try {
      const content = readFileSync(filePath, 'utf-8');
      const firstLine = content.split('\n')[0];
      if (firstLine.startsWith('# ')) {
        title = firstLine.slice(2).trim();
      }
    } catch {
      // Ignore read errors
    }

    skills.push({ name, title, path: filePath });
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export async function remove(name: string): Promise<void> {
  const globalPath = join(homedir(), '.claude', 'commands', `${name}.md`);
  const localPath = join(process.cwd(), '.claude', 'commands', `${name}.md`);

  let removed = false;

  if (existsSync(localPath)) {
    unlinkSync(localPath);
    console.log(chalk.green(`Removed local skill: ${chalk.cyan(name)}`));
    removed = true;
  }

  if (existsSync(globalPath)) {
    unlinkSync(globalPath);
    console.log(chalk.green(`Removed global skill: ${chalk.cyan(name)}`));
    removed = true;
  }

  if (!removed) {
    console.log(chalk.yellow(`Skill not found: ${name}`));
  }
}
