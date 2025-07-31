# Data Directory

This directory contains the active data files used by the Qookie application.

## Files

- `quantum-partnerships.csv` - Live partnership data (edit this file to update data)
- `quantum-partnerships-template.csv` - Template for creating new CSV files
- `CSV-TEMPLATE-README.md` - Detailed documentation for CSV format and usage
- `research-data.json` - Generated research data (managed by the app)

## Quick Usage

To update partnerships, edit `quantum-partnerships.csv` and refresh the browser.

## CSV Format

- `id` - Unique numeric identifier
- `quantum_company` - The quantum computing company
- `commercial_partner` - The commercial/enterprise partner  
- `status` - Current status (active, completed, announced)
- `year` - Year of partnership announcement
- `notes` - Any additional notes

## Updating the CSV

1. Edit `quantum-partnerships.csv` with new partnerships
2. Ensure IDs are unique and sequential
3. Use quotes for partners with commas (e.g., "Accenture, Biogen")
4. Commit changes to track history

For detailed instructions, see `CSV-TEMPLATE-README.md`.