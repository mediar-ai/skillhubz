import { motion } from 'motion/react';
import styles from './LegalPage.module.css';

export function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Terms of Service</h1>
          <p>Rules for using skillhu.bz</p>
        </motion.div>

        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2>Acceptance</h2>
          <p>
            By using skillhu.bz, you agree to these terms. If you don't agree, please don't use the service.
          </p>

          <h2>What You Can Do</h2>
          <ul>
            <li>Browse and use skills for any purpose</li>
            <li>Submit skills to share with the community</li>
            <li>Modify and adapt skills for your needs</li>
            <li>Use skills commercially (subject to individual skill licenses)</li>
          </ul>

          <h2>What You Can't Do</h2>
          <ul>
            <li>Submit malicious code or skills designed to harm</li>
            <li>Submit content you don't have rights to share</li>
            <li>Attempt to disrupt or attack the service</li>
            <li>Scrape the site in ways that impact performance</li>
          </ul>

          <h2>Submitted Content</h2>
          <p>
            When you submit a skill, you grant us a license to host, display, and distribute it. You retain ownership of your content. All submitted skills are public and available under the MIT license unless otherwise specified.
          </p>

          <h2>No Warranty</h2>
          <p>
            Skills are provided "as is" without warranty. We don't guarantee skills will work for your use case, and we're not responsible for any issues that arise from using them.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these terms. Continued use after changes means you accept the new terms.
          </p>

          <h2>Contact</h2>
          <p>
            Questions? Reach out on <a href="https://x.com/m13v_" target="_blank" rel="noopener noreferrer">Twitter/X</a>.
          </p>

          <div className={styles.lastUpdated}>
            Last updated: January 2025
          </div>
        </motion.div>
      </div>
    </div>
  );
}
