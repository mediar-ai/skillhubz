# Web Application Testing

Toolkit for interacting with and testing local web applications using Playwright. Verify frontend functionality, debug UI behavior, capture screenshots, and view browser logs.

## Prerequisites

- Python with Playwright installed
- Local web application to test
- Understanding of web selectors

## Instructions

### Decision Tree

```
Is it static HTML?
├─ Yes → Read HTML file directly for selectors
│        → Write Playwright script
└─ No (dynamic webapp)
   ├─ Server not running → Use with_server.py helper
   └─ Server running → Reconnaissance-then-action pattern
```

### Using with_server.py

**Single server:**
```bash
python scripts/with_server.py --server "npm run dev" --port 5173 -- python automation.py
```

**Multiple servers:**
```bash
python scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python automation.py
```

### Playwright Script Template

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')  # CRITICAL for dynamic apps
    # ... automation logic
    browser.close()
```

### Reconnaissance-Then-Action

1. **Inspect rendered DOM:**
   ```python
   page.screenshot(path='/tmp/inspect.png', full_page=True)
   content = page.content()
   page.locator('button').all()
   ```

2. **Identify selectors** from inspection

3. **Execute actions** using discovered selectors

### Best Practices

- Always wait for `networkidle` before DOM inspection
- Use sync_playwright() for synchronous scripts
- Always close browser when done
- Use descriptive selectors: `text=`, `role=`, CSS, IDs

## Error Handling

- Don't inspect DOM before waiting for networkidle
- Add waits: `page.wait_for_selector()` or `page.wait_for_timeout()`
- Use bundled scripts as black boxes - run `--help` first

## Notes

- Helper scripts handle common workflows reliably
- Examples: element_discovery.py, static_html_automation.py
- Capture console logs with console_logging.py

Source: anthropics/skills
