import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Download,
  Star,
  CheckCircle,
  User,
} from 'lucide-react';
import type { Skill } from '../types';
import { CATEGORIES } from '../types';
import { trackStar } from '../utils/tracking';
import { trackSkillStarred, trackSkillCardClicked } from '../utils/analytics';
import styles from './SkillCard.module.css';

interface SkillCardProps {
  skill: Skill;
  index?: number;
}

export function SkillCard({ skill, index = 0 }: SkillCardProps) {
  const category = CATEGORIES[skill.category];
  const formattedInstalls = formatNumber(skill.installCount);

  // Check if user already starred this skill
  const storageKey = `starred-${skill.id}`;
  const [hasStarred, setHasStarred] = useState(() => localStorage.getItem(storageKey) === 'true');
  const [starCount, setStarCount] = useState(skill.stars);
  const formattedStars = formatNumber(starCount);

  const handleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasStarred) return; // Already starred

    // Optimistic update
    setHasStarred(true);
    setStarCount(prev => prev + 1);
    localStorage.setItem(storageKey, 'true');

    // Track the star
    trackSkillStarred(skill.id, 'card');
    const success = await trackStar(skill.id);
    if (!success) {
      // Revert on failure
      setHasStarred(false);
      setStarCount(prev => prev - 1);
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/skill/${skill.id}`} className={styles.cardLink} onClick={() => trackSkillCardClicked(skill.id, index, 'explore')}>
        {/* Header */}
        <div className={styles.header}>
          <div
            className={styles.categoryDot}
            style={{ background: category.color }}
          />
          <span className={styles.category}>{category.label}</span>
          {skill.verified && (
            <span className={styles.verified}>
              <CheckCircle size={12} />
              Verified
            </span>
          )}
        </div>

        {/* Content */}
        <h3 className={styles.title}>{skill.name}</h3>
        <p className={styles.description}>{skill.description}</p>

        {/* Tags */}
        <div className={styles.tags}>
          {skill.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
          {skill.tags.length > 3 && (
            <span className={styles.tagMore}>+{skill.tags.length - 3}</span>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.author}>
            {skill.author.avatar ? (
              <img
                src={skill.author.avatar}
                alt={skill.author.name}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <User size={14} />
              </div>
            )}
            <span>{skill.author.name}</span>
          </div>

          <div className={styles.stats}>
            <span className={styles.stat}>
              <Download size={14} />
              {formattedInstalls}
            </span>
            <button
              className={`${styles.stat} ${styles.starButton} ${hasStarred ? styles.starred : ''}`}
              onClick={handleStar}
              title={hasStarred ? 'You starred this skill' : 'Star this skill'}
            >
              <Star size={14} fill={hasStarred ? 'currentColor' : 'none'} />
              {formattedStars}
            </button>
          </div>
        </div>

        {/* Language badge */}
        <div className={styles.languageBadge}>
          <span
            className={styles.languageDot}
            data-language={skill.language}
          />
          {skill.language}
        </div>
      </Link>

      {/* Glow effect on hover */}
      <div className={styles.glowEffect} style={{ '--glow-color': category.color } as React.CSSProperties} />
    </motion.article>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}
