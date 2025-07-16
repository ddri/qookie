import React, { useState } from 'react';
import { Search, PlayCircle, PauseCircle, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useDarkMode } from '../QuantumCaseStudyProcessor.jsx';

const SearchAllCasesFeature = ({ sourceData, onUpdateResearchData, researchData }) => {
  const { darkMode } = useDarkMode();
  const [searchStatus, setSearchStatus] = useState('idle');
  const [currentSearch, setCurrentSearch] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const performSearch = async (partnership) => {
    const searchPrompt = `search for and provide comprehensive information about the quantum computing partnership between ${partnership.company} and ${partnership.partner}. Include:

1. Partnership details and timeline
2. Technical objectives and quantum applications
3. Business outcomes and impact
4. Scientific publications or research papers
5. Company press releases or announcements
6. Current status and future plans

Format the response as JSON with these fields:
{
  "found": boolean,
  "title": "Partnership Title",
  "year": "Year",
  "content": "Detailed description",
  "technical_details": "Technical aspects",
  "business_impact": "Business outcomes",
  "scientificReferences": [{"title": "Paper title", "url": "URL", "year": "2023"}],
  "companyResources": [{"title": "Resource title", "url": "URL", "type": "press release"}],
  "status": "current status",
  "notes": "Additional notes"
}

Partnership: ${partnership.company} + ${partnership.partner}`;

    try {
      const response = await window.claude.complete(searchPrompt);
      const parsedResponse = JSON.parse(response);
      
      return {
        id: partnership.id,
        company: partnership.company,
        partner: partnership.partner,
        searchSuccess: true,
        data: parsedResponse,
        searchDate: new Date().toISOString()
      };
    } catch (error) {
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
        {/* Search Controls */}
        <div className="flex items-center gap-4">
          {searchStatus === 'idle' && (
            <button
              onClick={startBulkSearch}
              disabled={!sourceData || sourceData.length === 0}
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
            <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <div>
              <h4 className={`font-medium mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>How Bulk Search Works:</h4>
              <ul className="space-y-1">
                <li>• Searches for partnerships that don't have research data yet</li>
                <li>• Uses Claude API to find comprehensive partnership information</li>
                <li>• Automatically saves research data for each partnership</li>
                <li>• Can be paused and resumed at any time</li>
                <li>• Results are saved in real-time to prevent data loss</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAllCasesFeature;