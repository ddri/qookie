# 🚀 Qookie - Quantum Case Study Automation Platform

**Transform quantum computing research from hours to minutes.** Professional-grade batch processing system for generating comprehensive quantum partnership case studies with AI assistance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

---

## 🎯 Executive Summary

**Core Value Proposition**: Transform raw partnership data into detailed, researched case studies that would otherwise require hours of manual research per partnership.

A research tool that uses Claude AI to automatically generate comprehensive case studies from a CSV of quantum computing partnerships. The tool conducts real AI research on each partnership and produces publication-ready case studies with metadata extraction.

**Before Qookie:** Manually research 50+ partnerships → 20+ hours of work → Inconsistent quality  
**After Qookie:** Click "Process All" → Go make coffee → Professional case studies ready

---

## ⚡ Enterprise Features

- **🌍 Global Batch Processing**: Process entire datasets with one click
- **💰 Smart Cost Controls**: Rate limiting prevents API bill shock  
- **🏗️ Production Architecture**: Zustand state management, error resilience
- **📊 Real-time Progress**: Multi-level tracking with pause/resume capability
- **🔄 Intelligent Caching**: Preserves work on refresh, clears on import
- **⚙️ Professional Settings**: Cost estimates, processing time calculations
- **💾 Session Management**: Backup and restore complete research sessions
- **📝 AI Transparency**: View all prompts and commands being used
- **🌙 Dark Mode**: Beautiful light/dark theme with seamless switching
- **🎨 Modern UI**: Clean Tailwind CSS design with organized navigation
- **🚀 OpenQase Integration**: Enhanced export pipeline with comprehensive validation

---

## 🏆 What The What

### **📈 Batch Processing Modes**
- **Uncapped** (2s delay): Fast processing, ~$2-4 for 25 partnerships
- **Conservative** (45s delay): Safe for premium models, ~$8-12 for 25 partnerships  
- **Custom**: User-controlled delays (2-300s) with live cost calculator

### **🤖 AI Model Support**
| Model | Cost/Partnership | Best For |
|-------|------------------|----------|
| **Claude 4 Opus** | $0.60 | Most capable |
| **Claude 4 Sonnet** | $0.45 | Premium quality |
| **Claude 3.5 Sonnet** | $0.25 | Balanced performance |
| **Claude 3.5 Haiku** | $0.15 | Fast & smart |
| **Claude 3 Haiku** | $0.10 | Budget processing |
| **Google Gemini 2.5 Pro** | $0.125 | Cost-effective premium |
| **Google Gemini 2.5 Flash** | $0.075 | Budget-friendly |

### **📋 Generated Content**
Each partnership automatically gets:
- **Executive Summary**: Professional case study overview
- **Technical Analysis**: Challenges, solutions, implementation
- **Business Impact**: Results and future directions  
- **Enhanced Metadata Tagging**: Algorithms, industries, personas, quantum companies, partner companies, hardware, software
- **Reference Collection**: Academic papers + business coverage
- **OpenQase Export**: Enhanced export pipeline with comprehensive field validation

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js 16+** and npm
- **Claude API key** from [Anthropic Console](https://console.anthropic.com/)
- **Optional**: GitHub token for backup, Serper key for web search, Google AI API key for Gemini models

### 1. Clone & Install
```bash
git clone https://github.com/ddri/qookie.git
cd qookie
npm install
```

### 2. Configure Environment
```bash
# Create .env file with your API keys
cat > .env << EOF
# Required: Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional: Google Gemini AI models (for cost savings)
GOOGLE_AI_API_KEY=your_google_ai_key_here

# Optional: Web search for references  
SERPER_API_KEY=your_serper_key_here

# Optional: GitHub backup integration
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your_username
GITHUB_REPO_NAME=backup_repo
EOF
```

### 3. Launch Application
```bash
# Terminal 1: Start frontend (port 3555)
npm run dev

# Terminal 2: Start backend API (port 3556)  
node server.js

# Open http://localhost:3555
```

---

## 🎮 How to Use

Qookie features a clean, organized navigation bar with grouped functionality:

### **📊 Navigation Overview**
- **Session Management**: 💾📥 Backup and restore complete research sessions
- **Data Controls**: 🔄 Refresh | 📄 Import CSV files
- **Tools**: 📝 Prompts | ⚙️ Settings | 🌙 Dark Mode Toggle
- **Main Action**: 🌍 Process All (with pause/resume controls)

### **Single Partnership Mode**
1. **Select Partnership**: Click any partnership card from the left panel
2. **Generate Case Study**: Click "Generate Case Study" for AI research
3. **Analyze Metadata**: Use "Analyze Metadata" to categorize content
4. **Collect References**: Gather academic papers and business articles
5. **Export Options**: Download markdown or push to GitHub

### **🌍 Global Batch Mode** *(The Game Changer)*
1. **Configure Settings**: Click ⚙️ Settings to choose AI model and processing speed
2. **Start Processing**: Click 🌍 Process All to process entire dataset
3. **Monitor Progress**: Watch real-time progress with partnership and step tracking
4. **Control Flow**: Use ⏸️ Pause, ▶️ Resume, or 🛑 Stop as needed
5. **Export Results**: Bulk download or push all results to GitHub

### **📝 AI Transparency**
- **View Prompts**: Click 📝 Prompts to see all 6 specialized AI instructions:
  - 🔬 Research Case Study Prompt
  - 🔍 Validation Prompt  
  - 📚 Follow-up Research Prompt
  - 🔗 API Research Prompt
  - 🏷️ Metadata Analysis Prompt
  - 📚 References Collection Prompt
- **Research Quality**: Prompts include timeline research and quality standards
- **Enhanced Metadata**: Extracts quantum companies, hardware, software, and partner details
- **Customizable**: Edit and save custom prompts with localStorage persistence

### **💾 Session Management**
- **Backup**: 💾 icon saves current session to GitHub
- **Restore**: 📥 icon restores previous session from GitHub
- **Smart Persistence**: Work is automatically cached and preserved

### **CSV Data Management**
- **🔄 Refresh**: Reload partnerships (preserves cached work)
- **📄 Import**: Upload new CSV (clears cache for fresh start)
- **Progress Indicators**: ✓ symbols show completed partnerships
- **Smart Caching**: Resume work after browser refresh

---

## 🏗️ Architecture & Technical Specifications

### **State Management** 
Built with **Zustand** for production-grade state handling:
- **`useCaseStudyStore`**: Case study generation and caching
- **`useMetadataStore`**: Analysis categorization  
- **`useReferencesStore`**: Academic and business references
- **`useBatchStore`**: Individual partnership batch processing
- **`useGlobalBatchStore`**: Enterprise batch processing with logging

### **API Contract**
```typescript
interface ResearchRequest {
  company: string;
  partner: string;
  year?: string;
  status?: string;
  notes?: string;
}

interface CaseStudyResponse {
  title: string;
  summary: string;
  introduction: string;
  challenge: string;
  solution: string;
  implementation: string;
  results_and_business_impact: string;
  future_directions: string;
  metadata: {
    algorithms: string[];
    industries: string[];
    personas: string[];
    references: Reference[];
    confidence_score: number;
  };
}
```

### **Data Flow**
1. **Input**: CSV with columns: `id`, `quantum_company`, `commercial_partner`, `status`, `year`, `notes`
2. **Processing**: Claude AI research with structured prompting
3. **Output**: Structured case study with metadata
4. **Storage**: localStorage with versioning

### **Quality Standards**
- **Research Depth**: Minimum 500 words per section
- **Accuracy**: Factual claims must be verifiable
- **Structure**: Consistent format across all case studies
- **Metadata**: At least 3 algorithms, 2 industries, 3 personas identified

### **Error Resilience**
- **Skip and Continue**: Failed partnerships don't stop processing
- **Comprehensive Logging**: Full audit trail for debugging
- **Automatic Retry Logic**: Built-in timeout and retry handling
- **User Control**: Pause/resume functionality

### **Project Structure**
```
qookie/
├── src/
│   ├── App.jsx                     # Main application with Tailwind UI
│   ├── stores/                     # Zustand state management
│   │   ├── useCaseStudyStore.js    # Case study generation
│   │   ├── useMetadataStore.js     # Metadata analysis  
│   │   ├── useReferencesStore.js   # Reference collection
│   │   ├── useBatchStore.js        # Single batch processing
│   │   └── useGlobalBatchStore.js  # Global batch processing
│   ├── styles/                     # Design system
│   │   └── buttonStyles.js         # Legacy button components
│   ├── research/                   # AI research engine
│   │   ├── QuantumResearchEngine.js # Advanced research system
│   │   └── ResearchPromptSystem.js  # Structured AI prompts
│   ├── utils/                      # Utility modules
│   │   ├── ValidationEngine.js     # Export validation
│   │   ├── ExportErrorHandler.js   # Error handling
│   │   └── QualityScorer.js        # Quality metrics
│   └── index.css                   # Tailwind CSS styles
├── data/                          # CSV templates and docs
├── public/data/                   # Active partnership data
├── tailwind.config.js             # Tailwind configuration
└── server.js                     # Backend API server
```

---

## 🚀 OpenQase Integration

### **Enhanced Export Pipeline**

Qookie includes comprehensive OpenQase integration with validation, preview, and error handling:

#### **Export Enhancement Features**
- **Validation Engine**: Pre-export quality checks with critical error blocking
- **Error Handling**: Graceful degradation with fallback values
- **Quality Scoring**: Comprehensive 0-100% quality metrics
- **Export Preview**: Interactive modal with case study selection
- **Quality Indicators**: Visual quality status for each case study
- **Selective Export**: Choose which case studies to include/exclude from export
- **Real-time Validation**: Shows critical errors, warnings, and quality scores before export

#### **Export File Format**
- **Format**: JSON (.json)
- **Encoding**: UTF-8
- **Naming Convention**: `qookie-openqase-export-[ISO-timestamp].json`

#### **Data Mapping & Transformation**
```json
{
  "export_metadata": {
    "export_version": "1.0",
    "export_date": "2025-01-24T10:30:00Z",
    "total_items": 45,
    "export_type": "batch",
    "source": "qookie"
  },
  "case_studies": [
    {
      "id": "string",
      "slug": "string",
      "title": "string",
      "summary": "string",
      "main_content": {
        "introduction": "string",
        "challenge": "string",
        "solution": "string",
        "implementation": "string",
        "results": "string",
        "future": "string",
        "technical": "string"
      },
      "companies": {
        "quantum_provider": "string",
        "commercial_partner": "string",
        "year": "number|null"
      },
      "categories": {
        "industries": ["string"],
        "algorithms": ["string"],
        "personas": ["string"],
        "technologies": {
          "hardware": ["string"],
          "software": ["string"]
        }
      },
      "references": [
        {
          "title": "string",
          "url": "string",
          "type": "string",
          "date": "string|null"
        }
      ],
      "metadata": {
        "word_count": "number",
        "research_date": "ISO-8601-string",
        "confidence_level": "high|medium|low",
        "data_sources": ["string"],
        "last_updated": "ISO-8601-string"
      }
    }
  ]
}
```

#### **Validation Rules**
```
CRITICAL (blocks export):
- Missing company or partner names
- Missing case study title
- Zero content in all sections

WARNINGS (allows export):
- Missing content sections (introduction, challenge, etc.)
- Low word count (<500 words total)
- Missing summary
- Minimal metadata (no algorithms/industries/personas)
- Very low confidence scores (<0.3)
```

#### **Technical Implementation**
- **Export Location**: `App.jsx:1075` - Enhanced `exportAllToOpenQase()` function
- **UI Access**: "🚀 Export for OpenQase" button opens preview modal
- **File Output**: Downloads as `qookie-openqase-export-[timestamp].json`
- **Validation Rules**: 15 quality checks (critical errors block export, warnings allow export)
- **Quality Metrics**: Content completeness, word count, metadata richness, confidence scoring

---

## ⚙️ Settings & Configuration

### **Rate Limiting Settings**
Access via **⚙️ Settings** button:

- **AI Model Selection**: Choose from Claude 4 Opus, Sonnet, 3.5 models, or Google Gemini models
- **Processing Modes**: 
  - **Uncapped** (2s delay): Fast processing for quick results
  - **Conservative** (45s delay): Safe for all models, prevents rate limits
  - **Custom** (2-300s): Set your own delay with live cost calculator
- **Cost Calculator**: Real-time estimates before processing
- **Time Estimates**: Total processing duration predictions
- **Per-Mode Configuration**: Each rate limit mode has independent AI model selection

### **CSV Data Format**
```csv
id,quantum_company,commercial_partner,year,notes
0,IBM,Mercedes-Benz,2023,Quantum computing for automotive applications
1,Google,CERN,2023,Quantum algorithms for particle physics simulations
```

### **GitHub Integration**
Automatic backup of generated case studies:
1. Create GitHub repo for backups
2. Generate Personal Access Token (repo scope)
3. Add to `.env` file
4. Click "Push to GitHub" after generation

---

## 🔧 API Endpoints

Backend server provides:
- `POST /api/research` - Generate comprehensive case studies with enhanced OpenQase fields
- `POST /api/analyze` - AI-powered metadata categorization
- `POST /api/references` - Collect academic and business references  
- `POST /api/search` - Web search functionality
- `POST /api/github/push` - GitHub backup integration
- `POST /api/github/backup-session` - Full session backup
- `POST /api/github/restore-session` - Session restoration
- `GET /api/github/list-backups` - List available backups

---

## 📊 Current Status & Roadmap

### **✅ Completed Features**
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
- ✅ Multi-AI provider support (Claude + Google Gemini)
- ✅ Enhanced OpenQase export pipeline with validation
- ✅ Global batch processing with pause/resume
- ✅ Professional settings with cost estimation
- ✅ Dark mode support
- ✅ Session backup and restore

### **🔄 In Progress**
- 🔄 Improve references search quality and relevance

### **Critical Bugs to Fix**
- 🐛 **Advanced Analysis Reference Lists Bug**
  - Analysis consistently shows "No reference lists were provided for matching"
  - Reference lists appear empty during analysis even when loaded successfully
  - Need to debug: reference list loading timing, prompt construction, or data passing
  - Results in analysis showing "None specified" for algorithms, industries, personas
  - May be frontend state issue, prompt building issue, or API parameter passing issue

### **Next Priority Features**

#### **Data Management & Transparency**
- **Explicit Data Source Management**
  - Data source indicator showing partnership count, source file, and last loaded time
  - "Refresh Data" button for manual data reloading
  - Data dashboard panel with detailed dataset information
  - Data quality validation (missing fields, duplicates)
  - Clear error handling for missing/corrupt CSV files
  - Progressive disclosure: basic info always visible, details on demand

#### **Batch Processing & Automation**
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

#### **Activity Logging & History**
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

#### **Content Marketing Pipeline**
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

#### **Enhanced Export & Integration**
- **Enhanced GitHub Integration** 
  - Organized folder structure by year/topic
  - Batch export capabilities
  - Auto-generated README index files

#### **Data Persistence & Backup**
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

### **Long-term Vision**
- Multi-user collaboration features
- Custom case study templates
- Integration with other research tools
- Advanced AI analysis and insights
- Real-time partnership data feeds

---

## 📊 Performance & Costs

### **Processing Speed**
- **Single Partnership**: ~45 seconds (3 AI calls)
- **25 Partnerships**: 
  - Uncapped mode: ~32 minutes, ~$11.25
  - Conservative mode: ~1.2 hours, ~$12.38
  - Custom mode: User configurable

### **Cost Optimization**
- **Smart Caching**: Avoids redundant API calls
- **Rate Limiting**: Prevents expensive overages
- **Model Choice**: Budget to premium options
- **Real-time Estimates**: Know costs before processing

---

## 🔒 Security & Privacy

**Local Development Focus**: Qookie is designed as a local development tool for individual researchers and teams.

### **✅ Security Features**
- **API Key Protection**: All sensitive keys stored in `.env` file (gitignored)
- **No Hardcoded Secrets**: Clean open-source codebase with no exposed credentials
- **Local Processing**: All data processing happens on your machine
- **GitHub Integration**: Optional backup to your own repositories only

### **🛡️ Best Practices**
- Never commit your `.env` file to version control
- Use environment variables for all API keys and tokens
- Regularly rotate API keys and GitHub tokens
- Keep your local environment secure

### **⚠️ Production Deployment**
If deploying publicly (not recommended for current version):
- Add authentication to API endpoints
- Configure CORS restrictions
- Implement rate limiting
- Use HTTPS only

---

## 💡 Use Cases

### **Research Teams**
- Process entire quantum computing landscape overnight
- Consistent formatting across all case studies
- Cost-controlled bulk generation

### **Consulting Firms**  
- Client deliverables with professional formatting
- Comprehensive reference collection
- Exportable markdown for reports

### **Investment Analysis**
- Market landscape analysis
- Partnership trend identification  
- Due diligence research automation

---

## 🔧 Troubleshooting

### **Common Issues**

**Q: Settings modal crashes when I click rate limiting options**  
A: This was fixed in v2.0. Update to latest version or ensure all partnerships data is loaded properly.

**Q: Dark mode isn't working**  
A: Clear localStorage and refresh. Dark mode state should persist automatically.

**Q: Buttons look broken or inconsistent**  
A: Ensure Tailwind CSS is properly loaded. Check browser console for CSS errors.

**Q: "Process All" button is disabled**  
A: Make sure partnerships are loaded. Use 🔄 Refresh or 📄 Import to load CSV data.

**Q: AI responses are incomplete or errors**  
A: Check your ANTHROPIC_API_KEY in .env file. Verify you have API credits available.

**Q: GitHub backup/restore not working**  
A: Verify GITHUB_TOKEN, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME are set in .env.

**Q: AI Prompts modal showing empty text areas**  
A: This was fixed in the latest version. Update to get all 6 specialized prompt templates populated correctly.

**Q: Missing new metadata fields (quantum companies, hardware, software)**  
A: Ensure you're using the latest version with OpenQase field integration. Check that case studies were generated after the update.

### **Development Issues**

**Q: Port conflicts**  
A: Qookie uses ports 3555 (frontend) and 3556 (backend) to avoid conflicts with other projects.

**Q: Tailwind classes not working**  
A: Run `npm install` to ensure all dependencies are installed, including Tailwind v3.

**Q: Case studies not saving**  
A: Check browser localStorage. Clear cache if needed. Backup important work to GitHub first.

### **Performance Tips**

- Use **Conservative mode** for overnight processing
- **Backup sessions** regularly during long batch jobs
- **Pause/Resume** if you need to close the browser
- Monitor **cost estimates** before large batch runs

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create branch**: `git checkout -b feature/amazing-enhancement`
3. **Commit changes**: `git commit -m 'Add amazing feature'`  
4. **Push branch**: `git push origin feature/amazing-enhancement`
5. **Create Pull Request**

### **Development Setup**
```bash
# Install dependencies
npm install

# Start development environment
npm run dev        # Frontend on :3555
node server.js     # Backend on :3556

# Build for production
npm run build
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Issues

- **📋 Issues**: [GitHub Issues](https://github.com/ddri/qookie/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/ddri/qookie/discussions)
- **📧 Contact**: Create detailed issue with reproduction steps

---

<div align="center">

**⭐ Star this repo if Qookie saves you time!**

*Built with ❤️ for the quantum computing research community*

</div>