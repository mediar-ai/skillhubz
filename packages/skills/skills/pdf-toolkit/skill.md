# PDF Toolkit

Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms.

## Prerequisites

- Python 3.8+
- Libraries: pypdf, pdfplumber, reportlab
- Optional: pytesseract (for OCR), pdf2image, poppler-utils

## Instructions

1. **Read and extract text from PDFs**
   ```python
   from pypdf import PdfReader
   reader = PdfReader("document.pdf")
   text = ""
   for page in reader.pages:
       text += page.extract_text()
   ```

2. **Merge multiple PDFs**
   ```python
   from pypdf import PdfWriter, PdfReader
   writer = PdfWriter()
   for pdf_file in ["doc1.pdf", "doc2.pdf"]:
       reader = PdfReader(pdf_file)
       for page in reader.pages:
           writer.add_page(page)
   with open("merged.pdf", "wb") as output:
       writer.write(output)
   ```

3. **Split PDF into individual pages**
   ```python
   reader = PdfReader("input.pdf")
   for i, page in enumerate(reader.pages):
       writer = PdfWriter()
       writer.add_page(page)
       with open(f"page_{i+1}.pdf", "wb") as output:
           writer.write(output)
   ```

4. **Extract tables with pdfplumber**
   ```python
   import pdfplumber
   with pdfplumber.open("document.pdf") as pdf:
       for page in pdf.pages:
           tables = page.extract_tables()
           for table in tables:
               for row in table:
                   print(row)
   ```

5. **Create new PDFs with reportlab**
   ```python
   from reportlab.lib.pagesizes import letter
   from reportlab.pdfgen import canvas
   c = canvas.Canvas("new.pdf", pagesize=letter)
   c.drawString(100, 750, "Hello World!")
   c.save()
   ```

6. **OCR scanned PDFs**
   ```python
   import pytesseract
   from pdf2image import convert_from_path
   images = convert_from_path('scanned.pdf')
   for image in images:
       text = pytesseract.image_to_string(image)
   ```

## Error Handling

- If PDF is password-protected, use `PdfReader("file.pdf", password="pass")`
- If text extraction fails, try pdfplumber or OCR approach
- For corrupted PDFs, use qpdf to attempt repair

## Notes

- Use pypdf for basic operations (merge, split, rotate)
- Use pdfplumber for text/table extraction with layout
- Use reportlab for creating new PDFs programmatically
- Command-line tools: pdftotext, qpdf, pdftk for batch operations

Source: anthropics/skills
