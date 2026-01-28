import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import styles from './LegalPage.module.css';

export function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Documentation</h1>
          <p>Learn how to use and create Claude skills</p>
        </motion.div>

        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2>What are Claude Skills?</h2>
          <p>
            Claude skills are reusable instructions, prompts, and workflows that extend what Claude can do. They're written in Markdown and can be installed into Claude Code or used directly with any Claude interface.
          </p>

          <h2>Using Skills</h2>
          <h3>Option 1: Copy and Paste</h3>
          <p>
            The simplest way to use a skill is to copy its content and paste it into your conversation with Claude. Click the "Copy" button on any skill page.
          </p>

          <h3>Option 2: Install with CLI</h3>
          <p>
            If you're using Claude Code, you can install skills directly:
          </p>
          <pre><code>npx skillhubz install skill-name</code></pre>

          <h2>Creating Skills</h2>
          <p>
            Skills are Markdown files with clear instructions. A good skill includes:
          </p>
          <ul>
            <li><strong>Title</strong> - Clear name describing what it does</li>
            <li><strong>Description</strong> - One-line summary</li>
            <li><strong>Prerequisites</strong> - What's needed before running</li>
            <li><strong>Instructions</strong> - Step-by-step guide</li>
            <li><strong>Error handling</strong> - What to do when things go wrong</li>
          </ul>

          <h3>Example Skill Structure</h3>
          <pre><code>{`# Skill Title

Brief description of what this skill does.

## Prerequisites

- Requirement 1
- Requirement 2

## Instructions

1. First step with specific details
2. Second step
3. Continue with clear, numbered steps

## Error Handling

- If X happens, do Y
- When to stop and ask for help`}</code></pre>

          <h2>Submitting Skills</h2>
          <p>
            Ready to share? <Link to="/submit">Submit your skill</Link> and it will be published instantly. All submitted skills are:
          </p>
          <ul>
            <li>Public and searchable</li>
            <li>Licensed under MIT (unless specified otherwise)</li>
            <li>Attributed to you (if you provide your name/GitHub)</li>
          </ul>

          <h2>Best Practices</h2>
          <ul>
            <li>Be specific - vague instructions lead to inconsistent results</li>
            <li>Include examples - show expected inputs and outputs</li>
            <li>Handle errors - tell Claude what to do when things fail</li>
            <li>Test your skill - try it yourself before submitting</li>
            <li>Keep it focused - one skill, one task</li>
          </ul>

          <h2>Need Help?</h2>
          <p>
            Check out the <a href="https://github.com/mediar-ai/skillhubz" target="_blank" rel="noopener noreferrer">GitHub repo</a> or reach out on <a href="https://x.com/m13v_" target="_blank" rel="noopener noreferrer">Twitter/X</a>.
          </p>

          <div className={styles.lastUpdated}>
            Last updated: January 2025
          </div>
        </motion.div>
      </div>
    </div>
  );
}
