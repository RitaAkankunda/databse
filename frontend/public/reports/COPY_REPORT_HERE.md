# Copy Your Report Here

## Option 1: Manual Copy (Easiest)

1. Open File Explorer
2. Go to your Documents folder
3. Find your report file (PDF, Word, etc.)
4. Copy it (Ctrl+C)
5. Paste it in this folder: `databse/frontend/public/reports/`
6. Note the exact filename (e.g., `my-report.pdf`)

## Option 2: Using Command Line

If your report is named `report.pdf` in Documents, run this command in PowerShell:

```powershell
Copy-Item "$env:USERPROFILE\Documents\report.pdf" -Destination "databse\frontend\public\reports\report.pdf"
```

Replace `report.pdf` with your actual filename.

## Next Step

After copying, update the configuration in:
- File: `databse/frontend/app/statistics/page.tsx`
- Line: ~297
- Update: `fileName` and `fileUrl` with your actual filename

