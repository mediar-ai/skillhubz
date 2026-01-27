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
  Loader2,
} from 'lucide-react';
import { useSkill } from '../hooks/useSkills';
import { useComments } from '../hooks/useComments';
import { CATEGORIES } from '../types';
import { trackStar } from '../utils/tracking';
import {
  trackSkillViewed,
  trackCodeCopied,
  trackInstallCommandCopied,
  trackSkillStarred,
  trackCommentPosted,
  trackCommentLiked,
  trackTabSwitched,
} from '../utils/analytics';
import styles from './SkillDetailPage.module.css';

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { skill, loading, error } = useSkill(id || '');
  const { comments, loading: commentsLoading, addComment, likeComment, hasLiked } = useComments(id || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'comments'>('code');
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState(() => localStorage.getItem('comment-author') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Star state
  const storageKey = `starred-${id}`;
  const [hasStarred, setHasStarred] = useState(() => localStorage.getItem(storageKey) === 'true');
  const [starCount, setStarCount] = useState<number | null>(null);

  // Sync star count when skill loads
  if (skill && starCount === null) {
    setStarCount(skill.stars);
  }

  // Track skill view
  if (skill && !hasTrackedView) {
    trackSkillViewed(skill.id, skill.category, skill.author.name);
    setHasTrackedView(true);
  }

  const handleStar = async () => {
    if (hasStarred || !id) return;

    setHasStarred(true);
    setStarCount(prev => (prev ?? 0) + 1);
    localStorage.setItem(storageKey, 'true');
    trackSkillStarred(id, 'detail');

    const success = await trackStar(id);
    if (!success) {
      setHasStarred(false);
      setStarCount(prev => (prev ?? 1) - 1);
      localStorage.removeItem(storageKey);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading skill...</p>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className={styles.notFound}>
        <h1>Skill not found</h1>
        <p>{error || 'The skill you are looking for does not exist.'}</p>
        <Link to="/explore" className="btn btn-secondary">
          Back to Explore
        </Link>
      </div>
    );
  }

  const category = CATEGORIES[skill.category];

  const handleCopy = async (source: 'main' | 'sidebar' = 'main') => {
    await navigator.clipboard.writeText(skill.code);
    setCopied(true);
    trackCodeCopied(skill.id, source);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !authorName.trim() || !id) return;

    setIsSubmitting(true);
    localStorage.setItem('comment-author', authorName.trim());

    const success = await addComment(authorName.trim(), commentText.trim());
    if (success) {
      setCommentText('');
      trackCommentPosted(id);
    }
    setIsSubmitting(false);
  };

  const handleLike = async (commentId: string) => {
    if (id) trackCommentLiked(commentId, id);
    await likeComment(commentId);
  };

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
                  <span className={styles.featuredBadge}>Featured</span>
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
                <span className={styles.metaDivider}>-</span>
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
                onClick={() => { setActiveTab('code'); if (id) trackTabSwitched('code', id); }}
              >
                <Terminal size={16} />
                Code
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
                onClick={() => { setActiveTab('comments'); if (id) trackTabSwitched('comments', id); }}
              >
                <MessageSquare size={16} />
                Comments ({comments.length})
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
                        data-language="markdown"
                      />
                      <span>markdown</span>
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
                    language="markdown"
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
                  <input
                    type="text"
                    placeholder="Your name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className={styles.authorInput}
                    maxLength={50}
                  />
                  <textarea
                    placeholder="Share your thoughts, improvements, or ask questions..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className={styles.commentInput}
                    maxLength={500}
                  />
                  <div className={styles.commentFormActions}>
                    <button
                      className="btn btn-primary"
                      disabled={!commentText.trim() || !authorName.trim() || isSubmitting}
                      onClick={handlePostComment}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className={styles.commentsList}>
                  {commentsLoading ? (
                    <div className={styles.loading}>
                      <Loader2 size={24} className={styles.spinner} />
                      <p>Loading comments...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className={styles.noComments}>
                      <MessageSquare size={32} />
                      <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className={styles.comment}>
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.author)}`}
                          alt={comment.author}
                          className={styles.commentAvatar}
                        />
                        <div className={styles.commentContent}>
                          <div className={styles.commentHeader}>
                            <span className={styles.commentAuthor}>
                              {comment.author}
                            </span>
                            <span className={styles.commentDate}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className={styles.commentText}>{comment.content}</p>
                          <div className={styles.commentActions}>
                            <button
                              className={`${styles.commentAction} ${hasLiked(comment.id) ? styles.liked : ''}`}
                              onClick={() => handleLike(comment.id)}
                              disabled={hasLiked(comment.id)}
                            >
                              <Heart size={14} fill={hasLiked(comment.id) ? 'currentColor' : 'none'} />
                              {comment.likes}
                            </button>
                            <button className={styles.commentAction}>
                              <Flag size={14} />
                              Report
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                <code>npx skillhu install {skill.id}</code>
                <button
                  className={styles.installCopy}
                  onClick={() => { navigator.clipboard.writeText(`npx skillhu install ${skill.id}`); trackInstallCommandCopied(skill.id); }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className={styles.installHint}>
                Or copy the code and paste it into your Claude Code skills folder
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleCopy('sidebar')}>
                <Download size={16} />
                Copy Skill Code
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
                <strong>{starCount ?? skill.stars}</strong>
              </div>
              <div className={styles.statRow}>
                <span>
                  <Clock size={16} />
                  Updated
                </span>
                <strong>{formatDate(skill.updatedAt)}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsCard}>
              <button
                className={`${styles.actionButton} ${hasStarred ? styles.starred : ''}`}
                onClick={handleStar}
                disabled={hasStarred}
              >
                <Star size={16} fill={hasStarred ? 'currentColor' : 'none'} />
                {hasStarred ? 'Starred!' : 'Star this skill'}
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
                  View Author
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
