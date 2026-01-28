import { motion } from 'motion/react';
import styles from './LegalPage.module.css';

export function LicensePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>License</h1>
          <p>MIT License</p>
        </motion.div>

        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p>
            skillhu.bz and all skills submitted to it (unless otherwise specified) are licensed under the MIT License.
          </p>

          <pre><code>{`MIT License

Copyright (c) 2025 skillhu.bz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}</code></pre>

          <h2>What This Means</h2>
          <p>You can:</p>
          <ul>
            <li>Use skills for any purpose, including commercial</li>
            <li>Modify skills to fit your needs</li>
            <li>Distribute skills (with attribution)</li>
            <li>Use skills privately without sharing changes</li>
          </ul>

          <p>You must:</p>
          <ul>
            <li>Include the license text when redistributing</li>
            <li>Not hold us liable for any issues</li>
          </ul>

          <div className={styles.lastUpdated}>
            Last updated: January 2025
          </div>
        </motion.div>
      </div>
    </div>
  );
}
