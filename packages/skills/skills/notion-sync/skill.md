# Notion Database Sync

Bi-directional sync between Notion databases and local files or other services.

## Prerequisites

- Chrome browser installed
- Logged into Notion
- Database URL or ID provided

## Instructions

1. Open Chrome and navigate to `notion.so`

2. Verify login status:
   - Check for workspace switcher in sidebar
   - If not logged in, stop and inform user

3. Navigate to the target database:
   - Use provided database URL, or
   - Search for database by name using Cmd/Ctrl+P

4. Determine sync direction based on user request:

   **For PULL (Notion -> Local):**

   a. Open database in table view for best extraction

   b. Identify all columns/properties:
      - Property names and types
      - Any formulas or rollups

   c. Extract all rows:
      - Click each row to get full content
      - Or use Export function for bulk extract

   d. Format data as requested:
      - JSON: array of objects with property names as keys
      - CSV: header row + data rows
      - Markdown: formatted list or table

   e. Save to specified local path

   **For PUSH (Local -> Notion):**

   a. Read local data file

   b. Parse data structure

   c. For each record:
      - Click "New" to create row
      - Fill in each property
      - Handle different property types appropriately

   d. Verify row count matches expected

   **For BIDIRECTIONAL:**

   a. Pull current Notion state
   b. Compare with local file
   c. Identify changes in both directions
   d. Apply changes with conflict resolution
   e. Report sync summary

5. Report results:
   - Records synced
   - Any errors or conflicts
   - Timestamp of sync

## Error Handling

- If database structure changed, report mismatch
- If permission denied, inform user
- If data types don't match, attempt conversion or skip

## Notes

- Large databases may require pagination
- Formula and rollup fields are read-only
- Relations sync as page references
