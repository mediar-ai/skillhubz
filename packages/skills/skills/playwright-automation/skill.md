# Playwright Browser Automation

General-purpose browser automation for testing pages, filling forms, taking screenshots, and any browser task.

## Prerequisites

- Node.js
- Playwright (`npm run setup` in skill directory)

## Instructions

### Critical Workflow

1. **Auto-detect dev servers** (for localhost testing):
   ```bash
   node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
   ```

2. **Write scripts to /tmp** - Never clutter project directories

3. **Use visible browser** - `headless: false` by default

4. **Parameterize URLs** - Make URLs configurable

### Basic Pattern

```javascript
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(TARGET_URL);
  console.log('Page loaded:', await page.title());

  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
  await browser.close();
})();
```

### Common Patterns

**Test Login Flow:**
```javascript
await page.goto(`${TARGET_URL}/login`);
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard');
```

**Responsive Design Testing:**
```javascript
const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.screenshot({ path: `/tmp/${vp.name.toLowerCase()}.png` });
}
```

**Check Broken Links:**
```javascript
const links = await page.locator('a[href^="http"]').all();
for (const link of links) {
  const href = await link.getAttribute('href');
  const response = await page.request.head(href);
  console.log(href, response.ok() ? '✅' : '❌');
}
```

### Helper Functions

- `detectDevServers()` - Find running dev servers
- `safeClick(page, selector)` - Click with retry
- `safeType(page, selector, text)` - Type with clear
- `takeScreenshot(page, name)` - Timestamped screenshot
- `handleCookieBanner(page)` - Dismiss cookie popups

## Guidelines

1. Detect servers FIRST for localhost testing
2. Write test files to `/tmp/playwright-test-*.js`
3. Use `headless: false` unless explicitly requested
4. Use `waitForURL`, `waitForSelector` instead of fixed timeouts
5. Always use try-catch for robust automation

## Notes

- Custom code for any browser task
- Auto-detects running dev servers
- Test files auto-cleaned from /tmp

Source: lackeyjb/playwright-skill
