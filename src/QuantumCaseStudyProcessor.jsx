import React, { useState, useEffect, createContext, useContext } from 'react';
import { FileText, Search, Download, Upload, Settings, ChevronDown, ChevronUp, ExternalLink, BookOpen, Building, Moon, Sun } from 'lucide-react';
import CSVImportManager from './components/CSVImportManager.jsx';
import SearchAllCasesFeature from './components/SearchAllCasesFeature.jsx';

// Dark Mode Context
const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

const QuantumCaseStudyProcessor = () => {
  const [sourceData, setSourceData] = useState([]);
  const [researchData, setResearchData] = useState([]);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('partnerships');
  const [expandedSections, setExpandedSections] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    // Load CSV data
    fetch('/data/quantum-partnerships.csv')
      .then(response => response.text())
      .then(csvContent => {
        const parsedData = parseCSV(csvContent);
        setSourceData(parsedData);
        console.log(`Loaded ${parsedData.length} partnerships from CSV`);
      })
      .catch(error => {
        console.log('CSV not found, using default data');
        setSourceData(getDefaultPartnerships());
      });

    // Load research data from localStorage
    const savedResearchData = localStorage.getItem('quantum-research-data');
    if (savedResearchData) {
      try {
        setResearchData(JSON.parse(savedResearchData));
      } catch (error) {
        console.error('Error parsing saved research data:', error);
      }
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('quantum-dark-mode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save research data to localStorage whenever it changes
  useEffect(() => {
    if (researchData.length > 0) {
      localStorage.setItem('quantum-research-data', JSON.stringify(researchData));
    }
  }, [researchData]);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('quantum-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const parseCSV = (content) => {
    try {
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
        const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
        
        const row = {};
        headers.forEach((header, i) => {
          row[header] = cleanValues[i] || '';
        });
        
        return {
          id: parseInt(row.id) || index + 1,
          company: row.quantum_company || '',
          partner: row.commercial_partner || '',
          status: row.status || '',
          year: row.year || '',
          notes: row.notes || ''
        };
      });
      
      return data.filter(row => row.company && row.partner);
    } catch (error) {
      console.error('CSV parsing error:', error);
      return [];
    }
  };

  const getDefaultPartnerships = () => {
    return [
      { id: 1, company: "IBM", partner: "Mercedes-Benz", status: "active", year: "2023", notes: "Quantum computing for automotive applications" },
      { id: 2, company: "Google", partner: "Volkswagen", status: "active", year: "2017", notes: "Traffic optimization using quantum algorithms" },
      { id: 3, company: "Rigetti", partner: "BMW", status: "completed", year: "2021", notes: "Quantum machine learning for manufacturing" }
    ];
  };

  const handleDataImport = (newData) => {
    setSourceData(newData);
  };

  const handleUpdateResearchData = (newResearchData) => {
    setResearchData(newResearchData);
  };

  const generateCaseStudy = async (partnership) => {
    if (!partnership) return;

    setIsGenerating(true);
    setGeneratedCaseStudy(null);

    try {
      // Find research data for this partnership
      const research = researchData.find(r => r.id === partnership.id);
      
      const prompt = `create a detailed case study for the quantum computing partnership between ${partnership.company} and ${partnership.partner}. 

${research ? `Use this research data: ${JSON.stringify(research.data, null, 2)}` : 'Please research and include information about this partnership.'}

Format the response as JSON with these sections:
{
  "title": "Partnership Title",
  "slug": "url-friendly-slug",
  "summary": "Brief summary",
  "introduction": "Introduction paragraph",
  "challenge": "The challenge or problem being addressed",
  "implementation": "How quantum computing was implemented",
  "results_and_business_impact": "Outcomes and business impact",
  "technical_details": "Technical aspects and quantum algorithms used",
  "future_directions": "Future plans and potential",
  "algorithms": ["Algorithm 1", "Algorithm 2"],
  "industries": ["Industry 1", "Industry 2"], 
  "personas": ["Persona 1", "Persona 2"],
  "scientific_references": [{"title": "Paper", "url": "URL", "year": "2023"}],
  "company_resources": [{"title": "Resource", "url": "URL", "type": "press release"}],
  "metadata": {
    "company": "${partnership.company}",
    "partner": "${partnership.partner}",
    "year": "${partnership.year}",
    "status": "${partnership.status}"
  }
}`;

      const response = await window.claude.complete(prompt);
      const caseStudyData = JSON.parse(response);
      
      setGeneratedCaseStudy(caseStudyData);
    } catch (error) {
      console.error('Error generating case study:', error);
      alert('Error generating case study. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportCaseStudyAsMarkdown = (caseStudy) => {
    if (!caseStudy) return;

    const markdown = `# ${caseStudy.title}

## Summary
${caseStudy.summary}

## Introduction
${caseStudy.introduction}

## Challenge
${caseStudy.challenge}

## Implementation
${caseStudy.implementation}

## Results and Business Impact
${caseStudy.results_and_business_impact}

## Technical Details
${caseStudy.technical_details}

## Future Directions
${caseStudy.future_directions}

## Metadata
- **Company**: ${caseStudy.metadata?.company}
- **Partner**: ${caseStudy.metadata?.partner}
- **Year**: ${caseStudy.metadata?.year}
- **Status**: ${caseStudy.metadata?.status}
- **Algorithms**: ${caseStudy.algorithms?.join(', ')}
- **Industries**: ${caseStudy.industries?.join(', ')}
- **Personas**: ${caseStudy.personas?.join(', ')}

## Scientific References
${caseStudy.scientific_references?.map(ref => `- [${ref.title}](${ref.url}) (${ref.year})`).join('\n') || 'None'}

## Company Resources
${caseStudy.company_resources?.map(resource => `- [${resource.title}](${resource.url}) (${resource.type})`).join('\n') || 'None'}

---
Generated by Quantum Case Study Processor
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseStudy.slug || 'case-study'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportResearchData = () => {
    if (researchData.length === 0) {
      alert('No research data to export');
      return;
    }

    const blob = new Blob([JSON.stringify(researchData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum-research-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importResearchData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setResearchData(importedData);
        alert('Research data imported successfully');
      } catch (error) {
        alert('Error importing research data: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPartnershipWithResearch = (partnership) => {
    const research = researchData.find(r => r.id === partnership.id);
    return { ...partnership, research };
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quantum Case Study Processor</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>{sourceData.length} partnerships</span>
                  <span>•</span>
                  <span>{researchData.length} researched</span>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { id: 'partnerships', label: 'Partnerships', icon: Building },
                { id: 'search', label: 'Bulk Search', icon: Search },
                { id: 'import', label: 'Data Management', icon: Upload },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Partnerships Tab */}
          {activeTab === 'partnerships' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Partnership List */}
              <div className="space-y-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                  <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quantum Computing Partnerships</h2>
                  <div className="space-y-3">
                    {sourceData.map(partnership => {
                      const research = researchData.find(r => r.id === partnership.id);
                      return (
                        <div
                          key={partnership.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedPartnership?.id === partnership.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : `${darkMode ? 'border-gray-600 hover:border-gray-500 bg-gray-700' : 'border-gray-200 hover:border-gray-300 bg-white'}`
                          }`}
                          onClick={() => setSelectedPartnership(partnership)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {partnership.company} + {partnership.partner}
                              </h3>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {partnership.year} • {partnership.status}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {research?.searchSuccess && (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                                }`}>
                                  Researched
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateCaseStudy(partnership);
                                }}
                                disabled={isGenerating}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                              >
                                Generate Case Study
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </div>
            </div>

              {/* Case Study Display */}
              <div className="space-y-6">
                {isGenerating && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>Generating case study...</span>
                    </div>
                  </div>
                )}

                {generatedCaseStudy && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Generated Case Study</h2>
                      <button
                        onClick={() => exportCaseStudyAsMarkdown(generatedCaseStudy)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <Download className="w-4 h-4" />
                        Export Markdown
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{generatedCaseStudy.title}</h3>
                        <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{generatedCaseStudy.summary}</p>
                      </div>

                      {['introduction', 'challenge', 'implementation', 'results_and_business_impact', 'technical_details', 'future_directions'].map(section => (
                        <div key={section} className={`border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <button
                            onClick={() => toggleSection(section)}
                            className={`w-full px-4 py-3 text-left font-medium rounded-t-lg flex items-center justify-between ${
                              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            <span className="capitalize">{section.replace(/_/g, ' ')}</span>
                            {expandedSections[section] ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            }
                          </button>
                          {expandedSections[section] && (
                            <div className={`p-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{generatedCaseStudy[section]}</p>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Metadata */}
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Metadata</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Algorithms:</span>
                            <p className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{generatedCaseStudy.algorithms?.join(', ') || 'None'}</p>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Industries:</span>
                            <p className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{generatedCaseStudy.industries?.join(', ') || 'None'}</p>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Personas:</span>
                            <p className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{generatedCaseStudy.personas?.join(', ') || 'None'}</p>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Search Tab */}
        {activeTab === 'search' && (
          <SearchAllCasesFeature
            sourceData={sourceData}
            researchData={researchData}
            onUpdateResearchData={handleUpdateResearchData}
          />
        )}

          {/* Data Management Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <CSVImportManager
                onDataImport={handleDataImport}
                sourceData={sourceData}
                onExportData={exportResearchData}
              />
              
              {/* Research Data Management */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FileText className="w-5 h-5" />
                  Research Data Management
                </h2>
                
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={exportResearchData}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <Download className="w-4 h-4" />
                    Export Research Data
                  </button>
                  
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Research Data
                    <input
                      type="file"
                      accept=".json"
                      onChange={importResearchData}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>Research data: {researchData.length} partnerships researched</p>
                  <p>Stored in browser localStorage and can be exported/imported as JSON</p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Settings className="w-5 h-5" />
                Settings & Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                      <div className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Partnerships</div>
                      <div className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{sourceData.length} loaded</div>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900' : 'bg-green-50'}`}>
                      <div className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>Research Data</div>
                      <div className={`${darkMode ? 'text-green-400' : 'text-green-600'}`}>{researchData.length} researched</div>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-900' : 'bg-purple-50'}`}>
                      <div className={`font-medium ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>Claude API</div>
                      <div className={`${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {window.claude ? 'Available' : 'Not Available'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>About</h3>
                  <div className={`text-sm space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p>This tool helps create content for openqase.com by researching quantum computing partnerships and generating structured case studies.</p>
                    <p>Data is stored locally in your browser and can be exported/imported as needed.</p>
                    <p>Generated case studies are formatted as markdown files ready for publication.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DarkModeContext.Provider>
  );
};

export default QuantumCaseStudyProcessor;