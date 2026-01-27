import Conf from 'conf';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { Octokit } from 'octokit';

const config = new Conf({ projectName: 'skillhu' });
const CLIENT_ID = 'Ov23liXXXXXXXXXXXXXX'; // Replace with actual GitHub OAuth App client ID

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export async function login(): Promise<void> {
  const existingToken = config.get('github_token') as string | undefined;

  if (existingToken) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'Already logged in. Login again?',
      initial: false,
    });

    if (!overwrite) {
      return;
    }
  }

  const spinner = ora('Starting GitHub authentication...').start();

  try {
    // Request device code
    const deviceRes = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        scope: 'public_repo',
      }),
    });

    if (!deviceRes.ok) {
      throw new Error('Failed to start authentication');
    }

    const deviceData: DeviceCodeResponse = await deviceRes.json();

    spinner.stop();

    console.log();
    console.log(chalk.bold('GitHub Authentication'));
    console.log();
    console.log(`1. Open: ${chalk.cyan(deviceData.verification_uri)}`);
    console.log(`2. Enter code: ${chalk.yellow.bold(deviceData.user_code)}`);
    console.log();

    // Try to open browser
    try {
      const { default: open } = await import('open');
      await open(deviceData.verification_uri);
      console.log(chalk.gray('(Browser opened automatically)'));
    } catch {
      // Browser open failed, user will do it manually
    }

    const pollSpinner = ora('Waiting for authorization...').start();

    // Poll for token
    const token = await pollForToken(deviceData.device_code, deviceData.interval);

    // Get user info
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    // Save token
    config.set('github_token', token);
    config.set('github_user', user.login);

    pollSpinner.succeed(`Logged in as ${chalk.cyan(user.login)}`);

  } catch (error) {
    spinner.fail(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function pollForToken(deviceCode: string, interval: number): Promise<string> {
  const maxAttempts = 60; // 5 minutes max with 5s interval

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(interval * 1000);

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const data = await res.json();

    if (data.access_token) {
      return data.access_token;
    }

    if (data.error === 'authorization_pending') {
      continue;
    }

    if (data.error === 'slow_down') {
      interval = data.interval || interval + 5;
      continue;
    }

    if (data.error === 'expired_token') {
      throw new Error('Authentication expired. Please try again.');
    }

    if (data.error === 'access_denied') {
      throw new Error('Access denied. Please try again and approve the request.');
    }
  }

  throw new Error('Authentication timed out');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function logout(): Promise<void> {
  const user = config.get('github_user') as string | undefined;

  if (!user) {
    console.log(chalk.yellow('Not logged in'));
    return;
  }

  config.delete('github_token');
  config.delete('github_user');

  console.log(chalk.green(`Logged out from ${user}`));
}

export async function whoami(): Promise<void> {
  const token = config.get('github_token') as string | undefined;
  const user = config.get('github_user') as string | undefined;

  if (!token || !user) {
    console.log(chalk.yellow('Not logged in'));
    console.log(chalk.gray('Run: npx skillhu login'));
    return;
  }

  // Verify token is still valid
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.users.getAuthenticated();
    console.log(chalk.green(`Logged in as ${chalk.cyan(data.login)}`));
  } catch {
    console.log(chalk.yellow('Session expired. Please login again.'));
    config.delete('github_token');
    config.delete('github_user');
  }
}

export function getToken(): string | undefined {
  return config.get('github_token') as string | undefined;
}

export function getUser(): string | undefined {
  return config.get('github_user') as string | undefined;
}
