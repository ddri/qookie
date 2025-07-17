# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Setup
- `npm install` - Install dependencies

## Architecture Overview

This is a React-based quantum computing case study processor that generates structured case studies with AI assistance.

### Key Components
- **QuantumCaseStudyProcessor.jsx** - Main application component
- **CSVImportManager.jsx** - Handles CSV data import functionality
- **SearchAllCasesFeature.jsx** - Provides search functionality across case studies

### Data Structure
- Uses CSV files in `/public/data/` directory for quantum partnership data (copied from `/data/`)
- Expects CSV with columns: `id`, `quantum_company`, `commercial_partner`, `status`, `year`, `notes`
- Falls back to hardcoded data if CSV not available
- Currently loads 22 quantum partnerships from CSV

### Development Environment
- Uses Vite for build tooling with React plugin
- Includes mock Claude API implementation for local development (see `src/index.jsx:6-45`)
- Mock API responds to prompts about case study generation, analysis, and search

### Enhanced Research Engine
- **QuantumResearchEngine.js** - Advanced research system with quality standards
- **ResearchPromptSystem.js** - Structured prompting for comprehensive case studies
- Uses Barclays-Quantinuum reference case study as quality benchmark
- Generates detailed case studies matching professional standards
- Includes retry logic, caching, and validation systems
- Reference file: `/public/reference/ReferenceCaseStudy-Barclays-and-Quantinuum.md`

### Key Files
- `src/index.jsx` - Entry point with Claude API mock setup
- `data/quantum-partnerships.csv` - Source data for partnerships
- `vite.config.js` - Vite configuration with port 3000 and auto-open

### Dark Mode Support
- Full dark mode implementation with toggle in header
- Uses React Context for state management across all components
- Preference saved to localStorage for persistence
- All components styled with dark mode variants
- Toggle button shows sun/moon icons for visual feedback

### External Dependencies
- React 18.2.0
- Lucide React for icons
- Vite for build tooling

## Important Instructions
- NEVER add Claude attribution or co-author tags to git commits
- Keep commit messages clean and professional without AI tool references
- User will start servers themselves - do not run server commands automatically