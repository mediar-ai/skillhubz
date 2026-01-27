import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Star,
  ExternalLink,
  Github,
  Clock,
  CheckCircle,
  MessageSquare,
  Heart,
  Flag,
  Share2,
  Terminal,
} from 'lucide-react';
import { mockSkills } from '../data/skills';
import { CATEGORIES } from '../types';
import styles from './SkillDetailPage.module.css';

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'comments'>('code');
  const [commentText, setCommentText] = useState('');

  const skill = mockSkills.find((s) => s.id === id);

  if (!skill) {
    return (
      <div className={styles.notFound}>
        <h1>Skill not found</h1>
        <Link to="/explore" className="btn btn-secondary">
          Back to Explore
        </Link>
      </div>
    );
  }

  const category = CATEGORIES[skill.category];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(skill.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const mockComments = [
    {
      id: '1',
      author: { name: 'David Kim', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david' },
      content: 'This skill saved me hours of work! I modified it to also track email response times.',
      createdAt: '2024-11-18T10:30:00Z',
      likes: 12,
    },
    {
      id: '2',
      author: { name: 'Lisa Wang', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa' },
      content: 'Great automation! One suggestion: add error handling for when Gmail rate limits the API calls.',
      createdAt: '2024-11-15T14:22:00Z',
      likes: 8,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/explore" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Explore
          </Link>
        </motion.div>

        <div className={styles.content}>
          {/* Main Content */}
          <div className={styles.main}>
            {/* Header */}
            <motion.header
              className={styles.header}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.headerTop}>
                <Link
                  to={`/explore?category=${skill.category}`}
                  className={styles.categoryBadge}
                  style={{ '--category-color': category.color } as React.CSSProperties}
                >
                  {category.label}
                </Link>
                {skill.verified && (
                  <span className={styles.verifiedBadge}>
                    <CheckCircle size={14} />
                    Verified
                  </span>
                )}
                {skill.featured && (
                  <span className={styles.featuredBadge}>⭐ Featured</span>
                )}
              </div>

              <h1 className={styles.title}>{skill.name}</h1>
              <p className={styles.description}>{skill.description}</p>

              <div className={styles.meta}>
                <Link to="#" className={styles.author}>
                  {skill.author.avatar && (
                    <img
                      src={skill.author.avatar}
                      alt={skill.author.name}
                      className={styles.authorAvatar}
                    />
                  )}
                  <span>{skill.author.name}</span>
                </Link>
                <span className={styles.metaDivider}>•</span>
                <span className={styles.metaItem}>
                  <Clock size={14} />
                  Updated {formatDate(skill.updatedAt)}
                </span>
              </div>

              <div className={styles.tags}>
                {skill.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/explore?search=${tag}`}
                    className={styles.tag}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </motion.header>

            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'code' ? styles.active : ''}`}
                onClick={() => setActiveTab('code')}
              >
                <Terminal size={16} />
                Code
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                <MessageSquare size={16} />
                Comments ({mockComments.length})
              </button>
            </div>

            {/* Code Tab */}
            {activeTab === 'code' && (
              <motion.div
                className={styles.codeSection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Code Block */}
                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>
                    <div className={styles.codeInfo}>
                      <span
                        className={styles.languageDot}
                        data-language={skill.language}
                      />
                      <span>{skill.language}</span>
                    </div>
                    <button
                      className={styles.copyButton}
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy code
                        </>
                      )}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={skill.language === 'yaml' ? 'yaml' : 'typescript'}
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.875rem',
                      lineHeight: '1.7',
                    }}
                  >
                    {skill.code}
                  </SyntaxHighlighter>
                </div>

                {/* Long Description */}
                {skill.longDescription && (
                  <div className={styles.longDescription}>
                    <h2>About this skill</h2>
                    <div className={styles.markdownContent}>
                      {skill.longDescription.split('\n').map((line, i) => {
                        if (line.startsWith('## ')) {
                          return <h3 key={i}>{line.slice(3)}</h3>;
                        }
                        if (line.startsWith('- ')) {
                          return <li key={i}>{line.slice(2)}</li>;
                        }
                        if (line.trim() === '') {
                          return <br key={i} />;
                        }
                        return <p key={i}>{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <motion.div
                className={styles.commentsSection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Comment Form */}
                <div className={styles.commentForm}>
                  <textarea
                    placeholder="Share your thoughts, improvements, or ask questions..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className={styles.commentInput}
                  />
                  <div className={styles.commentFormActions}>
                    <button className="btn btn-primary" disabled={!commentText.trim()}>
                      Post Comment
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className={styles.commentsList}>
                  {mockComments.map((comment) => (
                    <div key={comment.id} className={styles.comment}>
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className={styles.commentAvatar}
                      />
                      <div className={styles.commentContent}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentAuthor}>
                            {comment.author.name}
                          </span>
                          <span className={styles.commentDate}>
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className={styles.commentText}>{comment.content}</p>
                        <div className={styles.commentActions}>
                          <button className={styles.commentAction}>
                            <Heart size={14} />
                            {comment.likes}
                          </button>
                          <button className={styles.commentAction}>
                            <MessageSquare size={14} />
                            Reply
                          </button>
                          <button className={styles.commentAction}>
                            <Flag size={14} />
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.aside
            className={styles.sidebar}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Install Card */}
            <div className={styles.installCard}>
              <h3>Install this skill</h3>
              <div className={styles.installCode}>
                <code>npx skillhub install {skill.id}</code>
                <button
                  className={styles.installCopy}
                  onClick={() => navigator.clipboard.writeText(`npx skillhub install ${skill.id}`)}
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className={styles.installHint}>
                Or copy the code and paste it into your Claude Code skills folder
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }}>
                <Download size={16} />
                Download Skill
              </button>
            </div>

            {/* Stats */}
            <div className={styles.statsCard}>
              <div className={styles.statRow}>
                <span>
                  <Download size={16} />
                  Installs
                </span>
                <strong>{skill.installCount.toLocaleString()}</strong>
              </div>
              <div className={styles.statRow}>
                <span>
                  <Star size={16} />
                  Stars
                </span>
                <strong>{skill.stars}</strong>
              </div>
              <div className={styles.statRow}>
                <span>
                  <Clock size={16} />
                  Created
                </span>
                <strong>{formatDate(skill.createdAt)}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsCard}>
              <button className={styles.actionButton}>
                <Star size={16} />
                Star this skill
              </button>
              <button className={styles.actionButton}>
                <Share2 size={16} />
                Share
              </button>
              {skill.author.github && (
                <a
                  href={`https://github.com/${skill.author.github}`}
                  className={styles.actionButton}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github size={16} />
                  View on GitHub
                  <ExternalLink size={12} />
                </a>
              )}
              <button className={styles.actionButton}>
                <Flag size={16} />
                Report issue
              </button>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
