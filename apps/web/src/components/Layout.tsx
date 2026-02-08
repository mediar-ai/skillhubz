import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Terminal,
  Search,
  Plus,
  Github,
  Twitter,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { trackMobileMenuToggled } from '../utils/analytics';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/#skills', label: 'Explore' },
    { path: '/submit', label: 'Submit Skill' },
  ];

  return (
    <div className={styles.layout}>
      {/* Ambient glow effect */}
      <div className={styles.ambientGlow} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoGroup}>
            <Link to="/" className={styles.logo}>
              <motion.div
                className={styles.logoIcon}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Terminal size={24} />
              </motion.div>
              <span className={styles.logoText}>
                skill<span className={styles.logoAccent}>hu.bz</span>
              </span>
            </Link>
            <a
              href="https://github.com/mediar-ai/skillhubz"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.openSourceBadge}
            >
              <Github size={14} />
              <span>Open Source</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.nav}>
            {navLinks.map((link) => {
              const isActive = link.path.startsWith('/#')
                ? location.pathname === '/' && location.hash === link.path.slice(1)
                : location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      className={styles.navIndicator}
                      layoutId="nav-indicator"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            <Link to="/#skills" className={styles.searchButton}>
              <Search size={18} />
            </Link>
            <Link to="/submit" className="btn btn-primary">
              <Plus size={16} />
              <span className={styles.submitText}>Submit</span>
            </Link>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => { const newState = !mobileMenuOpen; setMobileMenuOpen(newState); trackMobileMenuToggled(newState); }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.nav
            className={styles.mobileNav}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </motion.nav>
        )}
      </header>

      {/* Main Content */}
      <main className={styles.main}>{children}</main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.footerLogo}>
              <Terminal size={20} />
              <span>skillhu.bz</span>
            </Link>
            <p className={styles.footerTagline}>
              The community marketplace for AI-powered Claude skills.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Product</h4>
              <Link to="/#skills">Explore Skills</Link>
              <Link to="/submit">Submit Skill</Link>
              <Link to="/docs">Documentation</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Community</h4>
              <a href="https://github.com/mediar-ai/skillhubz" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://x.com/m13v_" target="_blank" rel="noopener noreferrer">Twitter</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/license">License</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2025 skillhu.bz. Built for the AI community.</p>
          <div className={styles.socialLinks}>
            <a href="https://github.com/mediar-ai/skillhubz" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github size={18} />
            </a>
            <a href="https://x.com/m13v_" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
