import type { Skill } from '../types';

export const mockSkills: Skill[] = [
  {
    id: 'gmail-auto-reply',
    name: 'Gmail Auto-Reply Bot',
    description: 'Automatically detect and reply to emails matching specific patterns with customizable templates.',
    longDescription: `A powerful automation skill that monitors your Gmail inbox and automatically sends replies based on configurable rules.

## Features
- Pattern matching for subject lines and sender addresses
- Customizable reply templates with variable substitution
- Rate limiting to prevent spam detection
- Logging and reporting of all automated responses

## Use Cases
- Out-of-office autoreplies with smart filtering
- Customer support ticket acknowledgments
- Lead qualification responses`,
    author: {
      id: 'sarah-dev',
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      github: 'sarahchen',
    },
    code: `name: gmail-auto-reply
description: Auto-reply to emails matching patterns

triggers:
  - type: schedule
    cron: "*/5 * * * *"

inputs:
  - name: match_pattern
    type: string
    default: "support request"
  - name: reply_template
    type: string
    default: "Thank you for contacting us..."

steps:
  - id: open_gmail
    tool: navigate_browser
    args:
      url: "https://mail.google.com"
      process: chrome

  - id: search_emails
    tool: type_into_element
    args:
      selector: "role:ComboBox|name:Search"
      text: "is:unread {{match_pattern}}"
      process: chrome

  - id: process_results
    tool: execute_browser_script
    args:
      script: |
        const emails = document.querySelectorAll('[role="row"]');
        return { count: emails.length };
      process: chrome`,
    language: 'yaml',
    category: 'browser-automation',
    tags: ['gmail', 'email', 'automation', 'productivity'],
    installCount: 2847,
    stars: 342,
    createdAt: '2024-08-15T10:30:00Z',
    updatedAt: '2024-11-20T14:22:00Z',
    featured: true,
    verified: true,
  },
  {
    id: 'pdf-data-extractor',
    name: 'PDF Data Extractor',
    description: 'Extract structured data from PDF documents using OCR and pattern matching.',
    author: {
      id: 'marcus-j',
      name: 'Marcus Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      github: 'marcusj',
    },
    code: `name: pdf-data-extractor
description: Extract data from PDFs

inputs:
  - name: pdf_path
    type: string
    required: true
  - name: extraction_rules
    type: object

steps:
  - id: open_pdf
    tool: open_application
    args:
      app_name: "Adobe Acrobat"

  - id: load_file
    tool: press_key_global
    args:
      process: acrobat
      key: "Ctrl+O"

  - id: extract_text
    tool: get_window_tree
    args:
      process: acrobat
      include_ocr: true`,
    language: 'yaml',
    category: 'file-management',
    tags: ['pdf', 'ocr', 'data-extraction', 'documents'],
    installCount: 1523,
    stars: 187,
    createdAt: '2024-09-02T08:15:00Z',
    updatedAt: '2024-11-18T09:45:00Z',
    verified: true,
  },
  {
    id: 'form-filler-pro',
    name: 'Smart Form Filler',
    description: 'Intelligently fill web forms using AI-powered field detection and data mapping.',
    author: {
      id: 'elena-k',
      name: 'Elena Kowalski',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
      github: 'elenak',
    },
    code: `import { Desktop } from 'terminator-sdk';

const desktop = new Desktop();

interface FormData {
  [key: string]: string;
}

async function fillForm(data: FormData) {
  const tree = await desktop.locator('process:chrome')
    .first(5000);

  // Find all input fields
  const inputs = await desktop
    .locator('process:chrome >> role:Edit')
    .all(3000);

  for (const input of inputs) {
    const name = await input.getAttribute('name');
    if (name && data[name]) {
      await input.typeText(data[name], {
        clearBeforeTyping: true
      });
    }
  }
}

export { fillForm };`,
    language: 'typescript',
    category: 'data-entry',
    tags: ['forms', 'automation', 'ai', 'web'],
    installCount: 3201,
    stars: 456,
    createdAt: '2024-07-20T14:00:00Z',
    updatedAt: '2024-11-21T11:30:00Z',
    featured: true,
    verified: true,
  },
  {
    id: 'linkedin-scraper',
    name: 'LinkedIn Profile Scraper',
    description: 'Ethically scrape public LinkedIn profiles for lead generation and research.',
    author: {
      id: 'james-w',
      name: 'James Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    },
    code: `name: linkedin-scraper
description: Scrape LinkedIn profiles

inputs:
  - name: profile_urls
    type: array
    items: string
  - name: output_format
    type: enum
    options: [json, csv, xlsx]
    default: json

steps:
  - id: navigate_profile
    tool: navigate_browser
    args:
      url: "{{current_url}}"
      process: chrome

  - id: extract_data
    tool: execute_browser_script
    args:
      process: chrome
      script: |
        return {
          name: document.querySelector('h1')?.textContent,
          title: document.querySelector('.text-body-medium')?.textContent,
          location: document.querySelector('.text-body-small')?.textContent,
        };`,
    language: 'yaml',
    category: 'web-scraping',
    tags: ['linkedin', 'scraping', 'lead-gen', 'sales'],
    installCount: 892,
    stars: 134,
    createdAt: '2024-10-05T16:45:00Z',
    updatedAt: '2024-11-15T13:20:00Z',
  },
  {
    id: 'e2e-test-recorder',
    name: 'E2E Test Recorder',
    description: 'Record user interactions and generate Playwright/Cypress test scripts automatically.',
    author: {
      id: 'alex-m',
      name: 'Alex Martinez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      github: 'alexm',
    },
    code: `import { Desktop } from 'terminator-sdk';

class TestRecorder {
  private actions: Action[] = [];
  private desktop = new Desktop();

  async startRecording(process: string) {
    console.log('Recording started...');

    // Hook into UI events
    const element = await this.desktop
      .locator(\`process:\${process}\`)
      .first(5000);

    // Monitor for clicks, typing, navigation
    // Generate test code on stop
  }

  generatePlaywrightTest(): string {
    return this.actions.map(action => {
      switch (action.type) {
        case 'click':
          return \`await page.click('\${action.selector}');\`;
        case 'type':
          return \`await page.fill('\${action.selector}', '\${action.value}');\`;
        default:
          return '';
      }
    }).join('\\n');
  }
}`,
    language: 'typescript',
    category: 'testing',
    tags: ['testing', 'e2e', 'playwright', 'automation'],
    installCount: 1876,
    stars: 298,
    createdAt: '2024-06-12T09:00:00Z',
    updatedAt: '2024-11-19T17:10:00Z',
    featured: true,
    verified: true,
  },
  {
    id: 'notion-sync',
    name: 'Notion Database Sync',
    description: 'Bi-directional sync between Notion databases and local files or other services.',
    author: {
      id: 'priya-s',
      name: 'Priya Sharma',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
      github: 'priyas',
    },
    code: `name: notion-sync
description: Sync Notion databases

inputs:
  - name: database_id
    type: string
    required: true
  - name: sync_direction
    type: enum
    options: [push, pull, bidirectional]

steps:
  - id: open_notion
    tool: navigate_browser
    args:
      url: "https://notion.so/{{database_id}}"
      process: chrome

  - id: export_data
    tool: press_key_global
    args:
      process: chrome
      key: "Ctrl+Shift+E"`,
    language: 'yaml',
    category: 'integrations',
    tags: ['notion', 'sync', 'database', 'productivity'],
    installCount: 2134,
    stars: 267,
    createdAt: '2024-08-28T11:30:00Z',
    updatedAt: '2024-11-20T08:55:00Z',
    verified: true,
  },
  {
    id: 'screenshot-annotator',
    name: 'Screenshot Annotator',
    description: 'Capture screenshots and automatically annotate UI elements with descriptions.',
    author: {
      id: 'tom-b',
      name: 'Tom Bradley',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom',
    },
    code: `name: screenshot-annotator
description: Annotate screenshots with UI info

inputs:
  - name: target_process
    type: string
    required: true
  - name: output_path
    type: string
    default: "./screenshots"

steps:
  - id: capture
    tool: capture_screenshot
    args:
      process: "{{target_process}}"
      include_tree_after_action: true

  - id: get_tree
    tool: get_window_tree
    args:
      process: "{{target_process}}"
      include_tree_after_action: true`,
    language: 'yaml',
    category: 'utilities',
    tags: ['screenshots', 'documentation', 'ui', 'annotation'],
    installCount: 743,
    stars: 89,
    createdAt: '2024-10-18T13:00:00Z',
    updatedAt: '2024-11-17T10:30:00Z',
  },
  {
    id: 'slack-workflow',
    name: 'Slack Message Automator',
    description: 'Schedule and automate Slack messages with rich formatting and attachments.',
    author: {
      id: 'nina-r',
      name: 'Nina Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nina',
      github: 'ninar',
    },
    code: `name: slack-automator
description: Automate Slack messaging

triggers:
  - type: schedule
    cron: "0 9 * * 1-5"

inputs:
  - name: channel
    type: string
    required: true
  - name: message
    type: string
    required: true

steps:
  - id: open_slack
    tool: activate_element
    args:
      process: Slack

  - id: search_channel
    tool: press_key_global
    args:
      process: Slack
      key: "Ctrl+K"

  - id: type_channel
    tool: type_into_element
    args:
      process: Slack
      selector: "role:ComboBox"
      text: "{{channel}}"`,
    language: 'yaml',
    category: 'productivity',
    tags: ['slack', 'messaging', 'scheduling', 'team'],
    installCount: 1567,
    stars: 203,
    createdAt: '2024-09-10T15:20:00Z',
    updatedAt: '2024-11-21T09:15:00Z',
    verified: true,
  },
];

export const featuredSkills = mockSkills.filter(s => s.featured);
export const verifiedSkills = mockSkills.filter(s => s.verified);
