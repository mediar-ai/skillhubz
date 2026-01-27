# GitHub PR Review Assistant

Review open pull requests in a GitHub repository, checking code changes and leaving review comments.

## Prerequisites

- Chrome browser installed
- Logged into GitHub
- Repository URL provided by user

## Instructions

1. Ask the user for:
   - The GitHub repository URL (e.g., `github.com/owner/repo`)
   - What to focus on in the review (security, performance, style, or general)

2. Navigate to the repository's Pull Requests tab:
   ```
   https://github.com/{owner}/{repo}/pulls
   ```

3. Wait for the PR list to load - confirm by looking for:
   - The "Pull requests" tab being highlighted
   - PR entries with titles, authors, and status indicators

4. Click on "Open" filter if not already selected to show only open PRs

5. For each open PR (or the specific PR if user specified one):

   a. Click on the PR title to open it

   b. Click on "Files changed" tab to see the diff

   c. Review each file change:
      - Look for the specific focus area the user requested
      - For **security**: Check for hardcoded secrets, SQL injection, XSS vulnerabilities
      - For **performance**: Look for N+1 queries, unnecessary loops, missing indexes
      - For **style**: Check naming conventions, code formatting, documentation
      - For **general**: Look for bugs, logic errors, edge cases

   d. To leave a comment on a specific line:
      - Hover over the line number on the left
      - Click the blue "+" button that appears
      - Type your review comment
      - Click "Add single comment" or "Start a review"

   e. After reviewing all files, scroll to the top and click "Review changes"

   f. Select the appropriate review type:
      - **Comment**: General feedback, no approval needed
      - **Approve**: Code looks good
      - **Request changes**: Issues must be fixed before merge

   g. Add a summary comment and click "Submit review"

6. Return to the PR list and continue with the next PR

7. Report a summary of PRs reviewed and comments left

## Error Handling

- If a PR has conflicts, note it but skip detailed review
- If files are too large (1000+ lines), focus on critical sections only
- If you can't determine the purpose of a change, leave a question comment

## Notes

- Be constructive in comments - suggest solutions, not just problems
- Reference specific line numbers when discussing code
- For large PRs, offer to do a more thorough review in a follow-up session
