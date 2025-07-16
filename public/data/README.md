# Data Directory

This directory contains the source data for quantum computing case studies.

## Files

- `quantum-partnerships.csv` - Master list of quantum computing partnerships
- `research-data.json` - Completed research data (auto-generated)

## Updating the CSV

1. Edit `quantum-partnerships.csv` with new partnerships
2. Ensure IDs are unique and sequential
3. Use quotes for partners with commas (e.g., "Accenture, Biogen")
4. Commit changes to track history

## CSV Format

- `id` - Unique numeric identifier
- `quantum_company` - The quantum computing company
- `commercial_partner` - The commercial/enterprise partner  
- `status` - Current status (active, completed, announced)
- `year` - Year of partnership announcement
- `notes` - Any additional notes