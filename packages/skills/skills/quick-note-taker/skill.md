# Quick Note Taker

Quickly create and save a timestamped note to a local file.

## Prerequisites

- Write access to the current directory or specified location
- Text content to save

## Instructions

1. Get the note content from the user
   - Ask what they want to save
   - Accept multi-line input if needed

2. Generate a timestamp
   - Use format: YYYY-MM-DD_HH-MM-SS
   - This will be used in the filename

3. Create the note file
   - Filename: note_[timestamp].txt
   - Save to current directory or user-specified location
   - Include timestamp header in the file content

4. Confirm to user
   - Report the full path of the saved file
   - Show a preview of the content saved

## Error Handling

- If directory doesn't exist, create it
- If file already exists, append a number suffix
- If write fails, report the error clearly

## Notes

- Notes are saved as plain text files
- Good for quick captures during work sessions
- Files can be easily searched later
