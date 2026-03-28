import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Package,
  Star,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Terminal,
} from 'lucide-react';
import { useCollection } from '../hooks/useCollections';
import styles from './PackDetailPage.module.css';

export function PackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { collection, loading } = useCollection(id!);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!collection) return;
    navigator.clipboard.writeText(collection.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={32} className={styles.spinner} />
        <p>Loading pack...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className={styles.notFound}>
        <h2>Pack not found</h2>
        <Link to="/" className="btn btn-secondary">Back to Home</Link>
      </div>
    );
  }

  // Group skills by workflow phase
  const phases = [
    {
      label: 'Planning',
      skills: collection.skills.filter(s =>
        ['office-hours', 'plan-ceo-review', 'plan-eng-review', 'plan-design-review', 'autoplan'].includes(s.name)
      ),
    },
    {
      label: 'Development & Review',
      skills: collection.skills.filter(s =>
        ['review', 'codex', 'cso', 'investigate'].includes(s.name)
      ),
    },
    {
      label: 'Design',
      skills: collection.skills.filter(s =>
        ['design-consultation', 'design-shotgun', 'design-review'].includes(s.name)
      ),
    },
    {
      label: 'Testing & QA',
      skills: collection.skills.filter(s =>
        ['browse', 'qa', 'qa-only', 'benchmark', 'canary', 'connect-chrome', 'setup-browser-cookies'].includes(s.name)
      ),
    },
    {
      label: 'Shipping',
      skills: collection.skills.filter(s =>
        ['ship', 'land-and-deploy', 'setup-deploy', 'document-release'].includes(s.name)
      ),
    },
    {
      label: 'Retrospective',
      skills: collection.skills.filter(s =>
        ['retro'].includes(s.name)
      ),
    },
    {
      label: 'Safety & Control',
      skills: collection.skills.filter(s =>
        ['careful', 'freeze', 'guard', 'unfreeze'].includes(s.name)
      ),
    },
  ].filter(p => p.skills.length > 0);

  return (
    <div className={styles.page}>
      {/* Back nav */}
      <div className={styles.container}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to all skills
        </Link>
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.heroBadge}>
              <Package size={14} />
              <span>Skill Pack</span>
            </div>

            <h1 className={styles.heroTitle}>{collection.name}</h1>
            <span className={styles.heroAuthor}>{collection.subtitle}</span>
            <p className={styles.heroDescription}>{collection.description}</p>

            <div className={styles.heroMeta}>
              <div className={styles.starBadge}>
                <Star size={14} fill="currentColor" />
                <span>{formatStars(collection.stars)} stars on GitHub</span>
              </div>
              <span className={styles.metaDivider} />
              <span className={styles.skillCount}>{collection.skills.length} skills</span>
              <span className={styles.metaDivider} />
              <a
                href={collection.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.githubLink}
              >
                <ExternalLink size={14} />
                View on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Install */}
      <section className={styles.installSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.installCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className={styles.installHeader}>
              <Terminal size={18} />
              <span>Install with one command</span>
            </div>
            <div className={styles.installCommand}>
              <code>{collection.installCommand}</code>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className={styles.installNote}>
              Requires <a href="https://bun.sh" target="_blank" rel="noopener noreferrer">Bun</a> v1.0+.
              After install, all skills are available as slash commands in Claude Code.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Skills by phase */}
      <section className={styles.skillsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>All Skills</h2>

          {phases.map((phase, phaseIndex) => (
            <motion.div
              key={phase.label}
              className={styles.phase}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: phaseIndex * 0.05 }}
            >
              <h3 className={styles.phaseLabel}>{phase.label}</h3>
              <div className={styles.skillsGrid}>
                {phase.skills.map(skill => (
                  <div key={skill.name} className={styles.skillCard}>
                    <div className={styles.skillHeader}>
                      <span className={styles.skillName}>/{skill.name}</span>
                      <span className={styles.skillRole}>{skill.role}</span>
                    </div>
                    <p className={styles.skillDescription}>{skill.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}
