import { existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { Octokit } from 'octokit';
import { getToken, getUser, login } from './auth.js';

const REPO_OWNER = 'mediar-ai';
const REPO_NAME = 'skills';

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

  // Validate skill structure
  const skillPath = join(skillDir, 'skill.md');
  const manifestPath = join(skillDir, 'manifest.json');

  if (!existsSync(skillPath)) {
    console.log(chalk.red('skill.md not found'));
    console.log(chalk.gray('Run from a skill directory or specify path: npx skillhu publish ./my-skill'));
    return;
  }

  if (!existsSync(manifestPath)) {
    console.log(chalk.red('manifest.json not found'));
    console.log(chalk.gray('Create one with: npx skillhu init'));
    return;
  }

  // Parse manifest
  let manifest: Manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    console.log(chalk.red('Invalid manifest.json'));
    return;
  }

  // Validate manifest
  if (!manifest.name || !manifest.description || !manifest.author) {
    console.log(chalk.red('manifest.json missing required fields: name, description, author'));
    return;
  }

  // Check auth
  let token = getToken();
  let user = getUser();

  if (!token) {
    console.log(chalk.yellow('Not logged in. Starting authentication...'));
    console.log();
    await login();
    token = getToken();
    user = getUser();

    if (!token) {
      return;
    }
  }

  // Update manifest author to match logged in user
  if (manifest.author !== user) {
    console.log(chalk.yellow(`Updating author from "${manifest.author}" to "${user}"`));
    manifest.author = user!;
  }

  const skillContent = readFileSync(skillPath, 'utf-8');
  const manifestContent = JSON.stringify(manifest, null, 2);

  const spinner = ora('Publishing skill...').start();

  try {
    const octokit = new Octokit({ auth: token });

    // Check if user has a fork
    spinner.text = 'Checking repository access...';

    let forkOwner = user!;
    let baseBranch = 'main';

    try {
      // Try to access main repo directly (for maintainers)
      await octokit.rest.repos.get({
        owner: REPO_OWNER,
        repo: REPO_NAME,
      });

      // Check if user has write access
      const { data: permission } = await octokit.rest.repos.getCollaboratorPermissionLevel({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        username: user!,
      });

      if (['admin', 'write'].includes(permission.permission)) {
        forkOwner = REPO_OWNER;
      }
    } catch {
      // User doesn't have direct access, need to fork
    }

    // Fork if needed
    if (forkOwner !== REPO_OWNER) {
      spinner.text = 'Forking repository...';

      try {
        await octokit.rest.repos.createFork({
          owner: REPO_OWNER,
          repo: REPO_NAME,
        });
        // Wait for fork to be ready
        await sleep(2000);
      } catch (error: any) {
        // Fork might already exist
        if (error.status !== 422) {
          throw error;
        }
      }
    }

    // Get base branch SHA
    spinner.text = 'Creating branch...';

    const { data: ref } = await octokit.rest.git.getRef({
      owner: forkOwner,
      repo: REPO_NAME,
      ref: `heads/${baseBranch}`,
    });

    // Create new branch
    const branchName = `skill/${manifest.name}-${Date.now()}`;

    await octokit.rest.git.createRef({
      owner: forkOwner,
      repo: REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });

    // Create/update files
    spinner.text = 'Uploading files...';

    // Upload skill.md
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: forkOwner,
      repo: REPO_NAME,
      path: `skills/${manifest.name}/skill.md`,
      message: `Add skill: ${manifest.name}`,
      content: Buffer.from(skillContent).toString('base64'),
      branch: branchName,
    });

    // Upload manifest.json
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: forkOwner,
      repo: REPO_NAME,
      path: `skills/${manifest.name}/manifest.json`,
      message: `Add manifest for: ${manifest.name}`,
      content: Buffer.from(manifestContent).toString('base64'),
      branch: branchName,
    });

    // Create PR
    spinner.text = 'Creating pull request...';

    const { data: pr } = await octokit.rest.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `Add skill: ${manifest.name}`,
      body: `## New Skill: ${manifest.name}

${manifest.description}

**Category:** ${manifest.category}
**Tags:** ${manifest.tags.join(', ')}
**Author:** @${manifest.author}

---
*Submitted via \`npx skillhu publish\`*`,
      head: forkOwner === REPO_OWNER ? branchName : `${forkOwner}:${branchName}`,
      base: baseBranch,
    });

    spinner.succeed(chalk.green('Skill published!'));
    console.log();
    console.log(`  PR: ${chalk.cyan(pr.html_url)}`);
    console.log();
    console.log(chalk.gray('Your skill will be auto-merged if it passes validation.'));

  } catch (error: any) {
    spinner.fail(`Failed to publish: ${error.message}`);

    if (error.status === 422) {
      console.log(chalk.gray('A skill with this name may already exist, or a PR is pending.'));
    }

    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
