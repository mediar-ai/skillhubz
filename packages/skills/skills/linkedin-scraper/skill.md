# LinkedIn Profile Scraper

Ethically scrape public LinkedIn profiles for lead generation and research.

## Prerequisites

- Chrome browser installed
- Logged into LinkedIn
- List of profile URLs to scrape

## Instructions

1. Open Chrome and verify you're logged into LinkedIn:
   - Navigate to `linkedin.com`
   - Confirm your profile icon appears in the top nav
   - If not logged in, stop and inform user

2. For each profile URL provided:

   a. Navigate to the profile URL

   b. Wait for the profile to fully load:
      - Profile photo area visible
      - Name and headline visible
      - Experience section loaded

   c. Extract basic information:
      - Full name (h1 element)
      - Headline/title
      - Location
      - Profile photo URL
      - Connection count (if visible)

   d. Scroll down to load more sections

   e. Extract experience:
      - Current position and company
      - Previous positions (last 3)
      - Duration at each role

   f. Extract education:
      - School names
      - Degrees and fields of study
      - Years attended

   g. Extract skills (if visible):
      - Top skills listed
      - Endorsement counts

   h. Add a 2-3 second delay before next profile (rate limiting)

3. Compile all extracted data into requested format:
   - JSON: structured object per profile
   - CSV: one row per profile with columns

4. Report summary:
   - Total profiles processed
   - Any profiles that failed
   - Output file location

## Error Handling

- If "Profile not found", skip and note in output
- If rate limited, pause for 5 minutes then resume
- If logged out, stop and inform user

## Notes

- Respects LinkedIn's terms of service
- Uses delays to avoid rate limiting
- Only extracts publicly visible information
- For Sales Navigator data, use the `linkedin-sales-nav` skill
