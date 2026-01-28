# DOCX Toolkit

Comprehensive document creation, editing, and analysis for Word documents (.docx) with support for tracked changes, comments, and formatting preservation.

## Prerequisites

- pandoc (for text extraction)
- docx-js (npm) for creating new documents
- Python with defusedxml for editing

## Instructions

### Reading/Analyzing Content

1. **Text Extraction with pandoc**
   ```bash
   pandoc --track-changes=all document.docx -o output.md
   ```

2. **Raw XML Access** (for comments, formatting, metadata)
   ```bash
   python ooxml/scripts/unpack.py document.docx output_dir
   ```
   Key files: `word/document.xml`, `word/comments.xml`, `word/media/`

### Creating New Documents

Use **docx-js** (JavaScript):
```javascript
import { Document, Paragraph, TextRun } from 'docx';

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ children: [new TextRun("Hello World")] })
    ]
  }]
});
```

### Editing Existing Documents

1. Unpack: `python ooxml/scripts/unpack.py file.docx dir`
2. Edit XML files using Document library
3. Pack: `python ooxml/scripts/pack.py dir file.docx`

### Redlining Workflow (Tracked Changes)

For legal, academic, business docs - use minimal, precise edits:
```python
# Only mark text that actually changes
# Preserve original run's RSID for unchanged text
```

1. Get markdown: `pandoc --track-changes=all file.docx -o current.md`
2. Identify and group changes (3-10 per batch)
3. Map text to XML, implement changes
4. Pack and verify

## Error Handling

- If password-protected, use decryption tools first
- Validate XML after each edit before packing
- Test tracked changes in Word to verify rendering

## Notes

- Tracked changes: `<w:ins>` (insertions), `<w:del>` (deletions)
- Convert to images: soffice → PDF → pdftoppm

Source: anthropics/skills
