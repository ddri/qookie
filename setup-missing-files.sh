#!/bin/bash

echo "🔧 Setting up missing files for Quantum Case Study Tool..."

# 1. Update package.json with scripts and dev dependencies
cat > package.json << 'EOF'
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
EOF

# 2. Create index.html
cat > index.html << 'EOF'
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
EOF

# 3. Create vite.config.js
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
EOF

# 4. Create src/index.jsx
cat > src/index.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import QuantumCaseStudyProcessor from './QuantumCaseStudyProcessor.jsx';

// Mock the Claude API for local development
if (!window.claude) {
  window.claude = {
    complete: async (prompt) => {
      console.log('Claude API called with prompt:', prompt.substring(0, 100) + '...');
      
      // Return mock responses for development
      if (prompt.includes('create a detailed case study')) {
        return JSON.stringify({
          introduction: "This case study examines a quantum computing partnership.",
          challenge: "The main challenge was computational complexity.",
          implementation: "The implementation involved quantum algorithms.",
          result_and_business_impact: "Results showed significant improvements.",
          future_directions: "Future work will expand on these findings."
        });
      }
      
      if (prompt.includes('Analyze this quantum computing case study')) {
        return JSON.stringify({
          algorithms: ["Quantum Optimization", "QAOA"],
          industries: ["Aerospace", "Defense"],
          personas: ["Business Decision-Maker", "Quantum Solutions Provider"]
        });
      }
      
      if (prompt.includes('search for and provide')) {
        return JSON.stringify({
          found: true,
          title: "Mock Partnership Case Study",
          year: "2023",
          content: "This is a mock case study for development purposes.",
          scientificReferences: [],
          companyResources: []
        });
      }
      
      return "Mock response";
    }
  };
  console.warn('Running in development mode with mock Claude API');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QuantumCaseStudyProcessor />
  </React.StrictMode>
);
EOF

# 5. Update .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.vscode/
.idea/
*.swp
*.swo

# Local data
research-data-backup.json
EOF

echo "✅ Setup files created!"
echo ""
echo "📋 Next steps:"
echo "1. Run: chmod +x setup-missing-files.sh"
echo "2. Run: ./setup-missing-files.sh"
echo "3. Get the component files from Claude (they're too large for this script)"
echo "4. Run: npm install"
echo "5. Run: npm run dev"