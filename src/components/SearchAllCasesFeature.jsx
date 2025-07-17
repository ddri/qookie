import React, { useState, useEffect } from 'react';
import { Search, PlayCircle, PauseCircle, CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Zap } from 'lucide-react';
import { useDarkMode } from '../QuantumCaseStudyProcessor.jsx';
import { QuantumResearchEngine } from '../research/QuantumResearchEngine.js';

const SearchAllCasesFeature = ({ sourceData, onUpdateResearchData, researchData }) => {
  const { darkMode } = useDarkMode();
  const [searchStatus, setSearchStatus] = useState('idle');
  const [currentSearch, setCurrentSearch] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [researchEngine, setResearchEngine] = useState(null);
  const [engineStatus, setEngineStatus] = useState('initializing');

  // Initialize research engine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        setEngineStatus('loading_reference');
        
        // Load reference case study with fallback
        let referenceText;
        try {
          const referenceResponse = await fetch('/reference/ReferenceCaseStudy-Barclays-and-Quantinuum.md');
          if (!referenceResponse.ok) {
            throw new Error(`Failed to load reference: ${referenceResponse.status}`);
          }
          referenceText = await referenceResponse.text();
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
        
        // Initialize research engine
        const engine = new QuantumResearchEngine();
        await engine.initialize(referenceText);
        
        setResearchEngine(engine);
        setEngineStatus('ready');
        
      } catch (error) {
        console.error('Failed to initialize research engine:', error);
        setEngineStatus('error');
      }
    };
    
    initializeEngine();
  }, []);

  const performSearch = async (partnership) => {
    if (!researchEngine) {
      throw new Error('Research engine not initialized');
    }
    
    try {
      return await researchEngine.conductResearch(partnership);
    } catch (error) {
      console.error('Research failed:', error);
      return {
        id: partnership.id,
        company: partnership.company,
        partner: partnership.partner,
        searchSuccess: false,
        error: error.message,
        searchDate: new Date().toISOString()
      };
    }
  };

  const startBulkSearch = async () => {
    if (!sourceData || sourceData.length === 0) {
      alert('No partnership data available to search');
      return;
    }

    if (engineStatus !== 'ready') {
      alert('Research engine not ready. Please wait for initialization to complete.');
      return;
    }

    setSearchStatus('running');
    setSearchProgress(0);
    setSearchResults([]);
    setIsPaused(false);

    const partnershipsToSearch = sourceData.filter(partnership => {
      const existingResearch = researchData.find(r => r.id === partnership.id);
      return !existingResearch || !existingResearch.searchSuccess;
    });

    if (partnershipsToSearch.length === 0) {
      setSearchStatus('completed');
      alert('All partnerships already have research data');
      return;
    }

    const results = [];
    
    for (let i = 0; i < partnershipsToSearch.length; i++) {
      if (isPaused) {
        setSearchStatus('paused');
        break;
      }

      const partnership = partnershipsToSearch[i];
      setCurrentSearch(partnership);
      
      try {
        const result = await performSearch(partnership);
        results.push(result);
        setSearchResults([...results]);
        
        // Update research data in real-time
        const updatedResearchData = [...researchData];
        const existingIndex = updatedResearchData.findIndex(r => r.id === partnership.id);
        
        if (existingIndex >= 0) {
          updatedResearchData[existingIndex] = result;
        } else {
          updatedResearchData.push(result);
        }
        
        onUpdateResearchData(updatedResearchData);
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorResult = {
          id: partnership.id,
          company: partnership.company,
          partner: partnership.partner,
          searchSuccess: false,
          error: error.message,
          searchDate: new Date().toISOString()
        };
        results.push(errorResult);
        setSearchResults([...results]);
      }
      
      setSearchProgress(((i + 1) / partnershipsToSearch.length) * 100);
    }
    
    setCurrentSearch(null);
    setSearchStatus('completed');
  };

  const pauseSearch = () => {
    setIsPaused(true);
    setSearchStatus('paused');
  };

  const resumeSearch = () => {
    setIsPaused(false);
    setSearchStatus('running');
    // Note: In a real implementation, you'd need to resume from where you left off
  };

  const resetSearch = () => {
    setSearchStatus('idle');
    setCurrentSearch(null);
    setSearchResults([]);
    setSearchProgress(0);
    setIsPaused(false);
  };

  const getStatusIcon = (result) => {
    if (result.searchSuccess) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (searchStatus) {
      case 'running':
        return 'Searching...';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Search Completed';
      default:
        return 'Ready to Search';
    }
  };

  const partnershipsWithoutData = sourceData ? sourceData.filter(partnership => {
    const existingResearch = researchData.find(r => r.id === partnership.id);
    return !existingResearch || !existingResearch.searchSuccess;
  }).length : 0;

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <Search className="w-5 h-5" />
        Bulk Search for Missing Research Data
      </h2>
      
      <div className="space-y-4">
        {/* Research Engine Status */}
        <div className={`p-3 rounded-lg mb-4 ${
          engineStatus === 'ready' 
            ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-800')
            : engineStatus === 'error'
            ? (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-800')
            : (darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-50 text-yellow-800')
        }`}>
          <div className="flex items-center gap-2">
            {engineStatus === 'ready' && <Database className="w-4 h-4" />}
            {engineStatus === 'error' && <XCircle className="w-4 h-4" />}
            {engineStatus !== 'ready' && engineStatus !== 'error' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            <span className="font-medium">
              {engineStatus === 'initializing' && 'Initializing Research Engine...'}
              {engineStatus === 'loading_reference' && 'Loading Reference Case Study...'}
              {engineStatus === 'ready' && 'Research Engine Ready'}
              {engineStatus === 'error' && 'Research Engine Error'}
            </span>
          </div>
          {engineStatus === 'ready' && (
            <p className="text-sm mt-1">
              High-quality research enabled with Barclays-Quantinuum reference standard
            </p>
          )}
        </div>

        {/* Search Controls */}
        <div className="flex items-center gap-4">
          {searchStatus === 'idle' && (
            <button
              onClick={startBulkSearch}
              disabled={!sourceData || sourceData.length === 0 || engineStatus !== 'ready'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-4 h-4" />
              Start Bulk Search
            </button>
          )}
          
          {searchStatus === 'running' && (
            <button
              onClick={pauseSearch}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              <PauseCircle className="w-4 h-4" />
              Pause Search
            </button>
          )}
          
          {searchStatus === 'paused' && (
            <button
              onClick={resumeSearch}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <PlayCircle className="w-4 h-4" />
              Resume Search
            </button>
          )}
          
          {(searchStatus === 'completed' || searchStatus === 'paused') && (
            <button
              onClick={resetSearch}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>

        {/* Status Display */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{getStatusText()}</span>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {partnershipsWithoutData} partnerships need research data
            </span>
          </div>
          
          {searchStatus === 'running' && (
            <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${searchProgress}%` }}
              />
            </div>
          )}
          
          {currentSearch && (
            <div className={`mt-2 flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Currently searching: {currentSearch.company} + {currentSearch.partner}
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Search Results</h3>
            <div className={`max-h-60 overflow-y-auto border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="space-y-2 p-4">
                {searchResults.map(result => (
                  <div key={result.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result)}
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {result.company} + {result.partner}
                      </span>
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {result.searchSuccess ? (
                        <span className={darkMode ? 'text-green-400' : 'text-green-600'}>Research data found</span>
                      ) : (
                        <span className={darkMode ? 'text-red-400' : 'text-red-600'}>
                          Error: {result.error || 'Search failed'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`text-sm p-3 rounded-lg ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
          <div className="flex items-start gap-2">
            <Zap className={`w-4 h-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <div>
              <h4 className={`font-medium mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>Enhanced Research Engine:</h4>
              <ul className="space-y-1">
                <li>• Uses Barclays-Quantinuum case study as quality reference standard</li>
                <li>• Generates comprehensive case studies with technical details</li>
                <li>• Includes business impact metrics and implementation details</li>
                <li>• Provides scientific references and company resources</li>
                <li>• Automatic retry logic and quality validation</li>
                <li>• Results cached for performance and saved in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAllCasesFeature;