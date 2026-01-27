import posthog from 'posthog-js';

// High Priority Events
export function trackSkillViewed(skillId: string, category: string, author: string) {
  posthog.capture('skill_viewed', { skill_id: skillId, category, author });
}

export function trackCodeCopied(skillId: string, source: 'main' | 'sidebar') {
  posthog.capture('code_copied', { skill_id: skillId, source });
}

export function trackInstallCommandCopied(skillId: string) {
  posthog.capture('install_command_copied', { skill_id: skillId });
}

export function trackSearchPerformed(query: string, resultsCount: number) {
  posthog.capture('search_performed', { query, results_count: resultsCount });
}

export function trackSkillSubmitted(skillId: string, category: string, success: boolean) {
  posthog.capture('skill_submitted', { skill_id: skillId, category, success });
}

export function trackCommentPosted(skillId: string) {
  posthog.capture('comment_posted', { skill_id: skillId });
}

// Medium Priority Events
export function trackSkillStarred(skillId: string, source: 'card' | 'detail') {
  posthog.capture('skill_starred', { skill_id: skillId, source });
}

export function trackCategorySelected(category: string, source: 'home' | 'explore') {
  posthog.capture('category_selected', { category, source });
}

export function trackFilterApplied(filterType: 'category' | 'featured' | 'verified', value: string | boolean) {
  posthog.capture('filter_applied', { filter_type: filterType, value });
}

export function trackSortChanged(sortBy: string) {
  posthog.capture('sort_changed', { sort_by: sortBy });
}

export function trackCommentLiked(commentId: string, skillId: string) {
  posthog.capture('comment_liked', { comment_id: commentId, skill_id: skillId });
}

export function trackTabSwitched(tab: 'code' | 'comments', skillId: string) {
  posthog.capture('tab_switched', { tab, skill_id: skillId });
}

// Lower Priority Events
export function trackCtaClicked(ctaName: string, location: string) {
  posthog.capture('cta_clicked', { cta_name: ctaName, location });
}

export function trackExternalLinkClicked(url: string, linkType: string) {
  posthog.capture('external_link_clicked', { url, link_type: linkType });
}

export function trackMobileMenuToggled(opened: boolean) {
  posthog.capture('mobile_menu_toggled', { opened });
}

export function trackFormStepChanged(fromStep: string, toStep: string) {
  posthog.capture('form_step_changed', { from_step: fromStep, to_step: toStep });
}

export function trackSkillCardClicked(skillId: string, position: number, source: 'home' | 'explore') {
  posthog.capture('skill_card_clicked', { skill_id: skillId, position, source });
}

export function trackFiltersCleared() {
  posthog.capture('filters_cleared');
}

export function trackFilterToggled(showFilters: boolean) {
  posthog.capture('filter_toggled', { show_filters: showFilters });
}
