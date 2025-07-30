# 🚀 Qookie - Quantum Case Study Automation Platform

**Transform quantum computing research from hours to minutes.** Professional-grade batch processing system for generating comprehensive quantum partnership case studies with AI assistance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## 🎯 Why Qookie?

**Before Qookie:** Manually research 50+ partnerships → 20+ hours of work → Inconsistent quality
**After Qookie:** Click "Process All" → Go make coffee → Professional case studies ready

### ⚡ Enterprise Features

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

---

## 🚀 Quick Demo

```bash
# 1-minute setup
git clone https://github.com/ddri/qookie.git && cd qookie
npm install
echo "ANTHROPIC_API_KEY=your_key" > .env
npm run dev & node server.js

# Visit localhost:3555
# Click "🌍 Process All" 
# Watch 25+ partnerships become professional case studies
```

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
- **Optional**: GitHub token for backup, Serper key for web search

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

## 🏗️ Architecture

### **State Management** 
Built with **Zustand** for production-grade state handling:
- **`useCaseStudyStore`**: Case study generation and caching
- **`useMetadataStore`**: Analysis categorization  
- **`useReferencesStore`**: Academic and business references
- **`useBatchStore`**: Individual partnership batch processing
- **`useGlobalBatchStore`**: Enterprise batch processing with logging

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
│   └── index.css                   # Tailwind CSS styles
├── data/                          # CSV templates and docs
├── public/data/                   # Active partnership data
├── tailwind.config.js             # Tailwind configuration
└── server.js                     # Backend API server
```

---

## ⚙️ Settings & Configuration

### **Rate Limiting Settings**
Access via **⚙️ Settings** button:

- **AI Model Selection**: Choose from Claude 4 Opus, Sonnet, 3.5 models
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