import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  Download,
  Code,
  Users,
  Zap,
  Globe,
  Folder,
  FormInput,
  Database,
  FlaskConical,
  Puzzle,
  Wrench,
  Loader2,
} from 'lucide-react';
import { SkillCard } from '../components/SkillCard';
import { useSkills } from '../hooks/useSkills';
import { CATEGORIES, type Category } from '../types';
import { trackCategorySelected, trackCtaClicked, trackExternalLinkClicked } from '../utils/analytics';
import styles from './HomePage.module.css';

const categoryIcons: Record<Category, React.ReactNode> = {
  'browser-automation': <Globe size={20} />,
  'file-management': <Folder size={20} />,
  'data-entry': <FormInput size={20} />,
  'web-scraping': <Database size={20} />,
  'testing': <FlaskConical size={20} />,
  'productivity': <Zap size={20} />,
  'integrations': <Puzzle size={20} />,
  'utilities': <Wrench size={20} />,
};

export function HomePage() {
  const { skills, loading } = useSkills();
  const featuredSkills = skills.filter(s => s.featured);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={14} />
            <span>Community-driven automation</span>
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Discover & Share
            <br />
            <span className="text-gradient">Computer Use Skills</span>
          </motion.h1>

          <motion.p
            className={styles.heroDescription}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A curated collection of automation skills for Claude Code and desktop
            agents. Copy, install, and customize workflows built by the community.
          </motion.p>

          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/explore" className="btn btn-primary" onClick={() => trackCtaClicked('explore_skills', 'hero')}>
              Explore Skills
              <ArrowRight size={16} />
            </Link>
            <Link to="/submit" className="btn btn-secondary" onClick={() => trackCtaClicked('submit_skill', 'hero')}>
              Submit Your Skill
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className={styles.stats}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className={styles.statItem}>
              <Download size={18} className={styles.statIcon} />
              <span className={styles.statValue}>1.2k</span>
              <span className={styles.statLabel}>Installs</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Code size={18} className={styles.statIcon} />
              <span className={styles.statValue}>{skills.length}</span>
              <span className={styles.statLabel}>Skills</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Users size={18} className={styles.statIcon} />
              <span className={styles.statValue}>42</span>
              <span className={styles.statLabel}>Contributors</span>
            </div>
          </motion.div>
        </div>

        {/* Animated code preview */}
        <motion.div
          className={styles.heroVisual}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.codeWindow}>
            <div className={styles.codeHeader}>
              <div className={styles.codeDots}>
                <span />
                <span />
                <span />
              </div>
              <span className={styles.codeFilename}>gmail-reply.md</span>
            </div>
            <pre className={styles.codeContent}>
              <code>{`# Gmail Auto-Reply Skill

Reply to unread support emails in Gmail.

## Instructions

1. Open Chrome and navigate to mail.google.com
2. Wait for the inbox to fully load - look for
   the compose button to confirm
3. Click the search bar and type "is:unread
   from:support" then press Enter
4. For each unread email in results:
   - Click to open the email thread
   - Click "Reply" button (arrow icon)
   - Type a response acknowledging receipt
   - Click Send, wait for confirmation
5. Return to inbox before next email`}</code>
            </pre>
            <div className={styles.codeGlow} />
          </div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Browse by Category</h2>
            <p>Find the perfect automation skill for your workflow</p>
          </div>

          <div className={styles.categoriesGrid}>
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(
              ([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/explore?category=${key}`}
                    className={styles.categoryCard}
                    style={{ '--category-color': value.color } as React.CSSProperties}
                    onClick={() => trackCategorySelected(key, 'home')}
                  >
                    <div className={styles.categoryIcon}>
                      {categoryIcons[key]}
                    </div>
                    <span className={styles.categoryName}>{value.label}</span>
                    <span className={styles.categoryCount}>
                      {skills.filter((s) => s.category === key).length} skills
                    </span>
                  </Link>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Featured Skills Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Featured Skills</h2>
              <p>Hand-picked by the community</p>
            </div>
            <Link to="/explore" className="btn btn-ghost" onClick={() => trackCtaClicked('view_all', 'featured_skills')}>
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <Loader2 size={32} className={styles.spinner} />
              <p>Loading skills...</p>
            </div>
          ) : (
            <div className={styles.skillsGrid}>
              {featuredSkills.slice(0, 3).map((skill, index) => (
                <SkillCard key={skill.id} skill={skill} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>How It Works</h2>
            <p>Get started in seconds</p>
          </div>

          <div className={styles.stepsGrid}>
            <motion.div
              className={styles.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className={styles.stepNumber}>01</div>
              <h3>Browse Skills</h3>
              <p>
                Explore our curated collection of automation skills. Filter by
                category, popularity, or search for specific workflows.
              </p>
            </motion.div>

            <motion.div
              className={styles.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className={styles.stepNumber}>02</div>
              <h3>Copy or Install</h3>
              <p>
                Copy the skill code directly to your clipboard or use our CLI to
                install it to your Claude Code environment.
              </p>
            </motion.div>

            <motion.div
              className={styles.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className={styles.stepNumber}>03</div>
              <h3>Customize & Run</h3>
              <p>
                Modify the skill to fit your needs, then run it with your AI
                assistant. Share improvements back to the community.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.cta}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to share your automation?</h2>
            <p>
              Join our community of automation enthusiasts. Submit your skills and
              help others automate their workflows.
            </p>
            <div className={styles.ctaActions}>
              <Link to="/submit" className="btn btn-primary" onClick={() => trackCtaClicked('submit_skill', 'cta_section')}>
                Submit a Skill
                <ArrowRight size={16} />
              </Link>
              <a href="https://github.com/mediar-ai/skillhubz" className="btn btn-secondary" onClick={() => trackExternalLinkClicked('https://github.com/mediar-ai/skillhubz', 'docs')}>
                Read the Docs
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
