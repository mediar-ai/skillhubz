# Screenshot Annotator

Capture screenshots and automatically annotate UI elements with descriptions.

## Prerequisites

- Target application running
- Output directory specified

## Instructions

1. Identify the target application:
   - Get process name from user
   - Verify application is running and visible

2. Capture the application window:
   - Take a screenshot of the full window
   - Save raw screenshot to output directory

3. Analyze UI elements in the window:

   a. Get the accessibility tree:
      - Identify all interactive elements
      - Note element roles (Button, Edit, Link, etc.)
      - Capture element names and labels

   b. Map elements to screen positions:
      - Get bounding boxes for each element
      - Calculate center points for annotations

4. Generate annotations:

   a. For each significant element:
      - Draw a numbered marker on the screenshot
      - Record element details:
        - Number
        - Role/Type
        - Name/Label
        - Position (x, y)
        - Size (width, height)

   b. Create annotation overlay:
      - Use contrasting colors for visibility
      - Add leader lines if needed
      - Group related elements

5. Generate documentation:

   a. Create annotated screenshot image:
      - Original screenshot + numbered markers

   b. Create element reference:
      ```markdown
      ## UI Elements

      1. **Login Button** (Button)
         - Position: (450, 300)
         - Size: 120x40
         - Action: Triggers login flow

      2. **Username Field** (Edit)
         - Position: (450, 200)
         - Size: 200x30
         - Input: Text field for username
      ```

6. Save outputs:
   - `screenshot_raw.png` - Original capture
   - `screenshot_annotated.png` - With markers
   - `elements.md` - Element documentation
   - `elements.json` - Structured data

## Error Handling

- If window not found, list available windows
- If elements overlap, use offset markers
- If window too large, capture in sections

## Notes

- Useful for creating UI documentation
- Helps with test automation planning
- Can be used for accessibility audits
