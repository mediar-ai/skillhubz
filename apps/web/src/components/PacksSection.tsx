import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, Star, ExternalLink, ChevronRight } from 'lucide-react';
import { useCollections } from '../hooks/useCollections';
import styles from './PacksSection.module.css';

export function PacksSection() {
  const { collections, loading } = useCollections();

  if (loading || collections.length === 0) return null;

  const featured = collections.filter(c => c.featured);
  if (featured.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.badge}>
            <Package size={14} />
            <span>Skill Packs</span>
          </div>
          <h2 className={styles.title}>Curated Skill Collections</h2>
          <p className={styles.subtitle}>
            Pre-built workflows from top engineers. Install an entire team of AI skills with one command.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {featured.map((pack, index) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/packs/${pack.id}`} className={styles.card}>
                <div className={styles.cardGlow} />
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <div className={styles.packIcon}>
                      <Package size={24} />
                    </div>
                    <div className={styles.cardMeta}>
                      <div className={styles.starBadge}>
                        <Star size={12} fill="currentColor" />
                        <span>{formatStars(pack.stars)}</span>
                      </div>
                      <a
                        href={pack.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.sourceLink}
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                        GitHub
                      </a>
                    </div>
                  </div>

                  <h3 className={styles.packName}>{pack.name}</h3>
                  <span className={styles.packAuthor}>{pack.subtitle}</span>
                  <p className={styles.packDescription}>{pack.description}</p>

                  <div className={styles.skillPreview}>
                    {pack.skills.slice(0, 6).map(skill => (
                      <span key={skill.name} className={styles.skillChip}>
                        /{skill.name}
                      </span>
                    ))}
                    {pack.skills.length > 6 && (
                      <span className={styles.skillChipMore}>
                        +{pack.skills.length - 6} more
                      </span>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.skillCount}>
                      {pack.skills.length} skills
                    </span>
                    <span className={styles.viewPack}>
                      View pack <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}
