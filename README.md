# Qookie

A comprehensive React-based tool for researching, generating, and managing quantum computing partnership case studies with AI assistance.

## Features

### Core Functionality
- **Partnership Management**: Load and manage quantum computing partnerships from CSV data
- **AI-Powered Case Study Generation**: Generate detailed, structured case studies using Claude AI
- **Advanced Analysis**: Categorize case studies by algorithms, industries, and target personas
- **Reference Collection**: Automatically gather scientific papers and business coverage
- **Export & Backup**: Export to markdown and automatically backup to GitHub repositories

### User Interface
- **Intuitive Partnership Browser**: Click-based selection with detailed partnership information
- **Three-Stage Workflow**: Generate → Analyze → Collect References
- **Dark Mode Support**: Full dark/light theme toggle with persistent preferences
- **Real-time Feedback**: Loading states, progress indicators, and status notifications

### Data Management
- **CSV Import/Export**: Built-in CSV management with template and validation
- **Local Caching**: Intelligent caching system to avoid regenerating case studies
- **GitHub Integration**: Automatic backup of case studies in both markdown and JSON formats

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Claude API key from [Anthropic Console](https://console.anthropic.com/)
- (Optional) GitHub Personal Access Token for backup features
- (Optional) Serper API key for web search references

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ddri/qookie.git
   cd qookie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API keys**
   
   Copy the `.env` file and add your API keys:
   ```bash
   # Required: Anthropic API Key for Claude AI
   ANTHROPIC_API_KEY=your_anthropic_key_here
   
   # Optional: Serper API Key for web search references
   SERPER_API_KEY=your_serper_key_here
   
   # Optional: GitHub Integration for case study backup
   GITHUB_TOKEN=your_github_token_here
   GITHUB_REPO_OWNER=your_github_username
   GITHUB_REPO_NAME=your_backup_repo_name
   ```

4. **Start the development environment**
   ```bash
   # Start the frontend (port 3000)
   npm run dev
   
   # In another terminal, start the backend API (port 3002)
   node server.js
   ```

5. **Open the application**
   
   Navigate to `http://localhost:3000` in your browser.

## How It Works

### 1. Partnership Selection
- Browse 22+ quantum computing partnerships loaded from CSV data
- Click any partnership card to view details and generate case studies
- Partnerships include companies like IBM, Google, Quantinuum, IonQ, etc.

### 2. Case Study Generation
- Click "Generate Case Study" to create a comprehensive research document
- AI analyzes the partnership and generates structured content including:
  - Executive summary and introduction
  - Technical challenges and solutions
  - Implementation details and business impact
  - Future directions and technical specifications

### 3. Advanced Analysis
- Click "Analyze Metadata" to categorize the case study
- AI matches content against reference lists to identify:
  - **Quantum Algorithms**: QAOA, VQE, Quantum Simulation, etc.
  - **Industries**: Aerospace, Finance, Pharmaceuticals, etc.
  - **Target Personas**: CTO, Quantum Research Lead, etc.

### 4. Reference Collection
- Click "Collect References" to gather supporting materials
- Automatically searches for:
  - **Scientific Papers**: Academic research from Google Scholar
  - **Business Coverage**: News articles and case studies
- Uses real web search (Serper API) for authentic, current references

### 5. Export & Backup
- **Export Markdown**: Download formatted case study as .md file
- **Push to GitHub**: Automatically backup both markdown and JSON to your repository

## Configuration

### CSV Data Management

The tool uses CSV files to manage partnership data:

- **Source**: `/data/quantum-partnerships.csv` 
- **Active Data**: `/public/data/quantum-partnerships.csv` (loaded by app)
- **Template**: `/data/quantum-partnerships-template.csv`

**CSV Format:**
```csv
id,quantum_company,commercial_partner,year,notes
0,IBM,Mercedes-Benz,2023,Quantum computing for automotive applications
```

### GitHub Integration Setup

1. **Create a backup repository** on GitHub (public or private)

2. **Generate Personal Access Token**:
   - Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - Create token with `repo` scope (full repository access)
   - Copy the token securely

3. **Update `.env` file**:
   ```bash
   GITHUB_TOKEN=ghp_your_actual_token_here
   GITHUB_REPO_OWNER=your_github_username  
   GITHUB_REPO_NAME=quantum-case-studies-backup
   ```

4. **Test the integration**:
   - Generate a case study
   - Click "Push to GitHub" 
   - Files will appear in `exports/` folder of your backup repo

### Model Selection

Choose from multiple Claude models:
- **Claude 4 Sonnet** (Recommended): Latest model with best balance of quality and speed
- **Claude 4 Opus**: Most capable model for complex analysis and highest quality
- **Claude 3.5 Sonnet**: Previous generation, fast and capable
- **Claude 3.5 Haiku**: Fast and smart for quick generation
- **Claude 3 Opus**: Previous generation, very capable
- **Claude 3 Sonnet**: Balanced performance
- **Claude 3 Haiku**: Fastest option

## API Endpoints

The backend server provides several endpoints:

- `POST /api/research` - Generate case studies
- `POST /api/analyze` - Analyze and categorize case studies  
- `POST /api/references` - Collect scientific and business references
- `POST /api/search` - Web search functionality
- `POST /api/github/push` - GitHub backup integration

## Development

### Project Structure
```
src/
├── App.jsx                          # Main application component
├── components/
│   ├── CSVImportManager.jsx         # CSV data management
│   └── SearchAllCasesFeature.jsx    # Search functionality
├── research/
│   ├── QuantumResearchEngine.js     # Research system
│   └── ResearchPromptSystem.js      # AI prompting logic
data/
├── quantum-partnerships.csv         # Source partnership data
├── quantum-partnerships-template.csv # Template for new data
└── CSV-TEMPLATE-README.md          # CSV documentation
public/
├── data/
│   └── quantum-partnerships.csv     # Active data loaded by app
└── reference/                       # Reference materials and benchmarks
```

### Key Features for Developers
- **Caching System**: LocalStorage-based caching prevents redundant API calls
- **Error Handling**: Comprehensive error states with user-friendly messages
- **State Management**: React hooks-based state with persistent preferences
- **Responsive Design**: Works on desktop and mobile browsers
- **Type Safety**: JSX with consistent prop patterns

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or issues:
1. Check the [Issues](https://github.com/ddri/qookie/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs