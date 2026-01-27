# Gmail Auto-Reply

Automatically reply to unread support emails in Gmail with an acknowledgment message.

## Prerequisites

- Chrome browser installed
- Logged into Gmail

## Instructions

1. Open Chrome and navigate to `mail.google.com`

2. Wait for the inbox to fully load - confirm by looking for:
   - The red Compose button on the left sidebar
   - The inbox email list in the main area
   - Your profile picture in the top right

3. Click the search bar at the top of the page and type:
   ```
   is:unread from:support
   ```
   Then press Enter to search

4. Check if there are any results:
   - If "No messages matched your search" appears, report that there are no unread support emails and stop
   - If emails appear, continue to step 5

5. For each unread email in the search results:

   a. Click on the email row to open the email thread

   b. Read the email content to understand the inquiry

   c. Click the Reply button (curved arrow icon) or press 'R'

   d. In the reply compose area, type an appropriate acknowledgment:
      ```
      Thank you for reaching out. We have received your message and
      will get back to you within 24-48 hours.

      Best regards
      ```

   e. Click the Send button (blue button with paper airplane icon)

   f. Wait for the "Message sent" confirmation to appear

   g. Click the back arrow or press 'U' to return to the search results

6. After processing all emails, report how many emails were replied to

## Error Handling

- If Gmail asks for re-authentication, stop and inform the user
- If an email thread is too complex (multiple participants), skip it and note it for manual review
- If the Send button is disabled, check if there's a recipient error

## Notes

- This skill sends the same acknowledgment to all support emails
- For customized replies based on email content, consider using the `gmail-smart-reply` skill instead
