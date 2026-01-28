import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { SkillCard } from '../components/SkillCard';
import { useSkills } from '../hooks/useSkills';
import { CATEGORIES, type Category } from '../types';
import {
  trackSearchPerformed,
  trackCategorySelected,
  trackFilterApplied,
  trackSortChanged,
  trackFiltersCleared,
  trackFilterToggled,
} from '../utils/analytics';
import styles from './ExplorePage.module.css';

type SortOption = 'popular' | 'newest' | 'stars' | 'name';

export function ExplorePage() {
  const { skills, loading } = useSkills();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const selectedCategory = searchParams.get('category') as Category | null;
  const showFeatured = searchParams.get('featured') === 'true';
  const showVerified = searchParams.get('verified') === 'true';

  const filteredSkills = useMemo(() => {
    let result = [...skills];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (skill) =>
          skill.name.toLowerCase().includes(query) ||
          skill.description.toLowerCase().includes(query) ||
          skill.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((skill) => skill.category === selectedCategory);
    }

    // Featured filter
    if (showFeatured) {
      result = result.filter((skill) => skill.featured);
    }

    // Verified filter
    if (showVerified) {
      result = result.filter((skill) => skill.verified);
    }

    // Sorting
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.installCount - a.installCount);
        break;
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'stars':
        result.sort((a, b) => b.stars - a.stars);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [skills, searchQuery, selectedCategory, showFeatured, showVerified, sortBy]);

  // Debounced search tracking
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (searchQuery) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        trackSearchPerformed(searchQuery, filteredSkills.length);
      }, 500);
    }
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, filteredSkills.length]);

  const handleCategoryClick = (category: Category | null) => {
    if (category) {
      searchParams.set('category', category);
      trackCategorySelected(category, 'explore');
      trackFilterApplied('category', category);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  const toggleFilter = (key: 'featured' | 'verified') => {
    const newValue = searchParams.get(key) !== 'true';
    if (newValue) {
      searchParams.set(key, 'true');
    } else {
      searchParams.delete(key);
    }
    trackFilterApplied(key, newValue);
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    trackFiltersCleared();
  };

  const hasActiveFilters =
    selectedCategory || showFeatured || showVerified || searchQuery;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <Loader2 size={48} className={styles.spinner} />
            <p>Loading skills...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Explore Skills</h1>
            <p>Discover Claude skills built by the community</p>
          </motion.div>
        </div>

        {/* Search and Filters Bar */}
        <motion.div
          className={styles.toolbar}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search skills, tags, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
            onClick={() => { const newState = !showFilters; setShowFilters(newState); trackFilterToggled(newState); }}
          >
            <SlidersHorizontal size={18} />
            Filters
            {hasActiveFilters && <span className={styles.filterBadge} />}
          </button>

          {/* Sort Dropdown */}
          <div className={styles.sortWrapper}>
            <ArrowUpDown size={16} />
            <select
              value={sortBy}
              onChange={(e) => { const value = e.target.value as SortOption; setSortBy(value); trackSortChanged(value); }}
              className={styles.sortSelect}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="stars">Most Stars</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </motion.div>

        {/* Expanded Filters */}
        {showFilters && (
          <motion.div
            className={styles.filtersPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Categories */}
            <div className={styles.filterGroup}>
              <h3>Category</h3>
              <div className={styles.filterOptions}>
                <button
                  className={`${styles.filterChip} ${!selectedCategory ? styles.active : ''}`}
                  onClick={() => handleCategoryClick(null)}
                >
                  All
                </button>
                {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(
                  ([key, value]) => (
                    <button
                      key={key}
                      className={`${styles.filterChip} ${selectedCategory === key ? styles.active : ''}`}
                      onClick={() => handleCategoryClick(key)}
                      style={
                        {
                          '--chip-color': value.color,
                        } as React.CSSProperties
                      }
                    >
                      {value.label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Quick Filters */}
            <div className={styles.filterGroup}>
              <h3>Quick Filters</h3>
              <div className={styles.filterOptions}>
                <button
                  className={`${styles.filterChip} ${showFeatured ? styles.active : ''}`}
                  onClick={() => toggleFilter('featured')}
                >
                  Featured
                </button>
                <button
                  className={`${styles.filterChip} ${showVerified ? styles.active : ''}`}
                  onClick={() => toggleFilter('verified')}
                >
                  <CheckCircle size={14} />
                  Verified
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <button className={styles.clearFilters} onClick={clearFilters}>
                <X size={14} />
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Results Info */}
        <div className={styles.resultsInfo}>
          <span>
            Showing <strong>{filteredSkills.length}</strong> skill
            {filteredSkills.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <button className={styles.clearLink} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {/* Skills Grid */}
        {filteredSkills.length > 0 ? (
          <div className={styles.skillsGrid}>
            {filteredSkills.map((skill, index) => (
              <SkillCard key={skill.id} skill={skill} index={index} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Search size={48} />
            </div>
            <h3>No skills found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
