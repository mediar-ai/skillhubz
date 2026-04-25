import chalk from 'chalk';
import { execSync } from 'child_process';

const GH_INSTALL_HINT = 'Install gh from https://cli.github.com or set GITHUB_TOKEN env var.';

function ghTokenFromCli(): string | undefined {
  try {
    const out = execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] });
    const tok = out.toString().trim();
    return tok || undefined;
  } catch {
    return undefined;
  }
}

function ghLoginFromCli(token: string): string | undefined {
  try {
    const out = execSync(
      `curl -sH "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" https://api.github.com/user`,
      { stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const data = JSON.parse(out.toString());
    return typeof data.login === 'string' ? data.login : undefined;
  } catch {
    return undefined;
  }
}

export function getToken(): string | undefined {
  return process.env.GITHUB_TOKEN || ghTokenFromCli();
}

export function getUser(): string | undefined {
  const token = getToken();
  if (!token) return undefined;
  return ghLoginFromCli(token);
}

export async function login(): Promise<void> {
  console.log();
  console.log(chalk.bold('skillhu uses GitHub CLI auth.'));
  console.log();
  if (getToken()) {
    const user = getUser();
    console.log(chalk.green(`Already authenticated${user ? ` as ${chalk.cyan(user)}` : ''}.`));
    console.log(chalk.gray('Run `gh auth logout` to sign out.'));
    return;
  }
  console.log(chalk.yellow('No GitHub token found.'));
  console.log();
  console.log('Authenticate with one of:');
  console.log(`  ${chalk.cyan('gh auth login')}`);
  console.log(`  ${chalk.cyan('export GITHUB_TOKEN=ghp_...')}`);
  console.log();
  console.log(chalk.gray(GH_INSTALL_HINT));
}

export async function logout(): Promise<void> {
  console.log();
  console.log(chalk.bold('skillhu uses GitHub CLI auth.'));
  console.log(`Sign out with: ${chalk.cyan('gh auth logout')}`);
  console.log(chalk.gray('Or unset the GITHUB_TOKEN environment variable.'));
}

export async function whoami(): Promise<void> {
  const token = getToken();
  if (!token) {
    console.log(chalk.yellow('Not logged in.'));
    console.log(chalk.gray(`Run \`gh auth login\` or set GITHUB_TOKEN. ${GH_INSTALL_HINT}`));
    return;
  }
  const user = getUser();
  if (user) {
    console.log(chalk.green(`Logged in as ${chalk.cyan(user)}`));
  } else {
    console.log(chalk.yellow('Token present but GitHub /user check failed.'));
    console.log(chalk.gray('Token may be expired or lack `read:user` scope.'));
  }
}
