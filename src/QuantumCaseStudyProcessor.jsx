import React, { useState, useEffect, createContext, useContext } from 'react';
import { FileText, Search, Download, Upload, Settings, ChevronDown, ChevronUp, ExternalLink, BookOpen, Building, Moon, Sun, RefreshCw } from 'lucide-react';
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
  const [darkMode, setDarkMode] = useState(true);

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
          id: row.id !== undefined && row.id !== '' ? parseInt(row.id) : index + 1,
          company: row.quantum_company || '',
          partner: row.commercial_partner || '',
          year: row.year || '',
          notes: row.notes || ''
        };
      });
      
      const filteredData = data.filter(row => row.company && row.partner);
      console.log('Parsed CSV data:', filteredData);
      
      // Check for duplicate IDs
      const ids = filteredData.map(row => row.id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.error('Duplicate IDs found:', duplicateIds);
      }
      
      return filteredData;
    } catch (error) {
      console.error('CSV parsing error:', error);
      return [];
    }
  };

  const getDefaultPartnerships = () => {
    return [
      { id: 1, company: "IBM", partner: "Mercedes-Benz", year: "2023", notes: "Quantum computing for automotive applications" },
      { id: 2, company: "Google", partner: "Volkswagen", year: "2017", notes: "Traffic optimization using quantum algorithms" },
      { id: 3, company: "Rigetti", partner: "BMW", year: "2021", notes: "Quantum machine learning for manufacturing" }
    ];
  };

  const handleDataImport = (newData) => {
    setSourceData(newData);
  };

  const handleUpdateResearchData = (newResearchData) => {
    setResearchData(newResearchData);
  };

  const generateCaseStudy = async (partnership, forceRegenerate = false) => {
    console.log('generateCaseStudy called with:', partnership, 'forceRegenerate:', forceRegenerate);
    
    if (!partnership) {
      console.error('No partnership provided to generateCaseStudy');
      return;
    }

    // Check if case study already exists and we're not forcing regeneration
    if (!forceRegenerate) {
      const existingCaseStudy = localStorage.getItem(`case-study-${partnership.id}`);
      console.log('Existing case study check:', existingCaseStudy ? 'Found' : 'Not found');
      if (existingCaseStudy) {
        try {
          const parsed = JSON.parse(existingCaseStudy);
          console.log('Loading existing case study:', parsed);
          setGeneratedCaseStudy(parsed);
          return;
        } catch (error) {
          console.warn('Failed to parse existing case study:', error);
        }
      }
    }

    setIsGenerating(true);
    setGeneratedCaseStudy(null);

    try {
      console.log('Starting case study generation process...');
      
      // First, check if we have research data for this partnership
      let research = researchData.find(r => r.id === partnership.id);
      console.log('Existing research data:', research);
      
      // If no research data exists, conduct research first
      if (!research || !research.searchSuccess) {
        console.log('No research data found, conducting research first...');
        
        try {
          // Import the research engine dynamically
          console.log('Importing research engine...');
          const { QuantumResearchEngine } = await import('./research/QuantumResearchEngine.js');
          
          // Load reference case study with fallback
          console.log('Loading reference case study...');
          let referenceText;
          try {
            const referenceResponse = await fetch('/reference/ReferenceCaseStudy-Barclays-and-Quantinuum.md');
            if (!referenceResponse.ok) {
              throw new Error(`Failed to load reference: ${referenceResponse.status}`);
            }
            referenceText = await referenceResponse.text();
            console.log('Reference loaded from server, length:', referenceText.length);
          } catch (fetchError) {
            console.warn('Failed to load reference from server, using embedded fallback:', fetchError);
            // Embedded fallback reference text
            referenceText = `
## Introduction

In 2023, Barclays, a multinational investment bank and financial services company, collaborated with Quantinuum to develop and implement quantum differential privacy techniques for enhanced financial data protection. This partnership aimed to address growing concerns around data privacy in an increasingly regulated financial landscape while leveraging quantum computing's unique capabilities for secure data processing.

## The Financial Data Protection Challenge

Financial institutions operate in an environment where data protection has become increasingly critical. Banks must balance competing imperatives: extracting valuable insights from customer data while rigorously protecting privacy and complying with regulations such as GDPR and the California Consumer Privacy Act. Traditional differential privacy techniques often compromise data utility when providing stronger privacy guarantees, creating a fundamental tension between privacy and analytical value.

Modern financial institutions analyze vast datasets encompassing transaction histories, investment patterns, and customer behaviors. These analyses drive critical business functions including fraud detection, credit decisioning, and product development. However, the risk of exposing sensitive client information through sophisticated inference attacks has grown substantially. The World Economic Forum estimated in 2022 that data breaches cost the financial sector over $18 billion annually, with reputational damage often exceeding direct financial losses.

## Quantum Solution

Quantinuum developed a novel quantum differential privacy framework leveraging their H-series trapped-ion quantum computing platform. The system implemented quantum-enhanced privacy mechanisms that fundamentally improved the privacy-utility tradeoff compared to classical approaches.

The solution centered on a quantum noise injection protocol that protected sensitive financial data by adding precisely calibrated quantum noise. This approach leveraged quantum superposition principles to create privacy guarantees mathematically provable at the quantum mechanical level. The solution incorporated homomorphic encryption techniques allowing computations on encrypted data without decryption, further enhancing security.

A key innovation was the quantum-classical hybrid architecture that enabled practical implementation within Barclays' existing data infrastructure. Specially designed quantum circuits performed the privacy-preserving transformations, while classical systems handled data management and analytical tasks. This architecture allowed integration with production systems without requiring quantum connectivity throughout the bank's infrastructure.

## Implementation

The project proceeded through several carefully structured phases beginning with problem identification and technical planning. Initially, Barclays identified specific financial data workloads that balanced commercial value with privacy sensitivity, focusing on corporate client transaction analysis and retail banking product optimization. The team defined formal privacy requirements and utility metrics to evaluate solution performance.

During technical development, Quantinuum created quantum circuits specifically designed for differential privacy applications, optimized for their trapped-ion quantum processors. Barclays and Quantinuum jointly developed a hybrid quantum-classical interface allowing seamless data transfer between systems. Rigorous testing ensured the quantum privacy system maintained compliance with relevant regulations and technical standards.

The implementation phase began with controlled pilot testing using anonymized historical datasets from corporate banking operations. After successful pilot validation, the system was expanded to include specific retail banking data analytics workloads. Throughout implementation, the team maintained comprehensive security auditing and performance monitoring to ensure both technical and regulatory compliance.

## Results and Business Impact

The quantum differential privacy approach demonstrated substantial improvements over classical techniques in production environments. Data analyses retained 28% more statistical utility while providing equivalent privacy guarantees compared to classical differential privacy methods. This improvement was particularly pronounced for datasets containing complex correlations typical in financial transaction patterns.

The system successfully prevented inference attacks that had compromised classical privacy systems during controlled red-team testing exercises. Query response times increased by only 12% compared to non-privacy-enhanced systems, representing a significant performance improvement over classical privacy approaches which typically increased latency by 30-40%.

From a business perspective, the enhanced privacy capabilities enabled Barclays to extract valuable insights from sensitive datasets previously considered too risky to analyze. The compliance team reported improved confidence in regulatory adherence, while data scientists gained access to higher-quality anonymized datasets. The quantum privacy system positioned Barclays to offer enhanced data protection assurances to institutional clients, creating a potential competitive advantage in the corporate banking sector.

## Future Directions

Building on the successful implementation, Barclays and Quantinuum established a three-year quantum privacy roadmap. The next phase will expand the system to additional data domains including wealth management and investment banking analytics. Technical enhancements will focus on scaling the approach to larger datasets and more complex analytical workloads as quantum hardware capabilities mature.

Barclays has begun exploring commercial applications where quantum-enhanced privacy could create new product opportunities, particularly for institutional clients with stringent data protection requirements. The financial institution is evaluating potential quantum privacy as a service offerings for corporate clients seeking advanced protection for their own financial data.

On the technical front, Quantinuum continues refining the quantum circuits to improve efficiency and reduce resource requirements. This work includes developing specialized quantum algorithms for specific financial data types and analytical patterns. Both organizations remain committed to contributing to international standards for quantum privacy, helping shape the emerging field while positioning themselves at its forefront.

## References

- Barclays Innovation Lab. (2023). "Quantum Computing Applications in Financial Data Protection."  
- Quantinuum Research. (2023). "Quantum Differential Privacy: Financial Sector Applications and Case Studies."
- Journal of Quantum Information Science. (2024). "Practical Implementation of Quantum Privacy Preserving Financial Analytics."
`;
          }
          
          // Initialize and conduct research
          console.log('Initializing research engine...');
          const researchEngine = new QuantumResearchEngine();
          await researchEngine.initialize(referenceText);
          
          console.log('Conducting research...');
          research = await researchEngine.conductResearch(partnership);
          console.log('Research completed:', research);
          
          // Update research data
          const updatedResearchData = [...researchData];
          const existingIndex = updatedResearchData.findIndex(r => r.id === partnership.id);
          
          if (existingIndex >= 0) {
            updatedResearchData[existingIndex] = research;
          } else {
            updatedResearchData.push(research);
          }
          
          handleUpdateResearchData(updatedResearchData);
          
        } catch (researchError) {
          console.error('Research process failed:', researchError);
          throw new Error(`Research failed: ${researchError.message}`);
        }
      }

      // Use the research data directly as the case study
      if (research && research.searchSuccess && research.data) {
        console.log('Using research data as case study:', research.data);
        const caseStudyData = research.data;
        
        // Save to localStorage for future use
        localStorage.setItem(`case-study-${partnership.id}`, JSON.stringify(caseStudyData));
        
        setGeneratedCaseStudy(caseStudyData);
        console.log('Case study generated successfully');
      } else {
        console.error('Research data not valid:', research);
        throw new Error('Failed to generate research data');
      }
      
    } catch (error) {
      console.error('Error generating case study:', error);
      alert(`Error generating case study: ${error.message}`);
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
                <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="hidden sm:inline">Quantum Case Study Processor</span>
                  <span className="sm:hidden">Qookie</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className={`hidden sm:flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
                          onClick={() => {
                            console.log('Selecting partnership:', partnership.id, partnership.company, partnership.partner);
                            setSelectedPartnership(partnership);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {partnership.company} + {partnership.partner}
                              </h3>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {partnership.year}
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
                                  console.log('Generate Case Study button clicked for partnership:', partnership);
                                  generateCaseStudy(partnership);
                                }}
                                disabled={isGenerating}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                              >
                                {(() => {
                                  const existingCaseStudy = localStorage.getItem(`case-study-${partnership.id}`);
                                  return existingCaseStudy ? 'View Case Study' : 'Generate Case Study';
                                })()}
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
                      <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Case Study</h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateCaseStudy(selectedPartnership, true)}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Regenerate
                        </button>
                        <button
                          onClick={() => exportCaseStudyAsMarkdown(generatedCaseStudy)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Download className="w-4 h-4" />
                          Export Markdown
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Title and Summary */}
                      <div>
                        <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {generatedCaseStudy.title}
                        </h3>
                        <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {generatedCaseStudy.summary}
                        </p>
                      </div>

                      {/* Introduction */}
                      {generatedCaseStudy.introduction && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Introduction</h4>
                          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {generatedCaseStudy.introduction}
                          </p>
                        </div>
                      )}

                      {/* Challenge */}
                      {generatedCaseStudy.challenge && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Challenge</h4>
                          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {generatedCaseStudy.challenge}
                          </p>
                        </div>
                      )}

                      {/* Solution */}
                      {generatedCaseStudy.solution && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Solution</h4>
                          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {generatedCaseStudy.solution}
                          </p>
                        </div>
                      )}

                      {/* Implementation */}
                      {generatedCaseStudy.implementation && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Implementation</h4>
                          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {generatedCaseStudy.implementation}
                          </p>
                        </div>
                      )}

                      {/* Results and Business Impact */}
                      {generatedCaseStudy.results_and_business_impact && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Results and Business Impact</h4>
                          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {generatedCaseStudy.results_and_business_impact}
                          </p>
                        </div>
                      )}

                      {/* Technical Details */}
                      {generatedCaseStudy.technical_details && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Technical Details</h4>
                          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {generatedCaseStudy.technical_details}
                          </p>
                        </div>
                      )}

                      {/* Future Directions */}
                      {generatedCaseStudy.future_directions && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Future Directions</h4>
                          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {generatedCaseStudy.future_directions}
                          </p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Case Study Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className={`block font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Algorithms:</span>
                            <p className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{generatedCaseStudy.algorithms?.join(', ') || 'None specified'}</p>
                          </div>
                          <div>
                            <span className={`block font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Industries:</span>
                            <p className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{generatedCaseStudy.industries?.join(', ') || 'None specified'}</p>
                          </div>
                          <div>
                            <span className={`block font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Target Personas:</span>
                            <p className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{generatedCaseStudy.personas?.join(', ') || 'None specified'}</p>
                          </div>
                          <div>
                            <span className={`block font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Research Quality:</span>
                            <p className={darkMode ? 'text-gray-300' : 'text-gray-900'}>
                              {generatedCaseStudy.research_quality?.confidence_level || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* References */}
                      {(generatedCaseStudy.scientific_references?.length > 0 || generatedCaseStudy.company_resources?.length > 0) && (
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>References</h4>
                          
                          {generatedCaseStudy.scientific_references?.length > 0 && (
                            <div className="mb-4">
                              <h5 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Scientific References:</h5>
                              <ul className="space-y-1 text-sm">
                                {generatedCaseStudy.scientific_references.map((ref, index) => (
                                  <li key={index} className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                    • {ref.title} ({ref.year})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {generatedCaseStudy.company_resources?.length > 0 && (
                            <div>
                              <h5 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Company Resources:</h5>
                              <ul className="space-y-1 text-sm">
                                {generatedCaseStudy.company_resources.map((resource, index) => (
                                  <li key={index} className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                    • {resource.title} ({resource.type})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
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