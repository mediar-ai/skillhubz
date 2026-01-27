import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Upload,
  Code,
  Tag,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Github,
  ExternalLink,
} from 'lucide-react';
import { CATEGORIES, type Category } from '../types';
import { trackSkillSubmitted, trackFormStepChanged } from '../utils/analytics';
import styles from './SubmitPage.module.css';

type Step = 'info' | 'code' | 'preview';

const SKILL_TEMPLATE = `# Skill Title

Brief one-line description of what this skill does.

## Prerequisites

- List any requirements (apps, login states, etc.)
- Browser installed
- Logged into service X

## Instructions

1. First step - be specific about what to do
   - Include what to look for to confirm success
   - Mention specific UI elements by name

2. Second step
   - Provide exact text to type if needed
   - Describe expected behavior

3. Continue with numbered steps...

4. Final step
   - Report results to user
   - Summarize what was accomplished

## Error Handling

- If X happens, do Y
- If element not found, wait and retry
- When to stop and ask for help

## Notes

- Any additional context
- Variations or customization options
`;

export function SubmitPage() {
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '' as Category | '',
    tags: '',
    content: SKILL_TEMPLATE,
    authorName: '',
    authorGithub: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; slug?: string; error?: string } | null>(null);

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Basic Info', icon: <FileText size={18} /> },
    { id: 'code', label: 'Skill Content', icon: <Code size={18} /> },
    { id: 'preview', label: 'Preview', icon: <CheckCircle size={18} /> },
  ];

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'info') {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.category) newErrors.category = 'Category is required';
    }

    if (step === 'code') {
      if (!formData.content.trim()) newErrors.content = 'Skill content is required';
      if (formData.content.trim() === SKILL_TEMPLATE.trim()) {
        newErrors.content = 'Please customize the skill template';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 'info') {
        trackFormStepChanged('info', 'code');
        setCurrentStep('code');
      } else if (currentStep === 'code') {
        trackFormStepChanged('code', 'preview');
        setCurrentStep('preview');
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'code') {
      trackFormStepChanged('code', 'info');
      setCurrentStep('info');
    } else if (currentStep === 'preview') {
      trackFormStepChanged('preview', 'code');
      setCurrentStep('code');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('https://skillhu.bz/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          content: formData.content,
          authorName: formData.authorName.trim() || undefined,
          authorGithub: formData.authorGithub.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitResult({ success: true, slug: data.skill.slug });
        trackSkillSubmitted(data.skill.slug, formData.category, true);
      } else {
        setSubmitResult({ success: false, error: data.error || 'Failed to submit skill' });
        trackSkillSubmitted('', formData.category, false);
      }
    } catch (error) {
      setSubmitResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitResult?.success) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <motion.div
            className={styles.successCard}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle size={64} className={styles.successIcon} />
            <h1>Skill Published!</h1>
            <p>Your skill is now live on skillhu.bz</p>
            <div className={styles.successActions}>
              <Link to={`/skill/${submitResult.slug}`} className="btn btn-primary">
                View Your Skill
                <ExternalLink size={16} />
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSubmitResult(null);
                  setCurrentStep('info');
                  setFormData({
                    name: '',
                    description: '',
                    category: '' as Category | '',
                    tags: '',
                    content: SKILL_TEMPLATE,
                    authorName: formData.authorName,
                    authorGithub: formData.authorGithub,
                  });
                }}
              >
                Submit Another
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Submit a Skill</h1>
          <p>Share your automation with the community - published instantly</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          className={styles.progress}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`${styles.step} ${currentStep === step.id ? styles.active : ''} ${
                steps.findIndex((s) => s.id === currentStep) > index ? styles.completed : ''
              }`}
            >
              <div className={styles.stepIcon}>{step.icon}</div>
              <span className={styles.stepLabel}>{step.label}</span>
              {index < steps.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          className={styles.form}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Step 1: Basic Info */}
          {currentStep === 'info' && (
            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label htmlFor="name">
                  Skill Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="e.g., Gmail Auto-Reply Bot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? styles.inputError : ''}
                />
                {errors.name && (
                  <span className={styles.error}>
                    <AlertCircle size={14} />
                    {errors.name}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">
                  Description <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  placeholder="Briefly describe what your skill does..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={errors.description ? styles.inputError : ''}
                />
                {errors.description && (
                  <span className={styles.error}>
                    <AlertCircle size={14} />
                    {errors.description}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">
                  Category <span className={styles.required}>*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className={errors.category ? styles.inputError : ''}
                >
                  <option value="">Select a category</option>
                  {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(
                    ([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    )
                  )}
                </select>
                {errors.category && (
                  <span className={styles.error}>
                    <AlertCircle size={14} />
                    {errors.category}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tags">
                  <Tag size={16} />
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  placeholder="e.g., email, automation, productivity (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
                <span className={styles.hint}>Separate tags with commas</span>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="authorName">
                    <User size={16} />
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="authorName"
                    placeholder="John Doe"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="authorGithub">
                    <Github size={16} />
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    id="authorGithub"
                    placeholder="johndoe"
                    value={formData.authorGithub}
                    onChange={(e) => setFormData({ ...formData, authorGithub: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skill Content */}
          {currentStep === 'code' && (
            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label htmlFor="content">
                  Skill Instructions (Markdown) <span className={styles.required}>*</span>
                </label>
                <div className={styles.codeInputWrapper}>
                  <div className={styles.codeHeader}>
                    <span className={styles.languageDot} data-language="markdown" />
                    <span>Markdown</span>
                  </div>
                  <textarea
                    id="content"
                    rows={25}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className={`${styles.codeInput} ${errors.content ? styles.inputError : ''}`}
                  />
                </div>
                {errors.content && (
                  <span className={styles.error}>
                    <AlertCircle size={14} />
                    {errors.content}
                  </span>
                )}
                <span className={styles.hint}>
                  Write clear, step-by-step instructions that an AI agent can follow.
                  Include prerequisites, numbered steps, and error handling.
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 'preview' && (
            <div className={styles.stepContent}>
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <span
                    className={styles.previewCategory}
                    style={{
                      '--category-color': formData.category
                        ? CATEGORIES[formData.category].color
                        : 'var(--text-tertiary)',
                    } as React.CSSProperties}
                  >
                    {formData.category
                      ? CATEGORIES[formData.category].label
                      : 'No category'}
                  </span>
                </div>
                <h2 className={styles.previewTitle}>
                  {formData.name || 'Untitled Skill'}
                </h2>
                <p className={styles.previewDescription}>
                  {formData.description || 'No description provided'}
                </p>
                <div className={styles.previewTags}>
                  {formData.tags.split(',').filter(Boolean).map((tag) => (
                    <span key={tag.trim()} className={styles.previewTag}>
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
                <div className={styles.previewAuthor}>
                  <User size={16} />
                  <span>{formData.authorGithub || formData.authorName || 'Anonymous'}</span>
                </div>
              </div>

              <div className={styles.previewCode}>
                <div className={styles.codeHeader}>
                  <span className={styles.languageDot} data-language="markdown" />
                  <span>Markdown</span>
                </div>
                <pre className={styles.codePreview}>
                  <code>{formData.content || '// No content provided'}</code>
                </pre>
              </div>

              {submitResult?.error && (
                <div className={styles.submitError}>
                  <AlertCircle size={20} />
                  <span>{submitResult.error}</span>
                </div>
              )}

              <div className={styles.submitNotice}>
                <CheckCircle size={20} />
                <div>
                  <strong>Ready to publish</strong>
                  <p>
                    Your skill will be published instantly and available to everyone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {currentStep !== 'info' && (
              <button className="btn btn-secondary" onClick={handleBack} disabled={isSubmitting}>
                Back
              </button>
            )}
            <div className={styles.actionsSpacer} />
            {currentStep !== 'preview' ? (
              <button className="btn btn-primary" onClick={handleNext}>
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                <Upload size={16} />
                {isSubmitting ? 'Publishing...' : 'Publish Skill'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
