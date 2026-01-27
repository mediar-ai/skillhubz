# Smart Form Filler

Intelligently fill web forms using AI-powered field detection and data mapping.

## Prerequisites

- Chrome browser installed
- Form data prepared (JSON object with field values)
- Target website accessible

## Instructions

1. Open Chrome and navigate to the form page URL provided by the user

2. Wait for the page to fully load:
   - Confirm the form is visible
   - Check that input fields are interactive

3. Analyze the form structure:
   - Identify all input fields (text, email, phone, etc.)
   - Identify select dropdowns and their options
   - Identify checkboxes and radio buttons
   - Note any required field indicators

4. Map provided data to form fields:
   - Match field names/labels to data keys
   - Handle variations (e.g., "firstName" matches "First Name")
   - Report any fields that couldn't be matched

5. Fill each field systematically:

   a. For text inputs:
      - Click the field to focus
      - Clear any existing value
      - Type the mapped value

   b. For select dropdowns:
      - Click to open the dropdown
      - Find and click the matching option

   c. For checkboxes/radio buttons:
      - Click to toggle if value requires it

   d. For date fields:
      - Enter in the expected format (check placeholder)

6. Before submitting, review all filled fields:
   - Verify values are correctly entered
   - Check for validation errors
   - Report the form state to user

7. If user confirms, click the Submit button

## Error Handling

- If a field has validation errors, report the specific error
- If CAPTCHA is present, stop and inform user
- If form requires login, stop and inform user

## Notes

- Does not automatically submit - waits for user confirmation
- Handles multi-page forms by processing one page at a time
- For complex forms, consider breaking into multiple runs
