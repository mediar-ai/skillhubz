import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  Download,
  Code,
  Users,
  Loader2,
} from 'lucide-react';
import { SkillCard } from '../components/SkillCard';
import { useSkills } from '../hooks/useSkills';
import { CATEGORIES, type Category } from '../types';
import { trackCategorySelected, trackCtaClicked, trackExternalLinkClicked } from '../utils/analytics';
import styles from './HomePage.module.css';

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
            <span>Community-powered AI skills</span>
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Discover & Share
            <br />
            <span className="text-gradient">Claude Skills</span>
          </motion.h1>

          <motion.p
            className={styles.heroDescription}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Supercharge Claude Code with community-built skills. Install with one command,
            use instantly. From frontend design to data analysis.
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

        {/* Quick Start Terminal */}
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
              <span className={styles.codeFilename}>Terminal</span>
            </div>
            <pre className={styles.codeContent}>
              <code>
                <span className={styles.terminalComment}># Install any skill with one command</span>{'\n'}
                <span className={styles.terminalPrompt}>$ </span><span className={styles.terminalCommand}>npx skillhu install frontend-design</span>{'\n'}
                {'\n'}
                <span className={styles.terminalOutput}>Installing frontend-design...</span>{'\n'}
                <span className={styles.terminalSuccess}>Skill installed to ~/.claude/skills/frontend-design</span>{'\n'}
                {'\n'}
                <span className={styles.terminalComment}># Now use it with Claude Code</span>{'\n'}
                <span className={styles.terminalPrompt}>$ </span><span className={styles.terminalCommand}>claude "create a landing page for my startup"</span>{'\n'}
                {'\n'}
                <span className={styles.terminalOutput}>Using skill: frontend-design</span>{'\n'}
                <span className={styles.terminalOutput}>Creating landing page with hero section...</span>
              </code>
            </pre>
            <div className={styles.codeGlow} />
          </div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <motion.div
            className={styles.categoriesHeader}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className={styles.categoriesLabel}>Browse by category</span>
          </motion.div>

          <div className={styles.categoriesFlow}>
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(
              ([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.03,
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  <Link
                    to={`/explore?category=${key}`}
                    className={styles.categoryPill}
                    style={{ '--category-color': value.color } as React.CSSProperties}
                    onClick={() => trackCategorySelected(key, 'home')}
                  >
                    <span className={styles.categoryText}>{value.label}</span>
                    <span className={styles.categoryDot} />
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
                Explore our curated collection of Claude skills. Filter by
                category, popularity, or search for specific use cases.
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
                Copy skills directly to your clipboard or use our CLI to
                install them into your AI assistant's environment.
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
                Modify skills to fit your needs, then use them with your AI
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
            <h2>Ready to share your skills?</h2>
            <p>
              Join our community of AI enthusiasts. Submit your skills and
              help others supercharge their workflows.
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
