import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Initialize PostHog
  useEffect(() => {
    if (!POSTHOG_KEY) {
      console.warn('PostHog key not found');
      return;
    }
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'always',
      capture_pageview: false, // We'll handle pageviews manually
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '[data-ph-mask]',
      },
    });
  }, []);

  // Track pageviews on route changes
  useEffect(() => {
    const url = window.origin + location.pathname + location.search;
    posthog.capture('$pageview', { '$current_url': url });
  }, [location.pathname, location.search]);

  return <>{children}</>;
}
