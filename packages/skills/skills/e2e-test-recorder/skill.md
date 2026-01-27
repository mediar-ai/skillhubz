# E2E Test Recorder

Record user interactions and generate Playwright/Cypress test scripts automatically.

## Prerequisites

- Chrome browser installed
- Target web application accessible
- Desired test framework specified (Playwright or Cypress)

## Instructions

1. Open Chrome and navigate to the starting URL provided by user

2. Begin recording mode:
   - Note the initial URL and page state
   - Prepare to capture all user interactions

3. Guide user through the test scenario:
   - Ask user to describe what they want to test
   - Confirm the expected flow (e.g., "login -> dashboard -> create item")

4. For each user interaction, capture:

   a. Click events:
      - Element selector (prefer data-testid, then role, then CSS)
      - Element text content for verification
      - Position on page

   b. Type events:
      - Target input field selector
      - Text being entered (mask passwords)
      - Any special keys (Enter, Tab)

   c. Navigation events:
      - New URLs visited
      - Page load confirmations

   d. Assertions to add:
      - Visible text confirmations
      - Element presence checks
      - URL validations

5. After user completes the flow, generate test code:

   For Playwright:
   ```typescript
   test('descriptive test name', async ({ page }) => {
     await page.goto('starting-url');
     await page.click('[data-testid="button"]');
     await expect(page.locator('text=Success')).toBeVisible();
   });
   ```

   For Cypress:
   ```javascript
   describe('Test Suite', () => {
     it('descriptive test name', () => {
       cy.visit('starting-url');
       cy.get('[data-testid="button"]').click();
       cy.contains('Success').should('be.visible');
     });
   });
   ```

6. Output the generated test file and provide instructions for running it

## Error Handling

- If element has no good selector, suggest adding data-testid
- If page has dynamic content, add appropriate waits
- If authentication is needed, generate login helper

## Notes

- Generated tests use best practices for selectors
- Includes automatic wait handling for async operations
- Add custom assertions by describing what to verify
