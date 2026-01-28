# XLSX Toolkit

Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization.

## Prerequisites

- Python 3.8+
- Libraries: openpyxl, pandas
- Optional: LibreOffice (for formula recalculation)

## Instructions

1. **Read and analyze Excel data with pandas**
   ```python
   import pandas as pd
   df = pd.read_excel('file.xlsx')
   all_sheets = pd.read_excel('file.xlsx', sheet_name=None)
   df.describe()  # Statistics
   ```

2. **Create new Excel files with openpyxl**
   ```python
   from openpyxl import Workbook
   from openpyxl.styles import Font, PatternFill

   wb = Workbook()
   sheet = wb.active
   sheet['A1'] = 'Hello'
   sheet['B2'] = '=SUM(A1:A10)'  # Use formulas, not hardcoded values
   sheet['A1'].font = Font(bold=True)
   wb.save('output.xlsx')
   ```

3. **Edit existing files preserving formulas**
   ```python
   from openpyxl import load_workbook
   wb = load_workbook('existing.xlsx')
   sheet = wb.active
   sheet['A1'] = 'New Value'
   wb.save('modified.xlsx')
   ```

4. **Always use Excel formulas instead of hardcoding**
   ```python
   # WRONG: sheet['B10'] = total
   # CORRECT:
   sheet['B10'] = '=SUM(B2:B9)'
   sheet['C5'] = '=(C4-C2)/C2'
   sheet['D20'] = '=AVERAGE(D2:D19)'
   ```

5. **Financial model color standards**
   - Blue text: Hardcoded inputs
   - Black text: All formulas
   - Green text: Links from other sheets
   - Yellow background: Key assumptions

6. **Number formatting**
   - Currency: $#,##0 with units in headers
   - Percentages: 0.0% format
   - Negative numbers: Use parentheses (123) not -123

## Error Handling

- If formulas show errors (#REF!, #DIV/0!), verify cell references
- Use `data_only=True` to read calculated values (but formulas are lost)
- For large files, use `read_only=True` or `write_only=True`

## Notes

- Use pandas for data analysis and bulk operations
- Use openpyxl for formulas, formatting, and Excel-specific features
- Cell indices are 1-based in openpyxl
- Recalculate formulas with LibreOffice if needed

Source: anthropics/skills
