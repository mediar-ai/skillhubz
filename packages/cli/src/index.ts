#!/usr/bin/env node

import { program } from 'commander';
import { install } from './commands/install.js';
import { search } from './commands/search.js';
import { publish } from './commands/publish.js';
import { login, logout, whoami } from './commands/auth.js';
import { init } from './commands/init.js';
import { list, remove } from './commands/manage.js';

program
  .name('skillhu')
  .description('CLI for skillhu.bz - Install, search, and publish Claude Code skills')
  .version('0.1.0');

// Install a skill
program
  .command('install <name>')
  .alias('i')
  .description('Install a skill to ~/.claude/commands/')
  .option('-l, --local', 'Install to local .claude/commands/ instead of global')
  .option('-f, --force', 'Overwrite existing skill')
  .action(install);

// Search for skills
program
  .command('search <query>')
  .alias('s')
  .description('Search for skills')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --tag <tag>', 'Filter by tag')
  .action(search);

// Publish a skill
program
  .command('publish [path]')
  .alias('p')
  .description('Publish a skill to skillhu.bz')
  .action(publish);

// Initialize a new skill
program
  .command('init [name]')
  .description('Create a new skill from template')
  .action(init);

// Authentication
program
  .command('login')
  .description('Login with GitHub')
  .action(login);

program
  .command('logout')
  .description('Logout from GitHub')
  .action(logout);

program
  .command('whoami')
  .description('Show current logged in user')
  .action(whoami);

// Manage installed skills
program
  .command('list')
  .alias('ls')
  .description('List installed skills')
  .action(list);

program
  .command('remove <name>')
  .alias('rm')
  .description('Remove an installed skill')
  .action(remove);

// Open website
program
  .command('browse')
  .description('Open skillhu.bz in browser')
  .action(async () => {
    const { default: open } = await import('open');
    await open('https://skillhu.bz');
  });

program.parse();
