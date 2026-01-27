import { useState } from 'react';
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
} from 'lucide-react';
import { CATEGORIES, type Category } from '../types';
import styles from './SubmitPage.module.css';

type Step = 'info' | 'code' | 'preview';

export function SubmitPage() {
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '' as Category | '',
    tags: '',
    language: 'yaml' as 'yaml' | 'typescript' | 'javascript' | 'python',
    code: '',
    authorName: '',
    authorGithub: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Basic Info', icon: <FileText size={18} /> },
    { id: 'code', label: 'Code', icon: <Code size={18} /> },
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
      if (!formData.code.trim()) newErrors.code = 'Code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 'info') setCurrentStep('code');
      else if (currentStep === 'code') setCurrentStep('preview');
    }
  };

  const handleBack = () => {
    if (currentStep === 'code') setCurrentStep('info');
    else if (currentStep === 'preview') setCurrentStep('code');
  };

  const handleSubmit = () => {
    // TODO: Submit to backend
    alert('Skill submitted successfully! (Demo)');
  };

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
          <p>Share your automation with the community</p>
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

              <div className={styles.formRow}>
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
                  <label htmlFor="language">Language</label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        language: e.target.value as typeof formData.language,
                      })
                    }
                  >
                    <option value="yaml">YAML</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                  </select>
                </div>
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

          {/* Step 2: Code */}
          {currentStep === 'code' && (
            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label htmlFor="code">
                  Skill Code <span className={styles.required}>*</span>
                </label>
                <div className={styles.codeInputWrapper}>
                  <div className={styles.codeHeader}>
                    <span
                      className={styles.languageDot}
                      data-language={formData.language}
                    />
                    <span>{formData.language}</span>
                  </div>
                  <textarea
                    id="code"
                    placeholder={getCodePlaceholder(formData.language)}
                    rows={20}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`${styles.codeInput} ${errors.code ? styles.inputError : ''}`}
                  />
                </div>
                {errors.code && (
                  <span className={styles.error}>
                    <AlertCircle size={14} />
                    {errors.code}
                  </span>
                )}
              </div>

              <div className={styles.uploadSection}>
                <div className={styles.uploadBox}>
                  <Upload size={32} />
                  <p>Or drag & drop a file here</p>
                  <span>Supports .yaml, .ts, .js, .py files</span>
                </div>
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
                  <span>{formData.authorName || 'Anonymous'}</span>
                </div>
              </div>

              <div className={styles.previewCode}>
                <div className={styles.codeHeader}>
                  <span
                    className={styles.languageDot}
                    data-language={formData.language}
                  />
                  <span>{formData.language}</span>
                </div>
                <pre className={styles.codePreview}>
                  <code>{formData.code || '// No code provided'}</code>
                </pre>
              </div>

              <div className={styles.submitNotice}>
                <CheckCircle size={20} />
                <div>
                  <strong>Ready to submit</strong>
                  <p>
                    Your skill will be reviewed by our team before being published.
                    This usually takes 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {currentStep !== 'info' && (
              <button className="btn btn-secondary" onClick={handleBack}>
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
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Upload size={16} />
                Submit Skill
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function getCodePlaceholder(language: string): string {
  if (language === 'yaml') {
    return `name: my-skill
description: What this skill does

steps:
  - id: step_1
    tool: navigate_browser
    args:
      url: "https://example.com"
      process: chrome`;
  }
  if (language === 'typescript' || language === 'javascript') {
    return `import { Desktop } from 'terminator-sdk';

const desktop = new Desktop();

async function mySkill() {
  // Your automation code here
}

export { mySkill };`;
  }
  return `# Your code here`;
}
