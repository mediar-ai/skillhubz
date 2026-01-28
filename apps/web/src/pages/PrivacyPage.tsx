import { motion } from 'motion/react';
import styles from './LegalPage.module.css';

export function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Privacy Policy</h1>
          <p>How we handle your data</p>
        </motion.div>

        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2>Overview</h2>
          <p>
            skillhu.bz is committed to protecting your privacy. This policy explains what data we collect and how we use it.
          </p>

          <h2>Data We Collect</h2>
          <h3>Analytics</h3>
          <p>
            We use PostHog to collect anonymous usage analytics to improve the service. This includes:
          </p>
          <ul>
            <li>Pages visited</li>
            <li>Features used</li>
            <li>General location (country level)</li>
            <li>Device type and browser</li>
          </ul>

          <h3>Skills You Submit</h3>
          <p>
            When you submit a skill, we store the skill content, your provided name (optional), and GitHub username (optional). All submitted skills are public.
          </p>

          <h2>Data We Don't Collect</h2>
          <ul>
            <li>We don't require account creation</li>
            <li>We don't collect email addresses</li>
            <li>We don't use advertising trackers</li>
            <li>We don't sell any data</li>
          </ul>

          <h2>Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>PostHog</strong> - Analytics (EU hosted)</li>
            <li><strong>Vercel</strong> - Hosting</li>
            <li><strong>GitHub</strong> - Source code and skill storage</li>
          </ul>

          <h2>Contact</h2>
          <p>
            Questions? Reach out on <a href="https://x.com/m13v_" target="_blank" rel="noopener noreferrer">Twitter/X</a> or open an issue on <a href="https://github.com/mediar-ai/skillhubz" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </p>

          <div className={styles.lastUpdated}>
            Last updated: January 2025
          </div>
        </motion.div>
      </div>
    </div>
  );
}
