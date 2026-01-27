# Screenshot to Clipboard

Take a screenshot of a specific window or screen region and copy it to the clipboard for easy pasting.

## Prerequisites

- Windows 10/11 operating system
- Snipping Tool or similar screenshot utility available

## Instructions

1. Identify the target for the screenshot
   - Ask user if they want full screen, specific window, or custom region
   - If window: get the window title to capture
   - If region: get approximate coordinates or let user select

2. Take the screenshot using Windows Snipping Tool
   - Press Win + Shift + S to open Snipping Tool
   - Select the appropriate mode (rectangular, freeform, window, or fullscreen)
   - Click and drag to capture the desired area
   - The screenshot is automatically copied to clipboard

3. Confirm success
   - Check that the clipboard contains image data
   - Report to user that screenshot is ready to paste
   - Mention they can paste with Ctrl+V

## Error Handling

- If Snipping Tool doesn't open, try alternative: Win + PrtScn for fullscreen
- If clipboard is empty after capture, retry the screenshot
- If the target window is minimized, restore it first

## Notes

- Screenshots are stored in clipboard only (not saved to file by default)
- For saving to file, use Win + PrtScn which saves to Pictures/Screenshots
- Works with multiple monitors - user can select which screen
