# PDF Data Extractor

Extract structured data from PDF documents using OCR and pattern matching.

## Prerequisites

- Chrome browser installed
- PDF file accessible locally or via URL

## Instructions

1. Open Chrome and navigate to the PDF file:
   - If local file: use `file:///path/to/document.pdf`
   - If URL: navigate directly to the PDF URL

2. Wait for the PDF to fully load in Chrome's PDF viewer:
   - Confirm the page count is visible
   - Confirm text is selectable (if not scanned)

3. Use Chrome DevTools to extract text content:
   - Press F12 to open DevTools
   - Go to Console tab
   - For each page, extract visible text

4. For scanned PDFs without selectable text:
   - Take a screenshot of each page
   - Use OCR to extract text from screenshots
   - Clean up OCR results for accuracy

5. Parse extracted text for structured data:
   - Look for key-value patterns (e.g., "Name: John Doe")
   - Identify tables by detecting aligned columns
   - Extract dates, amounts, and other formatted data

6. Output the extracted data in requested format:
   - JSON for structured data
   - CSV for tabular data
   - Plain text for unstructured content

## Error Handling

- If PDF is password protected, inform user and request password
- If OCR quality is poor, suggest higher resolution scan
- If PDF has complex layouts, process page by page manually

## Notes

- Works best with text-based PDFs
- Scanned documents require OCR and may have lower accuracy
- For invoices and receipts, consider the `invoice-parser` skill
