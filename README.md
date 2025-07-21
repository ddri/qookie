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

---

## 🚀 Quick Demo

```bash
# 1-minute setup
git clone https://github.com/ddri/qookie.git && cd qookie
npm install
echo "ANTHROPIC_API_KEY=your_key" > .env
npm run dev & node server.js

# Visit localhost:3000
# Click "🌍 Process All" 
# Watch 25+ partnerships become professional case studies
```

---

## 🏆 What You Get

### **📈 Batch Processing Modes**
- **Uncapped** (2s delay): Fast processing, ~$2-4 for 25 partnerships
- **Conservative** (45s delay): Safe for premium models, ~$8-12 for 25 partnerships  
- **Custom**: User-controlled delays (2-300s) with live cost calculator

### **🤖 AI Model Support**
| Model | Cost/Partnership | Best For |
|-------|------------------|----------|
| **Claude 4 Sonnet** | $0.45 | Premium quality |
| **Claude 3.5 Sonnet** | $0.25 | Balanced performance |
| **GPT-4** | $0.55 | OpenAI preference |
| **GPT-3.5 Turbo** | $0.08 | Budget processing |

### **📋 Generated Content**
Each partnership automatically gets:
- **Executive Summary**: Professional case study overview
- **Technical Analysis**: Challenges, solutions, implementation
- **Business Impact**: Results and future directions  
- **Metadata Tagging**: Algorithms, industries, personas
- **Reference Collection**: Academic papers + business coverage

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
# Terminal 1: Start frontend (port 3000)
npm run dev

# Terminal 2: Start backend API (port 3002)  
node server.js

# Open http://localhost:3000
```

---

## 🎮 How to Use

### **Single Partnership Mode**
1. **Select Partnership**: Click any partnership card
2. **Generate Case Study**: Professional research document  
3. **Analyze Metadata**: AI categorization (algorithms, industries, personas)
4. **Collect References**: Academic papers + business articles
5. **Export/Backup**: Markdown export or GitHub integration

### **🌍 Global Batch Mode** *(The Game Changer)*
1. **Click ⚙️ Settings**: Configure model, delays, see cost estimates
2. **Click 🌍 Process All**: Processes entire CSV automatically
3. **Monitor Progress**: Real-time partnership and step tracking
4. **Pause/Resume**: Full control over long-running processes

### **CSV Data Management**
- **🔄 Refresh**: Reload partnerships (preserves cached work)
- **📄 Import**: Upload new CSV (clears cache for fresh start)
- **Smart Caching**: ✓ symbols show completed partnerships

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
│   ├── App.jsx                     # Main application  
│   ├── stores/                     # Zustand state management
│   │   ├── useCaseStudyStore.js    # Case study generation
│   │   ├── useMetadataStore.js     # Metadata analysis  
│   │   ├── useReferencesStore.js   # Reference collection
│   │   ├── useBatchStore.js        # Single batch processing
│   │   └── useGlobalBatchStore.js  # Global batch processing
│   └── research/                   # AI research engine
├── data/                          # CSV templates and docs
├── public/data/                   # Active partnership data
└── server.js                     # Backend API server
```

---

## ⚙️ Settings & Configuration

### **Rate Limiting Settings**
Access via **⚙️ Settings** button:

- **AI Model Selection**: Choose cost vs quality balance
- **Processing Mode**: Uncapped, Conservative, or Custom delays
- **Cost Calculator**: Real-time estimates before processing
- **Time Estimates**: Total processing duration predictions

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
- `POST /api/research` - Generate comprehensive case studies
- `POST /api/analyze` - AI-powered metadata categorization
- `POST /api/references` - Collect academic and business references  
- `POST /api/search` - Web search functionality
- `POST /api/github/push` - GitHub backup integration

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
npm run dev        # Frontend on :3000
node server.js     # Backend on :3002

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