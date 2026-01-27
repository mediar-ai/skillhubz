# Chrome Tab Organizer

Automatically organize Chrome tabs by grouping related tabs, closing duplicates, and sorting by domain.

## Prerequisites

- Chrome browser installed and running
- Multiple tabs open that need organizing

## Instructions

1. Open Chrome and identify all open tabs
   - Note the total number of tabs in the window
   - Look at the tab bar to see current tab arrangement

2. Identify and close duplicate tabs
   - For each tab, check if another tab has the same URL
   - If duplicates found, close all but one instance
   - Report how many duplicates were closed

3. Group tabs by domain
   - Identify all unique domains (e.g., github.com, google.com)
   - Right-click on a tab and select "Add tab to new group"
   - Name the group after the domain
   - Drag other tabs from the same domain into the group
   - Assign different colors to different domain groups

4. Sort groups alphabetically
   - Drag tab groups to arrange them in alphabetical order
   - Keep ungrouped tabs at the end

5. Report results
   - Count total tabs remaining
   - List the groups created
   - Report how many duplicates were removed

## Error Handling

- If Chrome is not responding, wait 5 seconds and retry
- If a tab cannot be moved, skip it and continue with others
- If tab grouping is disabled, report this to the user

## Notes

- This skill works best with 10+ open tabs
- Tab groups are a Chrome feature available in version 83+
- Groups persist across browser restarts