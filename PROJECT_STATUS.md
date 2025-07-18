# Qookie - Project Status Summary

## Overview
This tool helps create content for openqase.com by researching quantum computing partnerships and generating structured case studies. It reads partnership data from a CSV file, searches for information using Claude API, and outputs markdown-formatted case studies.

## Current Status (December 2024)

### ✅ What's Working
1. **CSV Data Source** - Master list at `data/quantum-partnerships.csv` with 22 partnerships
2. **Repository Structure** - Basic file structure created
3. **GitHub Integration** - Code hosted at https://github.com/ddri/quantum-case-study-tool

### ❌ What Needs Fixing
1. **Empty Component Files** - Both component files have 0 bytes:
   - `src/components/CSVImportManager.jsx` (empty)
   - `src/components/SearchAllCasesFeature.jsx` (empty)
2. **Incomplete Main Component** - `src/QuantumCaseStudyProcessor.jsx` only contains a snippet
3. **Missing Setup Files** - No index.html, vite config, or proper package.json setup
4. **No Way to Run** - Project can't currently be executed

## Architecture Decisions

### Data Flow
```
CSV File → Parse → Search (Claude API) → Process → Generate Markdown → Export for openqase.com
```

### Key Features Planned
1. **CSV Import** - Read partnerships from `data/quantum-partnerships.csv`
2. **Search All** - Bulk search for missing research data
3. **Process Cases** - Generate structured case studies
4. **Export/Import** - Save/load research data as JSON
5. **Markdown Output** - Format ready for openqase.com

## File Structure Needed
```
quantum-case-study-tool/
├── data/
│   ├── quantum-partnerships.csv ✅ (exists)
│   ├── research-data.json ✅ (exists but empty)
│   └── README.md ✅ (exists)
├── src/
│   ├── components/
│   │   ├── CSVImportManager.jsx ❌ (empty - needs code)
│   │   └── SearchAllCasesFeature.jsx ❌ (empty - needs code)
│   ├── QuantumCaseStudyProcessor.jsx ❌ (incomplete - only snippet)
│   └── index.jsx ❌ (missing)
├── index.html ❌ (missing)
├── vite.config.js ❌ (missing)
├── package.json ❌ (incomplete - missing scripts and dev deps)
├── .gitignore ✅ (exists but minimal)
└── README.md ✅ (exists)
```

## Setup Instructions for Claude Code

### Step 1: Create Missing Files

#### 1.1 Update package.json
```json
{
  "name": "quantum-case-study-processor",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

#### 1.2 Create index.html (root directory)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quantum Case Study Processor</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.jsx"></script>
</body>
</html>
```

#### 1.3 Create vite.config.js (root directory)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
```

#### 1.4 Create src/index.jsx
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import QuantumCaseStudyProcessor from './QuantumCaseStudyProcessor.jsx';

// Mock the Claude API for local development
if (!window.claude) {
  window.claude = {
    complete: async (prompt) => {
      console.log('Claude API called (mock mode)');
      
      // Return mock responses for development
      if (prompt.includes('create a detailed case study')) {
        return JSON.stringify({
          introduction: "This is a mock case study introduction.",
          challenge: "Mock challenge description.",
          implementation: "Mock implementation details.",
          result_and_business_impact: "Mock results and impact.",
          future_directions: "Mock future directions."
        });
      }
      
      if (prompt.includes('Analyze this quantum computing')) {
        return JSON.stringify({
          algorithms: ["Quantum Optimization", "QAOA"],
          industries: ["Technology", "Research"],
          personas: ["Business Decision-Maker", "Quantum Solutions Provider"]
        });
      }
      
      if (prompt.includes('search for and provide')) {
        return JSON.stringify({
          found: true,
          title: "Mock Partnership",
          year: "2023",
          content: "Mock research content for development.",
          scientificReferences: [],
          companyResources: []
        });
      }
      
      return "{}";
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QuantumCaseStudyProcessor />
  </React.StrictMode>
);
```

### Step 2: Component Code Location

The full component code is too large to include here. Claude Code should:

1. Check the conversation history for the complete enhanced component
2. Look for the artifact titled "Complete Enhanced QuantumCaseStudyProcessor.jsx"
3. Also get the CSVImportManager component code from earlier artifacts

### Step 3: Run the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Should open at http://localhost:3000
```

## Integration with openqase.com

### Target Website Structure
- Next.js 14 with App Router
- Supabase for data and auth
- Static generation for performance
- Case studies at `/case-study/[slug]`
- Admin CMS at `/admin`

### Data Schema for openqase
```typescript
interface CaseStudy {
  title: string;
  slug: string;
  summary: string;
  content: string; // Markdown
  algorithms: string[];
  industries: string[];
  personas: string[];
  company: string;
  partner: string;
  year: string;
  scientific_references: Reference[];
  company_resources: Resource[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}
```

### Export Format
The tool should generate JSON that matches the openqase schema for easy import.

## Workflow

### Adding New Partnerships
1. Edit `data/quantum-partnerships.csv`
2. Add new row with incremental ID
3. Commit: `git commit -am "Add new partnership: X + Y"`
4. Run tool and search for new cases only

### Publishing to openqase
1. Generate case studies in this tool
2. Export as JSON or Markdown
3. Either:
   - Copy to openqase admin interface
   - Use Supabase API for direct upload
   - Bulk import via custom script

## Technical Notes

### CSV Parsing
- Handles quoted values for partners with commas
- Parses: id, quantum_company, commercial_partner, status, year, notes

### Research Data Storage
- Saves to localStorage automatically
- Can export/import as JSON
- Persists between sessions

### Claude API
- Real API only works in Claude.ai environment
- Mock API provided for local development
- Searches include retries and error handling

## Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Git
git status           # Check changes
git add .            # Stage all changes
git commit -m "msg"  # Commit
git push             # Push to GitHub

# Data Management
# Export research: Use UI button
# Import CSV: Use UI or edit file directly
```

## Priority Tasks for Claude Code

### High Priority
1. ✅ Get all component files populated with code
2. ✅ Ensure app runs locally
3. ✅ Test CSV import functionality

### Medium Priority
1. Test search functionality (with mock data)
2. Verify markdown generation
3. Test export/import of research data

### Low Priority
1. Plan direct integration with openqase
2. Add batch processing features
3. Improve error handling

## Contact & Resources
- **Owner**: David Ryan (david@openqase.com)
- **Tool Repo**: https://github.com/ddri/quantum-case-study-tool
- **Website**: https://openqase.com
- **Website Repo**: https://github.com/ddri/openqase

---
**Last Updated**: December 2024  
**Status**: Initial setup phase - components need code  
**Next Action**: Populate empty component files and test basic functionality