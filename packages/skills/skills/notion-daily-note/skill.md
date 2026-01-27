# Notion Daily Note Creator

Create a daily note in Notion with a structured template for planning your day.

## Prerequisites

- Chrome browser installed
- Logged into Notion
- A workspace with a "Daily Notes" page or database

## Instructions

1. Open Chrome and navigate to `notion.so`

2. Wait for Notion to fully load - confirm by looking for:
   - Your workspace sidebar on the left
   - The main content area loaded

3. In the left sidebar, locate and click on "Daily Notes" page or database
   - If it doesn't exist, ask the user where they want daily notes stored
   - Navigate to that location

4. Create a new page:
   - If in a database: Click "+ New" button
   - If in a regular page: Click in empty area and type `/page` then Enter

5. Set the page title to today's date in format:
   ```
   📅 YYYY-MM-DD - Day of Week
   ```
   Example: `📅 2024-01-15 - Monday`

6. Add the daily note template structure:

   a. Type the following sections, pressing Enter between each:

   ```
   ## 🎯 Today's Focus
   What is the ONE thing that matters most today?
   - [ ]

   ## 📋 Tasks
   - [ ]
   - [ ]
   - [ ]

   ## 📅 Schedule
   | Time | Activity |
   |------|----------|
   | 9:00 | |
   | 10:00 | |
   | 11:00 | |
   | 12:00 | Lunch |
   | 13:00 | |
   | 14:00 | |
   | 15:00 | |
   | 16:00 | |
   | 17:00 | |

   ## 📝 Notes


   ## 🌟 Wins & Gratitude
   -
   ```

7. After creating the template:
   - Click at the end of "Today's Focus" section
   - Position cursor ready for user input

8. Inform the user the daily note is ready and ask what their main focus is for today

## Error Handling

- If Notion is slow to load, wait up to 10 seconds before reporting an issue
- If "Daily Notes" doesn't exist, offer to create it
- If a note for today already exists, ask if user wants to open it instead

## Customization

Users can request modifications:
- Different template sections
- Time slots for schedule
- Additional emoji or formatting
- Link to yesterday's note

## Notes

- The template uses Notion's native checkbox, table, and heading features
- Times are in 24-hour format; adjust based on user preference
- Consider linking to relevant project pages if the user mentions specific work
