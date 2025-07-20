import React, { useState, useEffect } from 'react';
import { useCaseStudyStore } from './stores';

function App() {
  const [partnerships, setPartnerships] = useState([]);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  
  // Zustand stores
  const { 
    getCaseStudy, 
    generateCaseStudy, 
    regenerateCaseStudy,
    loading: caseStudyLoading, 
    error: caseStudyError,
    clearError: clearCaseStudyError
  } = useCaseStudyStore();
  
  // Derived state
  const caseStudy = selectedPartnership ? getCaseStudy(selectedPartnership.id) : null;
  
  const [error, setError] = useState(null);
  const [researchHistory, setResearchHistory] = useState([]);
  const [exportStatus, setExportStatus] = useState(null); // 'success', 'error', or null
  const [analyzing, setAnalyzing] = useState(false);
  const [referenceLists, setReferenceLists] = useState({
    algorithms: [],
    industries: [],
    personas: []
  });
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514');
  const [githubPushing, setGithubPushing] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null); // 'success', 'error', or null
  const [collectingReferences, setCollectingReferences] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null); // 'backing-up', 'success', 'error', or null
  const [restoreStatus, setRestoreStatus] = useState(null); // 'restoring', 'success', 'error', or null
  const [availableBackups, setAvailableBackups] = useState([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showFileConflictDialog, setShowFileConflictDialog] = useState(false);
  const [fileConflictData, setFileConflictData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [batchStep, setBatchStep] = useState(0); // 0=not running, 1=case study, 2=analysis, 3=references
  const [batchError, setBatchError] = useState(null);

  // Load everything on startup - simple CMS pattern
  useEffect(() => {
    loadPartnerships(); // Just load the damn data
    setResearchHistory(getResearchHistory());
    loadReferenceLists();
    
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('qookie-dark-mode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('qookie-dark-mode', JSON.stringify(darkMode));
    // Update document body background
    document.body.style.backgroundColor = darkMode ? '#111827' : '#f8fafc';
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Load cached case studies when partnership is selected
  // Load cached case study when partnership changes
  useEffect(() => {
    if (selectedPartnership) {
      const cachedCaseStudy = getCachedCaseStudy(selectedPartnership.id);
      if (cachedCaseStudy && !getCaseStudy(selectedPartnership.id)) {
        // Only load from cache if store doesn't already have it
        useCaseStudyStore.getState().setCaseStudy(selectedPartnership.id, cachedCaseStudy);
        console.log('Loaded cached case study into store for partnership:', selectedPartnership.id);
      }
    }
  }, [selectedPartnership, getCaseStudy]);

  const loadPartnerships = async (csvText = null) => {
    try {
      let text = csvText;
      if (!text) {
        const response = await fetch('/data/quantum-partnerships.csv');
        text = await response.text();
      }
      const parsed = parseCSV(text);
      setPartnerships(parsed);
      console.log(`Loaded ${parsed.length} partnerships`);
    } catch (error) {
      console.error('Failed to load partnerships:', error);
      setError('Failed to load partnership data');
    }
  };

  const importCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      loadPartnerships(csvText);
    };
    reader.onerror = () => {
      setError('Failed to read CSV file');
    };
    reader.readAsText(file);
  };

  // Standard data normalization - ensures consistent partnership object structure
  const normalizePartnership = (rawData, index = 0) => {
    return {
      id: rawData.id !== undefined && rawData.id !== '' ? parseInt(rawData.id) : index + 1,
      company: rawData.company || rawData.quantum_company || '',
      partner: rawData.partner || rawData.commercial_partner || '',
      year: rawData.year || '',
      notes: rawData.notes || '',
      // Keep original field names for backward compatibility
      quantum_company: rawData.company || rawData.quantum_company || '',
      commercial_partner: rawData.partner || rawData.commercial_partner || ''
    };
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.match(/(\".*?\"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map(v => v.replace(/^\"|\"$/g, '').trim());
      
      const row = {};
      headers.forEach((header, i) => {
        row[header] = cleanValues[i] || '';
      });
      
      // Use normalization function to ensure consistent structure
      return normalizePartnership(row, index);
    }).filter(row => row.company && row.partner);
  };

  const loadReferenceLists = async () => {
    try {
      const [algorithmsResponse, industriesResponse, personasResponse] = await Promise.all([
        fetch('/reference/ReferenceListQuantumAlgorithms.md'),
        fetch('/reference/ReferenceListQuantumIndustries.md'),
        fetch('/reference/ReferenceListQuantumPersonas.md')
      ]);

      const [algorithmsText, industriesText, personasText] = await Promise.all([
        algorithmsResponse.text(),
        industriesResponse.text(),
        personasResponse.text()
      ]);

      const parseMarkdownList = (text) => {
        // Extract items from markdown list (lines starting with - or *) OR plain text lines
        return text
          .split('\n')
          .map(line => line.trim())
          .filter(line => {
            // Include lines that start with - or * (markdown lists)
            if (line.match(/^[-*]\s+/)) return true;
            // Include non-empty lines that don't start with # (not headers)
            if (line.length > 0 && !line.startsWith('#')) return true;
            return false;
          })
          .map(line => line.replace(/^[-*]\s+/, '').trim())
          .filter(item => item.length > 0);
      };

      const parsedLists = {
        algorithms: parseMarkdownList(algorithmsText),
        industries: parseMarkdownList(industriesText),
        personas: parseMarkdownList(personasText)
      };
      
      // DEBUG: Log parsed reference lists in detail
      console.log('🔍 DEBUG: Parsed reference lists:');
      console.log('- Algorithms count:', parsedLists.algorithms.length);
      console.log('- Algorithms sample:', parsedLists.algorithms.slice(0, 3));
      console.log('- Industries count:', parsedLists.industries.length);
      console.log('- Industries sample:', parsedLists.industries.slice(0, 3));
      console.log('- Personas count:', parsedLists.personas.length);
      console.log('- Personas sample:', parsedLists.personas.slice(0, 3));
      
      setReferenceLists(parsedLists);
      console.log('✅ Reference lists loaded successfully');
    } catch (error) {
      console.error('Failed to load reference lists:', error);
    }
  };

  const getCachedCaseStudy = (partnershipId) => {
    try {
      const cached = localStorage.getItem(`case-study-${partnershipId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to load cached case study:', error);
      return null;
    }
  };

  const saveCaseStudyToCache = (partnershipId, caseStudy) => {
    try {
      const cacheData = {
        ...caseStudy,
        _cached: true,
        _cachedAt: new Date().toISOString(),
        _partnershipId: partnershipId
      };
      localStorage.setItem(`case-study-${partnershipId}`, JSON.stringify(cacheData));
      
      // Update research history
      updateResearchHistory(partnershipId);
      
      console.log('Saved case study to cache:', partnershipId);
    } catch (error) {
      console.warn('Failed to save case study to cache:', error);
    }
  };

  const updateResearchHistory = (partnershipId) => {
    try {
      const history = getResearchHistory();
      const newEntry = {
        partnershipId,
        timestamp: new Date().toISOString(),
        partnership: partnerships.find(p => p.id === partnershipId)
      };
      
      // Add to beginning and keep only last 10
      const updatedHistory = [newEntry, ...history.filter(h => h.partnershipId !== partnershipId)].slice(0, 10);
      localStorage.setItem('research-history', JSON.stringify(updatedHistory));
      setResearchHistory(updatedHistory);
    } catch (error) {
      console.warn('Failed to update research history:', error);
    }
  };

  const getResearchHistory = () => {
    try {
      const history = localStorage.getItem('research-history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Failed to load research history:', error);
      return [];
    }
  };

  const generateMarkdown = (partnership, caseStudy) => {
    const sanitizeFilename = (str) => {
      return str
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase();
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString();
    };

    const markdown = `# ${partnership.company} & ${partnership.partner} Partnership Case Study

## Partnership Details
- **Quantum Company**: ${partnership.company}
- **Commercial Partner**: ${partnership.partner}
- **Year**: ${partnership.year || 'Unknown'}
- **Generated**: ${formatDate(caseStudy._cachedAt || new Date().toISOString())}
- **Cached**: ${caseStudy._cached ? 'Yes' : 'No'}

${caseStudy.summary ? `## Executive Summary
${caseStudy.summary}

` : ''}${caseStudy.introduction ? `## Introduction
${caseStudy.introduction}

` : ''}${caseStudy.challenge ? `## Challenge
${caseStudy.challenge}

` : ''}${caseStudy.solution ? `## Solution
${caseStudy.solution}

` : ''}${caseStudy.implementation ? `## Implementation
${caseStudy.implementation}

` : ''}${caseStudy.results_and_business_impact ? `## Results & Business Impact
${caseStudy.results_and_business_impact}

` : ''}${caseStudy.future_directions ? `## Future Directions
${caseStudy.future_directions}

` : ''}${caseStudy.metadata ? `## Metadata
- **Algorithms**: ${caseStudy.metadata.algorithms && caseStudy.metadata.algorithms.join(', ') || 'None specified'}
- **Industries**: ${caseStudy.metadata.industries && caseStudy.metadata.industries.join(', ') || 'None specified'}
- **Target Personas**: ${caseStudy.metadata.personas && caseStudy.metadata.personas.join(', ') || 'None specified'}
- **Confidence Score**: ${caseStudy.metadata.confidence_score || 'Not provided'}

` : ''}${caseStudy.advancedMetadata ? `## Advanced Metadata
- **Algorithms**: ${caseStudy.advancedMetadata.algorithms && caseStudy.advancedMetadata.algorithms.join(', ') || 'None specified'}
- **Industries**: ${caseStudy.advancedMetadata.industries && caseStudy.advancedMetadata.industries.join(', ') || 'None specified'}
- **Target Personas**: ${caseStudy.advancedMetadata.personas && caseStudy.advancedMetadata.personas.join(', ') || 'None specified'}
- **Confidence Score**: ${caseStudy.advancedMetadata.confidence_score || 'Not provided'}
- **Analysis Notes**: ${caseStudy.advancedMetadata.analysis_notes || 'None'}
- **Analyzed**: ${caseStudy.advancedMetadata._analyzedAt ? new Date(caseStudy.advancedMetadata._analyzedAt).toLocaleString() : 'Not analyzed'}

` : ''}${caseStudy.references && caseStudy.references.length > 0 ? `## References

${caseStudy.references.map(ref => `- ${ref.citation || `${ref.authors && ref.authors.join(', ')} (${ref.year}). ${ref.title}. ${ref.journal}.`}${ref.url ? ` Available at: ${ref.url}` : ''}`).join('\n')}

` : ''}${caseStudy.furtherReading && caseStudy.furtherReading.length > 0 ? `## Further Reading

${caseStudy.furtherReading.map(item => `- **${item.title}** - ${item.source} (${item.date})${item.description ? `: ${item.description}` : ''}${item.url ? ` [Read More](${item.url})` : ''}`).join('\n')}

` : ''}${caseStudy.collectionNotes ? `## Collection Notes

${caseStudy.collectionNotes}

` : ''}---
*Generated by Quantum Partnership Research Tool*`;

    return markdown;
  };

  const exportToMarkdown = (partnership, caseStudy) => {
    try {
      const markdown = generateMarkdown(partnership, caseStudy);
      const baseFilename = `${partnership.company}-${partnership.partner}-${partnership.year || 'unknown'}-case-study`
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      const filename = `${baseFilename}.md`;

      // Create blob and download
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success feedback
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);

      console.log('Markdown exported successfully:', filename);
      return true;
    } catch (error) {
      console.error('Failed to export markdown:', error);
      
      // Show error feedback
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
      
      return false;
    }
  };

  const collectReferences = async (partnership, caseStudy) => {
    if (!caseStudy) return;
    
    setCollectingReferences(true);
    setError(null);

    try {
      console.log('Collecting references and further reading...', partnership);
      
      // Step 1: Search for academic papers
      const academicQuery = `"${partnership.company}" "${partnership.partner}" quantum computing research paper`;
      console.log('Searching for academic papers:', academicQuery);
      
      const academicResponse = await fetch('http://localhost:3002/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: academicQuery,
          type: 'academic'
        })
      });
      
      if (!academicResponse.ok) {
        throw new Error(`Academic search failed: ${academicResponse.status}`);
      }
      
      const academicData = await academicResponse.json();
      console.log('Academic search results:', academicData);
      
      // Step 2: Search for business coverage
      const businessQuery = `"${partnership.company}" "${partnership.partner}" partnership announcement blog press release`;
      console.log('Searching for business coverage:', businessQuery);
      
      const businessResponse = await fetch('http://localhost:3002/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: businessQuery,
          type: 'business'
        })
      });
      
      if (!businessResponse.ok) {
        throw new Error(`Business search failed: ${businessResponse.status}`);
      }
      
      const businessData = await businessResponse.json();
      console.log('Business search results:', businessData);
      
      // Step 3: Have Claude format the search results
      const response = await fetch('http://localhost:3002/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicData,
          businessData,
          caseStudy,
          model: selectedModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'References collection request failed');
      }

      // Parse the references results
      let referencesResult;
      try {
        console.log('Raw references API response:', data);
        
        // The new /api/references endpoint returns data.references
        if (data.references) {
          referencesResult = data.references;
          console.log('Found references in new endpoint response');
        } else {
          throw new Error('No references data in response');
        }
        
        console.log('Final references result:', referencesResult);
        console.log('References array:', referencesResult.references);
        console.log('Further reading array:', referencesResult.further_reading);
      } catch (parseError) {
        console.error('Parse error details:', parseError);
        throw new Error(`Failed to parse references results: ${parseError.message}`);
      }

      // Add references and further reading to case study
      const enhancedCaseStudy = {
        ...caseStudy,
        references: referencesResult.references || [],
        furtherReading: referencesResult.further_reading || [],
        collectionNotes: referencesResult.collection_notes || '',
        _referencesCollected: true,
        _referencesCollectedAt: new Date().toISOString()
      };
      
      console.log('Enhanced case study references:', enhancedCaseStudy.references);
      console.log('Enhanced case study furtherReading:', enhancedCaseStudy.furtherReading);

      // Save enhanced case study to cache and store
      saveCaseStudyToCache(partnership.id, enhancedCaseStudy);
      useCaseStudyStore.getState().setCaseStudy(partnership.id, enhancedCaseStudy);

      console.log('References and further reading collection completed successfully');

    } catch (error) {
      console.error('Error collecting references:', error);
      setError(`Failed to collect references: ${error.message}`);
    } finally {
      setCollectingReferences(false);
    }
  };

  const analyzeCaseStudy = async (partnership, caseStudy) => {
    if (!caseStudy) return;
    
    // Defensive programming: check if partnership exists
    if (!partnership) {
      console.error('Invalid partnership data for analysis:', partnership);
      setError('Invalid partnership data. Cannot analyze case study.');
      return;
    }
    
    setAnalyzing(true);
    setError(null);

    try {
      console.log('🔍 DEBUG: Starting analysis for:', partnership.company || partnership.quantum_company, '+', partnership.partner || partnership.commercial_partner);
      console.log('🔍 DEBUG: Reference lists state at analysis time:');
      console.log('- referenceLists object:', referenceLists);
      console.log('- Algorithms array exists?', Array.isArray(referenceLists.algorithms));
      console.log('- Algorithms count:', referenceLists.algorithms?.length || 0);
      console.log('- Industries array exists?', Array.isArray(referenceLists.industries));
      console.log('- Industries count:', referenceLists.industries?.length || 0);
      console.log('- Personas array exists?', Array.isArray(referenceLists.personas));
      console.log('- Personas count:', referenceLists.personas?.length || 0);
      
      const prompt = `You are analyzing a quantum computing case study. Your task is to match the case study content against provided reference lists and return ONLY a JSON object with the analysis results.

CASE STUDY TO ANALYZE:
Title: ${caseStudy.title}
Summary: ${caseStudy.summary || ''}
Introduction: ${caseStudy.introduction || ''}
Challenge: ${caseStudy.challenge || ''}
Solution: ${caseStudy.solution || ''}
Implementation: ${caseStudy.implementation || ''}
Results: ${caseStudy.results_and_business_impact || ''}
Future: ${caseStudy.future_directions || ''}

REFERENCE LISTS TO MATCH AGAINST:
Algorithms: ${referenceLists.algorithms?.join(', ') || 'No algorithms loaded'}
Industries: ${referenceLists.industries?.join(', ') || 'No industries loaded'}
Personas: ${referenceLists.personas?.join(', ') || 'No personas loaded'}

🔍 DEBUG INFO:
- Algorithms available: ${referenceLists.algorithms?.length || 0} items
- Industries available: ${referenceLists.industries?.length || 0} items
- Personas available: ${referenceLists.personas?.length || 0} items

INSTRUCTIONS:
1. Read the case study content carefully
2. Identify which algorithms, industries, and personas from the reference lists are most relevant
3. Only include items that actually exist in the reference lists
4. Be selective - only include highly relevant matches
5. Return ONLY valid JSON in this exact format (no other text):

{
  "title": "Analysis Results",
  "summary": "Analysis of quantum computing case study categorization",
  "introduction": "Based on the case study content, here are the matched categories:",
  "challenge": "Matching case study content to reference lists",
  "solution": "Selected most relevant items from each category",
  "implementation": "Analyzed content and matched to reference lists",
  "results_and_business_impact": "Found relevant matches in algorithms, industries, and personas",
  "future_directions": "Continue refining categorization accuracy",
  "metadata": {
    "algorithms": ["algorithm1", "algorithm2"],
    "industries": ["industry1", "industry2"],
    "personas": ["persona1", "persona2"],
    "confidence_score": 0.85,
    "analysis_notes": "Brief explanation of the analysis"
  }
}

Return ONLY the JSON object above with your analysis results.`;

      // DEBUG: Log the complete prompt being sent
      console.log('🔍 DEBUG: Analysis prompt being sent to API:');
      console.log('- Prompt length:', prompt.length);
      console.log('- Reference lists in prompt:');
      console.log('  - Algorithms section includes:', prompt.includes('Algorithms:') ? 'YES' : 'NO');
      console.log('  - Industries section includes:', prompt.includes('Industries:') ? 'YES' : 'NO');
      console.log('  - Personas section includes:', prompt.includes('Personas:') ? 'YES' : 'NO');
      if (referenceLists.algorithms?.length > 0) {
        console.log('  - First algorithm in prompt:', referenceLists.algorithms[0]);
      }
      if (referenceLists.industries?.length > 0) {
        console.log('  - First industry in prompt:', referenceLists.industries[0]);
      }
      if (referenceLists.personas?.length > 0) {
        console.log('  - First persona in prompt:', referenceLists.personas[0]);
      }

      const response = await fetch('http://localhost:3002/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStudy: caseStudy,
          analysisPrompt: prompt,
          model: selectedModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis request failed');
      }

      // Parse the analysis results
      let analysisResult;
      try {
        console.log('Raw API response:', data);
        
        // The analyze endpoint returns { analysis: {...}, metadata: {...} }
        if (data.analysis) {
          analysisResult = data.analysis;
          console.log('Found analysis in response:', analysisResult);
        } else {
          throw new Error('No analysis field found in response');
        }
        
        console.log('Final analysis result:', analysisResult);
      } catch (parseError) {
        console.error('Parse error details:', parseError);
        console.error('Response data structure:', data);
        throw new Error(`Failed to parse analysis results: ${parseError.message}`);
      }

      // Add advanced metadata alongside original metadata
      const enhancedCaseStudy = {
        ...caseStudy,
        advancedMetadata: {
          algorithms: analysisResult.algorithms || [],
          industries: analysisResult.industries || [],
          personas: analysisResult.personas || [],
          confidence_score: analysisResult.confidence_score || 0.8,
          analysis_notes: analysisResult.analysis_notes || '',
          _analyzed: true,
          _analyzedAt: new Date().toISOString()
        }
      };

      // Save enhanced case study to cache and store
      saveCaseStudyToCache(partnership.id, enhancedCaseStudy);
      useCaseStudyStore.getState().setCaseStudy(partnership.id, enhancedCaseStudy);

      console.log('Case study analysis completed successfully');

    } catch (error) {
      console.error('Error analyzing case study:', error);
      setError(`Failed to analyze case study: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Wrapper function for the store's generateCaseStudy
  const handleGenerateCaseStudy = async (partnership, forceRegenerate = false) => {
    // Defensive programming: check if partnership exists and has required properties
    if (!partnership || !partnership.company || !partnership.partner) {
      console.error('Invalid partnership data:', partnership);
      setError('Invalid partnership data. Please select a valid partnership.');
      return;
    }

    try {
      clearCaseStudyError(); // Clear any previous errors
      
      if (forceRegenerate) {
        await regenerateCaseStudy(partnership, selectedModel);
      } else {
        await generateCaseStudy(partnership, selectedModel, forceRegenerate);
      }
      
      // Also save to old cache for backward compatibility (temporary)
      const newCaseStudy = getCaseStudy(partnership.id);
      if (newCaseStudy) {
        saveCaseStudyToCache(partnership.id, newCaseStudy);
      }
      
    } catch (error) {
      console.error('Error generating case study:', error);
      setError(`Failed to generate case study: ${error.message}`);
    }
  };

  const runBatchProcess = async () => {
    if (!selectedPartnership) {
      setError('Please select a partnership first');
      return;
    }

    setBatchMode(true);
    setBatchStep(1);
    setBatchError(null);
    
    try {
      console.log('Starting batch process for:', selectedPartnership);
      
      // Step 1: Generate Case Study
      setBatchStep(1);
      await handleGenerateCaseStudy(selectedPartnership, true); // Force regenerate for fresh start
      
      // Wait for case study completion using store
      let attempts = 0;
      while (!getCaseStudy(selectedPartnership.id) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      const currentCaseStudy = getCaseStudy(selectedPartnership.id);
      if (!currentCaseStudy) {
        throw new Error('Case study generation failed - timeout waiting for completion');
      }
      
      console.log('✅ Step 1 complete: Case study generated', currentCaseStudy);
      
      // Step 2: Advanced Analysis
      setBatchStep(2);
      await analyzeCaseStudy(selectedPartnership, currentCaseStudy);
      
      // Poll for analysis completion
      attempts = 0;
      let updatedCaseStudy = null;
      while ((!updatedCaseStudy?.advancedMetadata) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updatedCaseStudy = getCaseStudy(selectedPartnership.id);
        attempts++;
      }
      
      if (!updatedCaseStudy?.advancedMetadata) {
        throw new Error('Advanced analysis failed - timeout waiting for completion');
      }
      
      console.log('✅ Step 2 complete: Advanced analysis done');
      
      // Step 3: Collect References
      setBatchStep(3);
      await collectReferences(selectedPartnership, updatedCaseStudy);
      
      // Poll for references completion
      attempts = 0;
      let finalCaseStudy = null;
      while ((!finalCaseStudy?._referencesCollected) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        finalCaseStudy = getCaseStudy(selectedPartnership.id);
        attempts++;
      }
      
      console.log('✅ Step 3 complete: References collected');
      
      // Complete
      setBatchStep(0);
      setBatchMode(false);
      console.log('🎉 Batch process completed successfully!');
      
    } catch (error) {
      console.error('❌ Batch process failed:', error);
      setBatchError(error.message);
      setBatchMode(false);
      setBatchStep(0);
      setError(`Batch processing failed at step ${batchStep}: ${error.message}`);
    }
  };

  const stopBatchProcess = () => {
    setBatchMode(false);
    setBatchStep(0);
    setBatchError(null);
    clearCaseStudyError();
    setAnalyzing(false);
    setCollectingReferences(false);
    console.log('🛑 Batch process stopped by user');
  };

  const pushToGitHub = async (partnership, caseStudy) => {
    if (!caseStudy) return;
    
    setGithubPushing(true);
    setGithubStatus(null);
    setError(null);

    try {
      const filename = `${partnership.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${partnership.partner.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${partnership.year}`;
      
      console.log('Pushing to GitHub:', filename);

      const response = await fetch('http://localhost:3002/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnership: partnership,
          caseStudy: caseStudy,
          filename: filename
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'GitHub push failed');
      }

      setGithubStatus('success');
      setTimeout(() => setGithubStatus(null), 5000);
      console.log('Successfully pushed to GitHub:', data.files);

    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      
      // Parse structured error messages from server
      if (error.message.startsWith('FILE_EXISTS:')) {
        const parts = error.message.split(':');
        const filename = parts[1];
        const message = parts[2];
        
        setFileConflictData({
          partnership,
          caseStudy,
          filename: filename.replace('exports/', '').replace(/\.(md|json)$/, ''),
          message
        });
        setShowFileConflictDialog(true);
        setGithubStatus(null);
      } else if (error.message.startsWith('REPO_NOT_FOUND:')) {
        setError('Repository not found or no access. Please check your GitHub configuration in .env file.');
        setGithubStatus('error');
      } else if (error.message.startsWith('AUTH_ERROR:')) {
        setError('Invalid GitHub token. Please check your GITHUB_TOKEN in .env file.');
        setGithubStatus('error');
      } else if (error.message.startsWith('GITHUB_ERROR:')) {
        const message = error.message.replace('GITHUB_ERROR:', '');
        setError(`GitHub API error: ${message}`);
        setGithubStatus('error');
      } else {
        setError(`Failed to push to GitHub: ${error.message}`);
        setGithubStatus('error');
      }
      
      if (!error.message.startsWith('FILE_EXISTS:')) {
        setTimeout(() => setGithubStatus(null), 8000);
      }
    } finally {
      setGithubPushing(false);
    }
  };

  const overwriteGitHubFiles = async (partnership, caseStudy, filename) => {
    setGithubPushing(true);
    setGithubStatus(null);
    setError(null);
    setShowFileConflictDialog(false);

    try {
      console.log('Overwriting GitHub files:', filename);

      const response = await fetch('http://localhost:3002/api/github/overwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnership: partnership,
          caseStudy: caseStudy,
          filename: filename
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'GitHub overwrite failed');
      }

      setGithubStatus('success');
      setTimeout(() => setGithubStatus(null), 5000);
      console.log('Successfully overwritten GitHub files:', data.files);

    } catch (error) {
      console.error('Error overwriting GitHub files:', error);
      setError(`Failed to overwrite GitHub files: ${error.message}`);
      setGithubStatus('error');
      setTimeout(() => setGithubStatus(null), 8000);
    } finally {
      setGithubPushing(false);
    }
  };

  const backupSession = async () => {
    setBackupStatus('backing-up');
    setError(null);

    try {
      // Gather all session data from localStorage
      const allCaseStudies = {};
      
      // Collect all individual case studies
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('case-study-')) {
          const partnershipId = key.replace('case-study-', '');
          allCaseStudies[partnershipId] = JSON.parse(localStorage.getItem(key));
        }
      }
      
      const sessionData = {
        caseStudies: allCaseStudies,
        researchHistory: JSON.parse(localStorage.getItem('researchHistory') || '[]'),
        preferences: {
          selectedModel: selectedModel,
          // Add other preferences as needed
        }
      };

      console.log('Backing up session data:', {
        caseStudiesCount: Object.keys(sessionData.caseStudies).length,
        historyCount: sessionData.researchHistory.length
      });

      const response = await fetch('http://localhost:3002/api/github/backup-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Session backup failed');
      }

      setBackupStatus('success');
      setTimeout(() => setBackupStatus(null), 5000);
      console.log('Session backup successful:', data.backup);

    } catch (error) {
      console.error('Session backup error:', error);
      setError(`Failed to backup session: ${error.message}`);
      setBackupStatus('error');
      setTimeout(() => setBackupStatus(null), 5000);
    }
  };

  const loadAvailableBackups = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/github/list-backups');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load backups');
      }

      setAvailableBackups(data.backups);
      console.log('Available backups loaded:', data.backups.length);

    } catch (error) {
      console.error('Error loading backups:', error);
      setError(`Failed to load backups: ${error.message}`);
    }
  };

  const restoreSession = async (backupFilename) => {
    setRestoreStatus('restoring');
    setError(null);

    try {
      console.log('Restoring session from:', backupFilename);

      const response = await fetch('http://localhost:3002/api/github/restore-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupFilename })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Session restore failed');
      }

      // Apply restored session data to localStorage
      const { sessionData, backupInfo } = data;
      
      if (sessionData.caseStudies) {
        // Restore individual case studies
        Object.entries(sessionData.caseStudies).forEach(([partnershipId, caseStudy]) => {
          localStorage.setItem(`case-study-${partnershipId}`, JSON.stringify(caseStudy));
        });
        
        // Update the caseStudies state
        setCaseStudies(sessionData.caseStudies);
      }
      
      if (sessionData.researchHistory) {
        localStorage.setItem('researchHistory', JSON.stringify(sessionData.researchHistory));
        setResearchHistory(sessionData.researchHistory);
      }
      
      if (sessionData.preferences && sessionData.preferences.selectedModel) {
        setSelectedModel(sessionData.preferences.selectedModel);
      }

      // Load partnerships data 
      await loadPartnerships();

      setRestoreStatus('success');
      setShowRestoreDialog(false);
      setTimeout(() => setRestoreStatus(null), 5000);
      console.log('Session restore successful:', backupInfo);

    } catch (error) {
      console.error('Session restore error:', error);
      setError(`Failed to restore session: ${error.message}`);
      setRestoreStatus('error');
      setTimeout(() => setRestoreStatus(null), 5000);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div className={darkMode ? 'dark' : ''} style={{ 
        minHeight: '100vh', 
        backgroundColor: darkMode ? '#111827' : '#f8fafc', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
      }}>
      {/* Header */}
      <div style={{
        backgroundColor: darkMode ? '#1f2937' : 'white',
        borderBottom: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
        padding: '20px 0',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '28px', 
                fontWeight: '700',
                color: darkMode ? '#f8fafc' : '#1e293b'
              }}>
                🍪 Qookie
              </h1>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: darkMode ? '#9ca3af' : '#64748b', 
                fontSize: '16px' 
              }}>
                Generate AI-powered case studies from quantum computing partnerships
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Session Backup/Restore */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={backupSession}
                  disabled={backupStatus === 'backing-up'}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: backupStatus === 'backing-up' ? (darkMode ? '#374151' : '#f3f4f6') : 
                                    backupStatus === 'success' ? '#dcfce7' :
                                    backupStatus === 'error' ? '#fef2f2' : (darkMode ? '#4b5563' : 'white'),
                    color: backupStatus === 'backing-up' ? '#6b7280' :
                           backupStatus === 'success' ? '#166534' :
                           backupStatus === 'error' ? '#991b1b' : (darkMode ? '#f9fafb' : '#374151'),
                    cursor: backupStatus === 'backing-up' ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {backupStatus === 'backing-up' ? '⏳ Backing up...' :
                   backupStatus === 'success' ? '✅ Backed up' :
                   backupStatus === 'error' ? '❌ Backup failed' : '💾 Backup Session'}
                </button>

                <button
                  onClick={() => {
                    setShowRestoreDialog(true);
                    loadAvailableBackups();
                  }}
                  disabled={restoreStatus === 'restoring'}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: restoreStatus === 'restoring' ? (darkMode ? '#374151' : '#f3f4f6') : 
                                    restoreStatus === 'success' ? '#dcfce7' :
                                    restoreStatus === 'error' ? '#fef2f2' : (darkMode ? '#4b5563' : 'white'),
                    color: restoreStatus === 'restoring' ? '#6b7280' :
                           restoreStatus === 'success' ? '#166534' :
                           restoreStatus === 'error' ? '#991b1b' : (darkMode ? '#f9fafb' : '#374151'),
                    cursor: restoreStatus === 'restoring' ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {restoreStatus === 'restoring' ? '⏳ Restoring...' :
                   restoreStatus === 'success' ? '✅ Restored' :
                   restoreStatus === 'error' ? '❌ Restore failed' : '📥 Restore Session'}
                </button>
              </div>

              {/* Model Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: darkMode ? '#d1d5db' : '#374151' 
                }}>
                  Claude Model:
                </label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? '#f9fafb' : '#374151',
                    cursor: 'pointer',
                    minWidth: '260px'
                  }}
                >
                  <option value="claude-opus-4-20250514">Claude 4 Opus (Most Capable)</option>
                  <option value="claude-sonnet-4-20250514">Claude 4 Sonnet (Latest & Recommended)</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast & Smart)</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fastest)</option>
                </select>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                style={{
                  padding: '8px',
                  fontSize: '18px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: darkMode ? '#374151' : '#f9fafb',
                  color: darkMode ? '#fbbf24' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Left Column - Partnership List */}
          <div style={{ 
            backgroundColor: darkMode ? '#1f2937' : 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
            position: 'sticky',
            top: '30px'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px', 
              fontWeight: '600',
              color: darkMode ? '#f8fafc' : '#1e293b'
            }}>
              Partnerships ({partnerships.length})
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gap: '8px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {partnerships.map(partnership => {
                const hasCachedCaseStudy = getCachedCaseStudy(partnership.id) !== null;
                
                return (
                <div 
                  key={partnership.id}
                  onClick={() => setSelectedPartnership(normalizePartnership(partnership))}
                  style={{
                    padding: '12px 16px',
                    border: selectedPartnership && selectedPartnership.id === partnership.id 
                      ? '2px solid #3b82f6' 
                      : darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: selectedPartnership && selectedPartnership.id === partnership.id 
                      ? darkMode ? '#1e3a8a' : '#eff6ff'
                      : darkMode ? '#374151' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: darkMode ? '#f8fafc' : '#1e293b',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>{partnership.company} + {partnership.partner}</span>
                    {hasCachedCaseStudy && (
                      <span style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '8px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontWeight: '500'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: darkMode ? '#9ca3af' : '#64748b'
                  }}>
                    <span>{partnership.year || 'Unknown'}</span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>


          {/* Right Column - Selected Partnership & Case Study */}
          <div style={{ display: 'grid', gap: '20px' }}>
            
            {/* Partnership Header */}
            <div style={{ 
              backgroundColor: darkMode ? '#1f2937' : 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                {selectedPartnership ? `${selectedPartnership.company} + ${selectedPartnership.partner}` : 'Select a Partnership'}
              </h2>
              <p style={{ margin: '8px 0 0 0', color: darkMode ? '#9ca3af' : '#64748b' }}>
                {selectedPartnership ? `Year: ${selectedPartnership.year || 'Unknown'}` : 'Choose from the list to generate a case study'}
              </p>
            </div>

            {/* Batch Processing Controls */}
            {selectedPartnership && (
              <div style={{ 
                backgroundColor: darkMode ? '#1f2937' : 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: batchMode ? '12px' : '0' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                    🚀 Batch Processing
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!batchMode ? (
                      <button
                        onClick={runBatchProcess}
                        disabled={!selectedPartnership}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: selectedPartnership ? 'pointer' : 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '500',
                          opacity: selectedPartnership ? 1 : 0.6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedPartnership) {
                            e.target.style.backgroundColor = '#2563eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedPartnership) {
                            e.target.style.backgroundColor = '#3b82f6';
                          }
                        }}
                      >
                        ⚡ Run All Steps
                      </button>
                    ) : (
                      <button
                        onClick={stopBatchProcess}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#ef4444';
                        }}
                      >
                        🛑 Stop
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress Indicator */}
                {batchMode && (
                  <div style={{ 
                    backgroundColor: darkMode ? '#374151' : '#f8fafc',
                    borderRadius: '8px',
                    padding: '12px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #e5e7eb',
                        borderTop: '2px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#f3f4f6' : '#1f2937' }}>
                        Step {batchStep} of 3: {
                          batchStep === 1 ? 'Generating Case Study...' :
                          batchStep === 2 ? 'Running Advanced Analysis...' :
                          batchStep === 3 ? 'Collecting References...' :
                          'Processing...'
                        }
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: darkMode ? '#4b5563' : '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(batchStep / 3) * 100}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                )}

                {/* Batch Error */}
                {batchError && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: darkMode ? '#7f1d1d' : '#fee2e2',
                    border: darkMode ? '1px solid #991b1b' : '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: darkMode ? '#fca5a5' : '#991b1b'
                  }}>
                    ❌ {batchError}
                  </div>
                )}
              </div>
            )}

            {/* Case Study Container */}
            <div 
              onClick={() => !batchMode && selectedPartnership && !caseStudy && !caseStudyLoading ? handleGenerateCaseStudy(selectedPartnership) : null}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: batchMode && batchStep === 1 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                cursor: !batchMode && selectedPartnership && !caseStudy && !caseStudyLoading ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                opacity: !selectedPartnership ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!batchMode && selectedPartnership && !caseStudy && !caseStudyLoading) {
                  e.target.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!batchMode && selectedPartnership && !caseStudy && !caseStudyLoading) {
                  e.target.style.backgroundColor = darkMode ? '#1f2937' : 'white';
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = batchMode && batchStep === 1 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                  📄 Case Study
                </h3>
                {caseStudy && !caseStudyLoading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateCaseStudy(selectedPartnership, true);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#d97706';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f59e0b';
                    }}
                  >
                    🔄 Regenerate
                  </button>
                )}
              </div>
              <div style={{ 
                color: darkMode ? '#9ca3af' : '#64748b',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: caseStudy ? (darkMode ? '#065f46' : '#f0fdf4') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: caseStudy ? `1px solid #10b981` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {caseStudyLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Generating case study...
                  </div>
                ) : caseStudy ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ fontWeight: '600', marginBottom: '24px', color: darkMode ? '#f3f4f6' : '#1f2937', fontSize: '20px' }}>
                      {caseStudy.title}
                    </div>
                    
                    {/* Executive Summary */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#d1d5db' : '#374151', marginBottom: '8px' }}>
                        📋 Executive Summary
                      </h4>
                      <p style={{ color: darkMode ? '#f3f4f6' : '#1f2937', lineHeight: '1.6', margin: 0 }}>
                        {caseStudy.summary}
                      </p>
                    </div>

                    {/* Introduction */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#d1d5db' : '#374151', marginBottom: '8px' }}>
                        🚀 Introduction
                      </h4>
                      <p style={{ color: darkMode ? '#f3f4f6' : '#1f2937', lineHeight: '1.6', margin: 0 }}>
                        {caseStudy.introduction}
                      </p>
                    </div>

                    {/* Challenge */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#d1d5db' : '#374151', marginBottom: '8px' }}>
                        ⚡ Challenge
                      </h4>
                      <p style={{ color: darkMode ? '#f3f4f6' : '#1f2937', lineHeight: '1.6', margin: 0 }}>
                        {caseStudy.challenge}
                      </p>
                    </div>

                    {/* Solution */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#d1d5db' : '#374151', marginBottom: '8px' }}>
                        💡 Solution
                      </h4>
                      <p style={{ color: darkMode ? '#f3f4f6' : '#1f2937', lineHeight: '1.6', margin: 0 }}>
                        {caseStudy.solution}
                      </p>
                    </div>

                    {/* Implementation */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#d1d5db' : '#374151', marginBottom: '8px' }}>
                        ⚙️ Implementation
                      </h4>
                      <p style={{ color: darkMode ? '#f3f4f6' : '#1f2937', lineHeight: '1.6', margin: 0 }}>
                        {caseStudy.implementation}
                      </p>
                    </div>

                    {/* Results & Business Impact */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#d1d5db' : '#374151', marginBottom: '8px' }}>
                        📊 Results & Business Impact
                      </h4>
                      <p style={{ color: darkMode ? '#f3f4f6' : '#1f2937', lineHeight: '1.6', margin: 0 }}>
                        {caseStudy.results_and_business_impact}
                      </p>
                    </div>

                    {/* Future Directions */}
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#d1d5db' : '#374151', marginBottom: '8px' }}>
                        🔮 Future Directions
                      </h4>
                      <p style={{ color: darkMode ? '#f3f4f6' : '#1f2937', lineHeight: '1.6', margin: 0 }}>
                        {caseStudy.future_directions}
                      </p>
                    </div>
                  </div>
                ) : selectedPartnership ? (
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                      Click to generate case study
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Create detailed analysis and insights
                    </div>
                  </div>
                ) : (
                  'Select a partnership to begin'
                )}
              </div>
            </div>

            {/* Metadata Container */}
            <div 
              onClick={() => caseStudy && !caseStudy.metadata ? null : null}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                cursor: 'default',
                transition: 'all 0.2s ease',
                opacity: !caseStudy ? 0.6 : 1
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                🏷️ Metadata
              </h3>
              <div style={{ 
                color: darkMode ? '#9ca3af' : '#64748b',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: caseStudy?.metadata ? (darkMode ? '#1e3a8a' : '#f0f9ff') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: caseStudy?.metadata ? `1px solid #3b82f6` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {caseStudy?.metadata ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div><strong>Algorithms:</strong> {caseStudy.metadata.algorithms?.join(', ') || 'None'}</div>
                      <div><strong>Industries:</strong> {caseStudy.metadata.industries?.join(', ') || 'None'}</div>
                      <div><strong>Personas:</strong> {caseStudy.metadata.personas?.join(', ') || 'None'}</div>
                      <div><strong>Confidence:</strong> {caseStudy.metadata.confidence_score || 'N/A'}</div>
                    </div>
                  </div>
                ) : caseStudy ? (
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Metadata is automatically generated with case study
                    </div>
                  </div>
                ) : (
                  'Generate case study first'
                )}
              </div>
            </div>

            {/* Advanced Metadata Container */}
            <div 
              onClick={() => !batchMode && caseStudy && !caseStudy.advancedMetadata && !analyzing ? analyzeCaseStudy(selectedPartnership, caseStudy) : null}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: batchMode && batchStep === 2 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                cursor: !batchMode && caseStudy && !caseStudy.advancedMetadata && !analyzing ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                opacity: !caseStudy ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!batchMode && caseStudy && !caseStudy.advancedMetadata && !analyzing) {
                  e.target.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!batchMode && caseStudy && !caseStudy.advancedMetadata && !analyzing) {
                  e.target.style.backgroundColor = darkMode ? '#1f2937' : 'white';
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = batchMode && batchStep === 2 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                  🔬 Advanced Metadata
                </h3>
                {caseStudy?.advancedMetadata && !analyzing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      analyzeCaseStudy(selectedPartnership, caseStudy);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#7c3aed';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#8b5cf6';
                    }}
                  >
                    🔄 Re-analyze
                  </button>
                )}
              </div>
              <div style={{ 
                color: darkMode ? '#9ca3af' : '#64748b',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: caseStudy?.advancedMetadata ? (darkMode ? '#065f46' : '#f0fdf4') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: caseStudy?.advancedMetadata ? `1px solid #10b981` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {analyzing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Analyzing case study...
                  </div>
                ) : caseStudy?.advancedMetadata ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div><strong>Algorithms:</strong> {caseStudy.advancedMetadata.algorithms?.join(', ') || 'None'}</div>
                      <div><strong>Industries:</strong> {caseStudy.advancedMetadata.industries?.join(', ') || 'None'}</div>
                      <div><strong>Personas:</strong> {caseStudy.advancedMetadata.personas?.join(', ') || 'None'}</div>
                      <div><strong>Confidence:</strong> {caseStudy.advancedMetadata.confidence_score || 'N/A'}</div>
                    </div>
                  </div>
                ) : caseStudy ? (
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                      Click to run advanced analysis
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Deep dive into algorithms and insights
                    </div>
                  </div>
                ) : (
                  'Generate case study first'
                )}
              </div>
            </div>

            {/* References Container */}
            <div 
              onClick={() => !batchMode && caseStudy && !caseStudy._referencesCollected && !collectingReferences ? collectReferences(selectedPartnership, caseStudy) : null}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: batchMode && batchStep === 3 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                cursor: !batchMode && caseStudy && !caseStudy._referencesCollected && !collectingReferences ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                opacity: !caseStudy ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!batchMode && caseStudy && !caseStudy._referencesCollected && !collectingReferences) {
                  e.target.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!batchMode && caseStudy && !caseStudy._referencesCollected && !collectingReferences) {
                  e.target.style.backgroundColor = darkMode ? '#1f2937' : 'white';
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = batchMode && batchStep === 3 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                  📚 References
                </h3>
                {caseStudy?._referencesCollected && !collectingReferences && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      collectReferences(selectedPartnership, caseStudy);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#d97706';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f59e0b';
                    }}
                  >
                    🔄 Re-collect
                  </button>
                )}
              </div>
              <div style={{ 
                color: darkMode ? '#9ca3af' : '#64748b',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: caseStudy?._referencesCollected ? (darkMode ? '#451a03' : '#fefce8') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: caseStudy?._referencesCollected ? `1px solid #fde047` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {collectingReferences ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Collecting references...
                  </div>
                ) : caseStudy?._referencesCollected ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: darkMode ? '#f3f4f6' : '#1f2937' }}>
                        References Collected
                      </div>
                      <div>Academic papers: {caseStudy.references?.length || 0}</div>
                      <div>Further reading: {caseStudy.furtherReading?.length || 0}</div>
                    </div>
                  </div>
                ) : caseStudy ? (
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                      Click to collect references
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Gather academic papers and resources
                    </div>
                  </div>
                ) : (
                  'Generate case study first'
                )}
              </div>
            </div>

            {/* Resources Container */}
            <div style={{ 
              backgroundColor: darkMode ? '#1f2937' : 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
              opacity: !caseStudy?._referencesCollected ? 0.6 : 1
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                📰 Resources
              </h3>
              <div style={{ 
                color: darkMode ? '#9ca3af' : '#64748b',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: caseStudy?.furtherReading?.length > 0 ? (darkMode ? '#064e3b' : '#f0fdf4') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: caseStudy?.furtherReading?.length > 0 ? `1px solid #bbf7d0` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {caseStudy?.furtherReading?.length > 0 ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: darkMode ? '#f3f4f6' : '#1f2937' }}>
                        Further Reading Available
                      </div>
                      <div>Business articles: {caseStudy.furtherReading.length}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                        Collected with references
                      </div>
                    </div>
                  </div>
                ) : caseStudy?._referencesCollected ? (
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    No additional resources found
                  </div>
                ) : caseStudy ? (
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    Collect references first to populate resources
                  </div>
                ) : (
                  'Generate case study and collect references first'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Researched Section */}
        {researchHistory.length > 0 && (
          <div style={{ 
            backgroundColor: darkMode ? '#374151' : 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
            marginTop: '30px'
          }}>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: darkMode ? '#f8fafc' : '#1e293b'
            }}>
              🕒 Recently Researched
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {researchHistory.slice(0, 10).map(entry => (
                <div 
                  key={entry.partnershipId}
                  onClick={() => {
                    const partnership = partnerships.find(p => p.id === entry.partnershipId);
                    if (partnership) {
                      setSelectedPartnership(partnership);
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = darkMode ? '#6b7280' : '#cbd5e1';
                    e.target.style.backgroundColor = darkMode ? '#4b5563' : '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = darkMode ? '#4b5563' : '#e2e8f0';
                    e.target.style.backgroundColor = darkMode ? '#374151' : 'white';
                  }}
                >
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: darkMode ? '#f8fafc' : '#1e293b',
                    marginBottom: '4px'
                  }}>
                    {entry.partnership?.company} + {entry.partnership?.partner}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: darkMode ? '#9ca3af' : '#64748b'
                  }}>
                    {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Status Toast */}
        {exportStatus && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1000,
            backgroundColor: exportStatus === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {exportStatus === 'success' ? '✅ Markdown exported successfully!' : '❌ Failed to export markdown'}
          </div>
        )}

        {/* GitHub Status Toast */}
        {githubStatus && (
          <div style={{
            position: 'fixed',
            top: exportStatus ? '80px' : '20px', // Stack below export toast if both are showing
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1000,
            backgroundColor: githubStatus === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {githubStatus === 'success' ? '🚀 Successfully pushed to GitHub!' : '❌ Failed to push to GitHub'}
          </div>
        )}

        {/* Backup/Restore Status Toasts */}
        {backupStatus && (
          <div style={{
            position: 'fixed',
            top: githubStatus ? '140px' : '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1000,
            backgroundColor: backupStatus === 'success' ? '#10b981' : 
                           backupStatus === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {backupStatus === 'backing-up' ? '⏳ Backing up session...' :
             backupStatus === 'success' ? '💾 Session backed up to GitHub!' :
             '❌ Failed to backup session'}
          </div>
        )}

        {restoreStatus && (
          <div style={{
            position: 'fixed',
            top: (githubStatus || backupStatus) ? '200px' : '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1000,
            backgroundColor: restoreStatus === 'success' ? '#10b981' : 
                           restoreStatus === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {restoreStatus === 'restoring' ? '⏳ Restoring session...' :
             restoreStatus === 'success' ? '📥 Session restored from GitHub!' :
             '❌ Failed to restore session'}
          </div>
        )}

        {/* Restore Dialog */}
        {showRestoreDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: darkMode ? '#374151' : 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '600',
                  color: darkMode ? '#f3f4f6' : '#1f2937'
                }}>
                  Restore Session
                </h2>
                <button
                  onClick={() => setShowRestoreDialog(false)}
                  style={{
                    padding: '8px',
                    border: 'none',
                    background: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <p style={{
                margin: '0 0 20px 0',
                color: darkMode ? '#9ca3af' : '#6b7280',
                fontSize: '14px'
              }}>
                Select a backup to restore. This will replace your current session data.
              </p>

              {availableBackups.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: darkMode ? '#9ca3af' : '#6b7280'
                }}>
                  <p style={{ margin: 0 }}>No backups found.</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                    Create a backup first using the "Backup Session" button.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {availableBackups.map((backup, index) => (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '500',
                          color: darkMode ? '#f3f4f6' : '#1f2937',
                          marginBottom: '4px'
                        }}>
                          {new Date(backup.lastModified).toLocaleString()}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: darkMode ? '#9ca3af' : '#6b7280'
                        }}>
                          Size: {(backup.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        onClick={() => restoreSession(backup.filename)}
                        disabled={restoreStatus === 'restoring'}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          cursor: restoreStatus === 'restoring' ? 'not-allowed' : 'pointer',
                          opacity: restoreStatus === 'restoring' ? 0.5 : 1
                        }}
                      >
                        {restoreStatus === 'restoring' ? 'Restoring...' : 'Restore'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#92400e'
              }}>
                <strong>Warning:</strong> Restoring will replace all current case studies, research history, and preferences with the backup data.
              </div>
            </div>
          </div>
        )}

        {/* File Conflict Dialog */}
        {showFileConflictDialog && fileConflictData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: darkMode ? '#374151' : 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: darkMode ? '#f9fafb' : '#111827'
                }}>
                  ⚠️ File Already Exists
                </h3>
                <button
                  onClick={() => setShowFileConflictDialog(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                marginBottom: '24px',
                color: darkMode ? '#d1d5db' : '#374151',
                lineHeight: '1.6'
              }}>
                <p style={{ margin: '0 0 16px 0' }}>
                  A case study file for <strong>{fileConflictData.partnership.company}</strong> and{' '}
                  <strong>{fileConflictData.partnership.partner}</strong> already exists in your GitHub repository.
                </p>
                <p style={{ margin: 0 }}>
                  Would you like to overwrite the existing files with the current case study?
                </p>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
                borderRadius: '8px',
                marginBottom: '20px',
                border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
              }}>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#f3f4f6' : '#1f2937'
                }}>
                  Files to be updated:
                </p>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '14px',
                  color: darkMode ? '#d1d5db' : '#4b5563'
                }}>
                  <li>exports/{fileConflictData.filename}.md</li>
                  <li>exports/{fileConflictData.filename}.json</li>
                </ul>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowFileConflictDialog(false)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: darkMode ? '#d1d5db' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => overwriteGitHubFiles(fileConflictData.partnership, fileConflictData.caseStudy, fileConflictData.filename)}
                  disabled={githubPushing}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: githubPushing ? '#6b7280' : '#ef4444',
                    color: 'white',
                    cursor: githubPushing ? 'not-allowed' : 'pointer',
                    opacity: githubPushing ? 0.6 : 1
                  }}
                >
                  {githubPushing ? 'Overwriting...' : 'Overwrite Files'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default App;