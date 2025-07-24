# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server (runs on port 3555)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Setup
- `npm install` - Install dependencies

## Architecture Overview

This is Qookie - a React-based quantum computing case study processor that generates structured case studies with AI assistance.

### Key Components
- **QuantumCaseStudyProcessor.jsx** - Main application component
- **CSVImportManager.jsx** - Handles CSV data import functionality
- **SearchAllCasesFeature.jsx** - Provides search functionality across case studies

### Data Structure
- Uses CSV files in `/public/data/` directory for quantum partnership data
- Expects CSV with columns: `id`, `quantum_company`, `commercial_partner`, `year`, `notes`
- Falls back to hardcoded data if CSV not available
- Template and documentation available in `/data/CSV-TEMPLATE-README.md`

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
- `vite.config.js` - Vite configuration with port 3555 and auto-open

### Dark Mode Support
- Full dark mode implementation with toggle in header
- Uses React Context for state management across all components
- Preference saved to localStorage for persistence
- All components styled with dark mode variants
- Toggle button shows sun/moon icons for visual feedback

### GitHub Integration
- **Case Study Backup**: Automatic backup of case studies to GitHub repositories
- **Dual Format Export**: Pushes both markdown and JSON files to `exports/` folder
- **API Endpoint**: `/api/github/push` handles GitHub API integration
- **Configuration**: Requires `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, and `GITHUB_REPO_NAME` in `.env`
- **UI Integration**: "Push to GitHub" button with status feedback and toast notifications

### OpenQase Export Integration
- **Enhanced Export Pipeline**: Export case studies in OpenQase-compatible JSON format with comprehensive validation
- **Format Compliance**: Follows OpenQase v1.0 specification with required metadata structure
- **Data Transformation**: Maps Qookie's case study structure to OpenQase's `main_content` format
- **Category Mapping**: Transforms algorithms, industries, personas, and technologies to OpenQase taxonomy
- **Quality Metadata**: Includes confidence levels, data sources, word counts, and research dates

#### Export Enhancement Features (Phase 1 & 2)
- **Validation Engine**: Pre-export quality checks with critical error blocking (`ValidationEngine.js`)
- **Error Handling**: Graceful degradation with fallback values (`ExportErrorHandler.js`)
- **Quality Scoring**: Comprehensive 0-100% quality metrics (`QualityScorer.js`)
- **Export Preview**: Interactive modal with case study selection (`ExportPreviewModal.jsx`)
- **Quality Indicators**: Visual quality status for each case study (`CaseStudyCard.jsx`)
- **Selective Export**: Choose which case studies to include/exclude from export
- **Real-time Validation**: Shows critical errors, warnings, and quality scores before export

#### Technical Implementation
- **Export Location**: `App.jsx:1075` - Enhanced `exportAllToOpenQase()` function
- **UI Access**: "🚀 Export for OpenQase" button opens preview modal
- **File Output**: Downloads as `qookie-openqase-export-[timestamp].json`
- **Validation Rules**: 15 quality checks (critical errors block export, warnings allow export)
- **Quality Metrics**: Content completeness, word count, metadata richness, confidence scoring

### External Dependencies
- React 18.2.0
- Lucide React for icons
- Vite for build tooling

## Important Instructions

### Git Commit Rules
- **NEVER add Claude attribution or co-author tags to git commits**
- **NEVER include "Generated with Claude Code" or similar AI tool references**
- **NEVER add "Co-Authored-By: Claude" or any AI attribution**
- Keep commit messages clean and professional
- Write commits as if they were written by a human developer

### Development Rules
- User will start servers themselves - do not run server commands automatically
- Only the user can run `npm run dev`, `node server.js`, or similar commands