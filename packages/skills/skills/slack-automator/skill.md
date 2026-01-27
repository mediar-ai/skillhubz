# Slack Message Automator

Schedule and automate Slack messages with rich formatting and attachments.

## Prerequisites

- Slack desktop app installed, OR
- Chrome browser with Slack web open
- Logged into the target workspace

## Instructions

1. Open Slack:

   **Desktop App:**
   - Activate the Slack application
   - Verify workspace is loaded

   **Web Version:**
   - Navigate to `app.slack.com`
   - Confirm logged in to correct workspace

2. Navigate to target channel/DM:

   a. Use Quick Switcher:
      - Press Cmd/Ctrl + K
      - Type channel name or person's name
      - Press Enter to select

   b. Verify correct destination:
      - Check channel name in header
      - Confirm you have permission to post

3. Compose the message:

   a. Click the message input field

   b. Type the message content:
      - Support markdown formatting:
        - *bold* with asterisks
        - _italic_ with underscores
        - `code` with backticks
        - > quotes with greater than
      - Add emoji with :emoji_name:
      - Mention users with @username
      - Link channels with #channel

   c. For attachments:
      - Click the + button
      - Select file to upload
      - Add optional comment

4. For scheduled messages:

   a. Instead of Send, click the dropdown arrow
   b. Select "Schedule for later"
   c. Choose date and time
   d. Confirm scheduling

5. Send or schedule the message:
   - Click Send button (or press Cmd/Ctrl + Enter)
   - Wait for confirmation

6. Verify delivery:
   - Check message appears in channel
   - For scheduled: verify in "Scheduled" section

## Error Handling

- If channel not found, list available channels
- If no permission to post, inform user
- If attachment too large, suggest alternatives
- If rate limited, wait and retry

## Notes

- Respects workspace message formatting settings
- Scheduled messages can be edited before sending
- For recurring messages, consider Slack Workflow Builder
- Thread replies: click "Reply in thread" first
