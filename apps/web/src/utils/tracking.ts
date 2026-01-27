const TRACKING_URL = 'https://skillhu.bz/api/track';

export async function trackInstall(skillId: string): Promise<void> {
  try {
    await fetch(TRACKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'install', skill: skillId }),
    });
  } catch {
    // Fire and forget - don't block on tracking errors
  }
}

export async function trackStar(skillId: string): Promise<boolean> {
  try {
    const response = await fetch(TRACKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'star', skill: skillId }),
    });
    const data = await response.json();
    return data.persisted === true;
  } catch {
    return false;
  }
}

export async function trackSearch(query: string): Promise<void> {
  try {
    await fetch(TRACKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'search', query }),
    });
  } catch {
    // Fire and forget
  }
}
