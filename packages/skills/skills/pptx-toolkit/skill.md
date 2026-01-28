# PPTX Toolkit

Presentation creation, editing, and analysis for PowerPoint files (.pptx) with support for layouts, templates, and visual design.

## Prerequisites

- markitdown (pip) for text extraction
- pptxgenjs (npm) for creating presentations
- LibreOffice for PDF conversion
- Playwright for HTML rendering

## Instructions

### Reading Content

```bash
python -m markitdown presentation.pptx
```

For raw XML access:
```bash
python ooxml/scripts/unpack.py presentation.pptx output_dir
```

### Creating New Presentations (without template)

1. **Design First**
   - Consider subject matter, tone, audience
   - Choose color palette (18 preset options available)
   - Use web-safe fonts only

2. **Use html2pptx Workflow**
   - Create HTML file for each slide (720pt × 405pt for 16:9)
   - Use `<p>`, `<h1>`-`<h6>`, `<ul>`, `<ol>` for text
   - Convert HTML to PowerPoint using html2pptx.js

3. **Visual Validation**
   ```bash
   python scripts/thumbnail.py output.pptx workspace/thumbnails --cols 4
   ```

### Creating from Template

1. Extract text: `python -m markitdown template.pptx`
2. Create thumbnail grid for visual analysis
3. Create outline with template mapping
4. Rearrange slides: `python scripts/rearrange.py template.pptx working.pptx 0,34,34,50`
5. Extract inventory: `python scripts/inventory.py working.pptx text-inventory.json`
6. Generate replacement text JSON
7. Apply: `python scripts/replace.py working.pptx replacement.json output.pptx`

### Editing Existing Presentations

1. Unpack: `python ooxml/scripts/unpack.py file.pptx dir`
2. Edit XML files
3. Validate: `python ooxml/scripts/validate.py dir --original file`
4. Pack: `python ooxml/scripts/pack.py dir output.pptx`

## Error Handling

- Validate after each edit before packing
- Check thumbnail grid for text cutoff/overlap
- Ensure contrast for readability

## Notes

- Avoid "AI slop": excessive centered layouts, purple gradients, Inter font
- Use two-column layouts for charts/tables
- Slides are 0-indexed in scripts

Source: anthropics/skills
