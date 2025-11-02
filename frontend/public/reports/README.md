# Reports Folder

Place your report file here.

## How to Add Your Report:

1. **Place your report file in this folder**
   - Example: `my-report.pdf`, `asset-report.docx`, etc.
   - Supported formats: PDF, Word (DOCX/DOC), Excel, Text, etc.

2. **Update the configuration** in `app/statistics/page.tsx` (around line 297):
   ```typescript
   const reportConfig = {
     title: 'Your Report Title',
     description: 'Your report description',
     fileName: 'my-report.pdf',  // Your file name here
     fileUrl: '/reports/my-report.pdf',  // Path to your file
   };
   ```

3. **Save and refresh** your browser!

## Example:
If your file is `annual-report-2024.pdf`:
- Place it here: `public/reports/annual-report-2024.pdf`
- Update:
  - `fileName: 'annual-report-2024.pdf'`
  - `fileUrl: '/reports/annual-report-2024.pdf'`

