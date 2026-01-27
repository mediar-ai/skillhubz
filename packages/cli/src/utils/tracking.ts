const TRACKING_URL = 'https://skillhu.bz/api/track';

// Get CLI version from package.json
let cliVersion = 'unknown';
try {
  // This will be replaced at build time or read from package
  cliVersion = process.env.npm_package_version || '0.1.0';
} catch {
  // Ignore
}

interface TrackingEvent {
  event: 'install' | 'search' | 'list' | 'remove' | 'init' | 'publish';
  skill?: string;
  query?: string;
}

export async function track(data: TrackingEvent): Promise<void> {
  // Fire and forget - don't block on tracking
  try {
    fetch(TRACKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        cli_version: cliVersion,
      }),
    }).catch(() => {
      // Silently ignore tracking errors
    });
  } catch {
    // Silently ignore tracking errors
  }
}
