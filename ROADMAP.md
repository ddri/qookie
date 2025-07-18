# Qookie - Roadmap

## Current Status
- ✅ Real Claude AI integration with Express backend
- ✅ Master-detail UI layout (partnerships list + case study display)
- ✅ localStorage caching for generated case studies
- ✅ Regeneration capability with force refresh
- ✅ Recently researched history tracking
- ✅ Cached status indicators in UI
- ✅ Three-stage workflow: Generate → Analyze → Collect References
- ✅ Web search integration for real academic papers and business coverage
- ✅ Markdown export with all sections (case study + metadata + references)
- ✅ GitHub integration for automatic case study backup
- ✅ Proper functional separation architecture (dedicated API endpoints)
- ✅ Claude 4 model support with model selection

## In Progress
- 🔄 Improve references search quality and relevance

## Critical Bugs to Fix
- 🐛 **Advanced Analysis Reference Lists Bug**
  - Analysis consistently shows "No reference lists were provided for matching"
  - Reference lists appear empty during analysis even when loaded successfully
  - Need to debug: reference list loading timing, prompt construction, or data passing
  - Results in analysis showing "None specified" for algorithms, industries, personas
  - May be frontend state issue, prompt building issue, or API parameter passing issue

## Next Priority Features

### Data Management & Transparency
- **Explicit Data Source Management**
  - Data source indicator showing partnership count, source file, and last loaded time
  - "Refresh Data" button for manual data reloading
  - Data dashboard panel with detailed dataset information
  - Data quality validation (missing fields, duplicates)
  - Clear error handling for missing/corrupt CSV files
  - Progressive disclosure: basic info always visible, details on demand

### Batch Processing & Automation
- **Staged Batch Processing System**
  - Multi-select checkboxes on partnership cards
  - "Generate All Unprocessed" / "Analyze All Generated" / "Collect References for All Analyzed" buttons
  - Background queue system with progress tracking
  - Intelligent rate limiting and API throttling
  - Resume capability for interrupted batches
  - Progress indicators per item and overall batch
  - Graceful error handling with retry logic
  - Non-blocking UI during batch operations
  - Batch completion notifications
  - Queue management (pause, cancel, reorder)

### Activity Logging & History
- **Redesign "Recently Researched" Section**
  - Replace card-based view with proper activity log design
  - Table/list format with columns: timestamp, partnership, action, status
  - Filtering and search capabilities (by date, partnership, action type)
  - Export activity logs for analysis
  - Performance metrics (generation time, success/failure rates)
  - Action replay/rerun capabilities from history
  - Better visual hierarchy and information density
  - Pagination for large activity histories
  - Group related actions (Generate → Analyze → References) as single workflow

### Content Marketing Pipeline
- **Multi-Channel Content Repurposing System**
  - Extended workflow: Generate → Analyze → References → **Content Repurposing** → Multi-channel Publishing
  - AI-powered content adaptation for different platforms and audiences
  - Integration with BEBOP CMS for content management and publishing workflow
  - OpenQase website integration for blog and case study hosting

- **Blog Post Generation ("Featured Case Study of the Week")**
  - Long-form content adaptation (800-1500 words)
  - Professional, authoritative, SEO-optimized tone
  - Structured format: introduction, key insights, business implications, conclusion
  - Headlines, subheadings, pull quotes, and key takeaways
  - Optimized for thought leadership and organic search traffic

- **LinkedIn Content Optimization**
  - Professional networking tone for business audiences
  - Business-focused insights with industry implications
  - Structured format: hook, insights, business impact, engagement question
  - Character optimization (150-300 words optimal)
  - Professional hashtags and industry terminology
  - Thought leadership positioning

- **Social Media Content (Bluesky/Mastodon)**
  - Bite-sized, accessible content snippets
  - Casual, engaging tone for broader audiences
  - Multiple post formats: single posts and thread capability
  - Character optimization (280-500 characters)
  - Platform-specific hashtags and engagement strategies
  - Key insights with context and call-to-action

- **Content Strategy Benefits**
  - Content efficiency: Single research effort → multiple content pieces
  - Multi-platform audience reach and engagement
  - SEO value through consistent blog content publication
  - Thought leadership establishment through regular, high-quality content
  - Brand authority building in quantum computing space

### Export & Integration
- **Enhanced GitHub Integration** 
  - Organized folder structure by year/topic
  - Batch export capabilities
  - Auto-generated README index files

### Data Persistence & Backup
- **GitHub-Based State Management**
  - "Backup to GitHub" functionality for complete localStorage state
  - Save as `backup/localStorage-backup-{timestamp}.json` with automatic versioning
  - Includes all cached case studies, preferences, and research history
  - Periodic auto-backup option with configurable intervals
  - "Restore from GitHub" with backup selection interface
  - Preview/diff functionality before restoring
  - Selective restore for specific case studies
  - Cross-device synchronization via shared backup repository
  - Team collaboration through shared backup repos
  - Complete disaster recovery solution
  - Machine migration support (work on any device)
  - Version history tracking for all backups
  - No additional infrastructure required - leverages existing GitHub integration

### Search & Filter
- Search partnerships by company name, status, year
- Filter partnership list (Active, Completed, etc.)
- Search through cached case studies content
- Advanced filtering combinations

### Batch Operations
- Generate multiple case studies at once
- "Generate All" button for selected partnerships
- Progress indicators for batch operations
- Queue management for API rate limits

### Enhanced References & Search
- Improve search query optimization for better academic paper results
- Add direct integration with arXiv, PubMed, and other academic databases
- Implement smarter relevance scoring and filtering
- Add citation quality verification
- Support for DOI lookup and metadata enrichment

### Enhanced UI/UX
- Responsive design for mobile/tablet devices
- Loading animations and micro-interactions
- Better visual hierarchy and typography
- Print-friendly case study formatting

### Advanced Features
- Case study comparison tool
- Export to PDF and Word formats
- API rate limit handling and retry logic
- Usage analytics and statistics dashboard

## Technical Improvements
- Error handling improvements with actionable messages
- Performance optimization for large partnership lists
- Better CSV import validation and error reporting
- Offline capability for cached case studies

## Long-term Vision
- Multi-user collaboration features
- Custom case study templates
- Integration with other research tools
- Advanced AI analysis and insights
- Real-time partnership data feeds

---

*Last updated: Current session*