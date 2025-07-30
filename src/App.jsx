import React, { useState, useEffect } from 'react';
import { useCaseStudyStore, useMetadataStore, useReferencesStore, useBatchStore, useGlobalBatchStore } from './stores';
import { btn } from './styles/buttonStyles';
import ExportPreviewModal from './components/ExportPreviewModal';
import { getAllPrompts, saveCustomPrompt, resetPromptToDefault } from './research/ResearchPromptSystem.js';

function App() {
  const [partnerships, setPartnerships] = useState([]);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  
  // Zustand stores
  const { 
    caseStudies,
    getCaseStudy, 
    generateCaseStudy, 
    regenerateCaseStudy,
    loading: caseStudyLoading, 
    error: caseStudyError,
    clearError: clearCaseStudyError
  } = useCaseStudyStore();

  const {
    getBasicMetadata,
    getAdvancedMetadata,
    setBasicMetadata,
    analyzeMetadata,
    analyzing: metadataAnalyzing,
    error: metadataError,
    clearError: clearMetadataError
  } = useMetadataStore();

  const {
    getReferences,
    getFurtherReading,
    getCollectionNotes,
    collectReferences: storeCollectReferences,
    isCollected,
    collecting: referencesCollecting,
    error: referencesError,
    clearError: clearReferencesError
  } = useReferencesStore();

  const {
    isRunning: batchMode,
    currentStep: batchStep,
    error: batchError,
    stepProgress,
    startBatch,
    setStepInProgress,
    setStepCompleted,
    setStepError,
    completeBatch,
    stopBatch,
    clearError: clearBatchError,
    getProgress,
    canProceedToNextStep,
    getAllStepsCompleted
  } = useBatchStore();

  const {
    isRunning: globalBatchRunning,
    isPaused: globalBatchPaused,
    currentPartnership: globalCurrentPartnership,
    currentPartnershipProgress: globalPartnershipProgress,
    processedCount,
    totalPartnerships,
    successCount,
    errorCount,
    initializeGlobalBatch,
    startGlobalBatch,
    pauseGlobalBatch,
    resumeGlobalBatch,
    stopGlobalBatch,
    setCurrentPartnership,
    updateCurrentPartnershipProgress,
    completeCurrentPartnership,
    recordError,
    getNextPartnership,
    hasMorePartnerships,
    getProgress: getGlobalProgress,
    getCurrentPartnershipProgress: getGlobalPartnershipProgress,
    getProcessingStats,
    getSessionReport,
    addLog
  } = useGlobalBatchStore();
  
  // Export preview modal state
  const [showExportPreview, setShowExportPreview] = useState(false);
  
  // Derived state
  const caseStudy = selectedPartnership ? getCaseStudy(selectedPartnership.id) : null;
  const basicMetadata = selectedPartnership ? getBasicMetadata(selectedPartnership.id) : null;
  const advancedMetadata = selectedPartnership ? getAdvancedMetadata(selectedPartnership.id) : null;
  const references = selectedPartnership ? getReferences(selectedPartnership.id) : [];
  const furtherReading = selectedPartnership ? getFurtherReading(selectedPartnership.id) : [];
  const referencesCollected = selectedPartnership ? isCollected(selectedPartnership.id) : false;
  
  const [error, setError] = useState(null);
  const [researchHistory, setResearchHistory] = useState([]);
  const [exportStatus, setExportStatus] = useState(null); // 'success', 'error', or null
  // Removed: const [analyzing, setAnalyzing] = useState(false); - now using metadataAnalyzing from store
  const [referenceLists, setReferenceLists] = useState({
    algorithms: [],
    industries: [],
    personas: []
  });
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514');
  const [githubPushing, setGithubPushing] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null); // 'success', 'error', or null
  // Removed: const [collectingReferences, setCollectingReferences] = useState(false); - now using referencesCollecting from store
  const [backupStatus, setBackupStatus] = useState(null); // 'backing-up', 'success', 'error', or null
  const [restoreStatus, setRestoreStatus] = useState(null); // 'restoring', 'success', 'error', or null
  const [availableBackups, setAvailableBackups] = useState([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showFileConflictDialog, setShowFileConflictDialog] = useState(false);
  const [fileConflictData, setFileConflictData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBatchCompleteModal, setShowBatchCompleteModal] = useState(false);
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editText, setEditText] = useState('');
  const [promptsData, setPromptsData] = useState({});
  const [batchResults, setBatchResults] = useState(null);
  
  // Settings state - each mode has its own AI model selection
  const [settings, setSettings] = useState({
    rateLimitMode: 'uncapped', // 'uncapped', 'conservative', 'custom'
    modes: {
      uncapped: {
        aiModel: 'claude-sonnet-4-20250514',
        delay: 2
      },
      conservative: {
        aiModel: 'claude-sonnet-4-20250514', 
        delay: 45
      },
      custom: {
        aiModel: 'claude-sonnet-4-20250514',
        delay: 15
      }
    }
  });
  
  // Removed: batch state variables - now using useBatchStore

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
    // Apply dark class to html element for Tailwind
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
      let source = '';
      const isImport = !!csvText; // true if importing new file, false if refreshing
      
      if (!text) {
        const response = await fetch('/data/quantum-partnerships.csv');
        text = await response.text();
        source = 'default CSV file';
      } else {
        source = 'imported CSV file';
      }
      
      const parsed = parseCSV(text);
      const previousCount = partnerships.length;
      
      setPartnerships(parsed);
      
      // Clear selected partnership if it no longer exists
      if (selectedPartnership && !parsed.find(p => p.id === selectedPartnership.id)) {
        setSelectedPartnership(null);
      }
      
      // Handle cache logic based on operation type
      if (isImport) {
        // For CSV imports: Clear all cached data (new dataset)
        console.log('🗑️ Clearing cached data for new dataset...');
        clearAllCachedData();
        console.log(`✅ Successfully imported ${parsed.length} partnerships (cache cleared)`);
        setError(null); // Clear any existing errors
      } else {
        // For refresh: Keep existing cache (same dataset, possibly updated)
        const change = parsed.length - previousCount;
        if (change !== 0) {
          console.log(`🔄 Refreshed: ${change > 0 ? '+' : ''}${change} partnerships (cache preserved)`);
        } else {
          console.log(`🔄 Refreshed ${parsed.length} partnerships (no changes)`);
        }
      }
      
      console.log(`Loaded ${parsed.length} partnerships from ${source}`);
      
    } catch (error) {
      console.error('Failed to load partnerships:', error);
      setError(`Failed to load partnerships: ${error.message}. Please check the CSV file format.`);
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

  const clearAllCachedData = () => {
    try {
      // Clear localStorage cache entries
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('case-study-')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed cached case study: ${key}`);
      });
      
      // Clear Zustand stores using proper state updates
      console.log('🗑️ Clearing Zustand stores...');
      
      // Clear case study store
      useCaseStudyStore.setState({ caseStudies: {} });
      
      // Clear metadata store  
      useMetadataStore.setState({ 
        basicMetadata: {}, 
        advancedMetadata: {} 
      });
      
      // Clear references store - reset to initial state
      useReferencesStore.setState({
        references: {},
        furtherReading: {},
        collectionNotes: {},
        collecting: false,
        error: null
      });
      
      // Remove all dynamic collection flags from the store
      const referencesState = useReferencesStore.getState();
      const keysToDelete = Object.keys(referencesState).filter(key => 
        key.includes('_collected') || key.includes('_collectedAt')
      );
      
      if (keysToDelete.length > 0) {
        const updateObj = {};
        keysToDelete.forEach(key => {
          updateObj[key] = undefined; // Setting to undefined removes the key
        });
        useReferencesStore.setState(updateObj);
        console.log(`🗑️ Removed ${keysToDelete.length} collection flags`);
      }
      
      console.log('✅ All cached data cleared successfully');
      
    } catch (error) {
      console.error('Failed to clear cached data:', error);
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
- **Quantum Companies**: ${caseStudy.metadata.quantum_companies && caseStudy.metadata.quantum_companies.join(', ') || 'None specified'}
- **Partner Companies**: ${caseStudy.metadata.partner_companies && caseStudy.metadata.partner_companies.join(', ') || 'None specified'}
- **Quantum Hardware**: ${caseStudy.metadata.quantum_hardware && caseStudy.metadata.quantum_hardware.join(', ') || 'None specified'}
- **Quantum Software**: ${caseStudy.metadata.quantum_software && caseStudy.metadata.quantum_software.join(', ') || 'None specified'}
- **Confidence Score**: ${caseStudy.metadata.confidence_score || 'Not provided'}

` : ''}${caseStudy.advancedMetadata ? `## Advanced Metadata
- **Algorithms**: ${caseStudy.advancedMetadata.algorithms && caseStudy.advancedMetadata.algorithms.join(', ') || 'None specified'}
- **Industries**: ${caseStudy.advancedMetadata.industries && caseStudy.advancedMetadata.industries.join(', ') || 'None specified'}
- **Target Personas**: ${caseStudy.advancedMetadata.personas && caseStudy.advancedMetadata.personas.join(', ') || 'None specified'}
- **Quantum Companies**: ${caseStudy.advancedMetadata.quantum_companies && caseStudy.advancedMetadata.quantum_companies.join(', ') || 'None specified'}
- **Partner Companies**: ${caseStudy.advancedMetadata.partner_companies && caseStudy.advancedMetadata.partner_companies.join(', ') || 'None specified'}
- **Quantum Hardware**: ${caseStudy.advancedMetadata.quantum_hardware && caseStudy.advancedMetadata.quantum_hardware.join(', ') || 'None specified'}
- **Quantum Software**: ${caseStudy.advancedMetadata.quantum_software && caseStudy.advancedMetadata.quantum_software.join(', ') || 'None specified'}${caseStudy.advancedMetadata.hardware_details && Object.keys(caseStudy.advancedMetadata.hardware_details).length > 0 ? `
- **Hardware Details**: ${Object.entries(caseStudy.advancedMetadata.hardware_details).map(([key, value]) => `${key}: ${value}`).join(', ')}` : ''}
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

  // Wrapper function for references collection using the store
  const handleCollectReferences = async (partnership, caseStudy) => {
    if (!caseStudy) return;
    
    try {
      clearReferencesError(); // Clear any previous errors
      
      // Use the references store to perform collection
      const result = await storeCollectReferences(partnership, caseStudy);
      
      console.log('✅ References collection completed successfully')
      return result
      
    } catch (error) {
      console.error('❌ Error collecting references:', error);
      setError(`Failed to collect references: ${error.message}`);
      throw error
    }
  };

  // Keep old function name for backward compatibility during migration
  const collectReferences = handleCollectReferences;

  // Wrapper function for metadata analysis using the store
  const handleAnalyzeCaseStudy = async (partnership, caseStudy) => {
    if (!caseStudy) return;
    
    try {
      clearMetadataError(); // Clear any previous errors
      
      // Use the metadata store to perform analysis
      const result = await analyzeMetadata(partnership, caseStudy, referenceLists, selectedModel);
      
      console.log('✅ Metadata analysis completed successfully')
      return result
      
    } catch (error) {
      console.error('❌ Error analyzing case study metadata:', error);
      setError(`Failed to analyze case study: ${error.message}`);
      throw error
    }
  };

  // Keep old function name for backward compatibility during migration
  const analyzeCaseStudy = handleAnalyzeCaseStudy;

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

    startBatch(selectedPartnership, selectedModel);
    
    try {
      console.log('🚀 Starting batch process for:', selectedPartnership);
      
      // Step 1: Generate Case Study
      setStepInProgress(1);
      await handleGenerateCaseStudy(selectedPartnership, true); // Force regenerate for fresh start
      
      // Wait for case study completion
      let attempts = 0;
      while (!getCaseStudy(selectedPartnership.id) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      const currentCaseStudy = getCaseStudy(selectedPartnership.id);
      if (!currentCaseStudy) {
        throw new Error('Case study generation failed - timeout waiting for completion');
      }
      
      setStepCompleted(1);
      console.log('✅ Step 1 complete: Case study generated');
      
      // Step 2: Advanced Analysis
      setStepInProgress(2);
      await handleAnalyzeCaseStudy(selectedPartnership, currentCaseStudy);
      
      // Wait for analysis completion using the metadata store
      attempts = 0;
      while (!getAdvancedMetadata(selectedPartnership.id) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      const analysisResult = getAdvancedMetadata(selectedPartnership.id);
      if (!analysisResult) {
        throw new Error('Advanced analysis failed - timeout waiting for completion');
      }
      
      setStepCompleted(2);
      console.log('✅ Step 2 complete: Advanced analysis done');
      
      // Step 3: Collect References
      setStepInProgress(3);
      await handleCollectReferences(selectedPartnership, currentCaseStudy);
      
      // Wait for references completion using the references store
      attempts = 0;
      while (!isCollected(selectedPartnership.id) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!isCollected(selectedPartnership.id)) {
        throw new Error('References collection failed - timeout waiting for completion');
      }
      
      setStepCompleted(3);
      console.log('✅ Step 3 complete: References collected');
      
      // Complete the batch process
      completeBatch();
      console.log('🎉 Batch process completed successfully!');
      
    } catch (error) {
      console.error('❌ Batch process failed at step', batchStep, ':', error);
      setStepError(batchStep, error);
      setError(`Batch processing failed at step ${batchStep}: ${error.message}`);
    }
  };

  const stopBatchProcess = () => {
    stopBatch();
    clearCaseStudyError();
    clearMetadataError();
    clearReferencesError();
    console.log('🛑 Batch process stopped by user');
  };

  // Global Batch Processing Functions
  const runGlobalBatchProcess = async () => {
    console.log('🌍 Process All button clicked!');
    console.log('Partnerships:', partnerships?.length || 0);
    console.log('Selected model:', getCurrentAIModel());
    console.log('Settings:', settings);
    
    if (!partnerships || partnerships.length === 0) {
      console.error('❌ No partnerships available');
      setError('No partnerships available for global batch processing');
      return;
    }

    try {
      console.log('🚀 Starting global batch process...');
      
      // Initialize the global batch process
      console.log('📋 Initializing global batch...');
      initializeGlobalBatch(partnerships, getCurrentAIModel());
      
      console.log('▶️ Starting global batch...');
      startGlobalBatch();

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔄 Processing first partnership...');
      // Start processing partnerships one by one
      await processNextPartnership();

    } catch (error) {
      console.error('❌ Global batch process failed to start:', error);
      setError(`Failed to start global batch processing: ${error.message}`);
      stopGlobalBatch();
    }
  };

  const processNextPartnership = async () => {
    console.log('🔄 processNextPartnership called');
    
    // Check both hook state and direct store state
    const storeState = useGlobalBatchStore.getState();
    console.log('Hook globalBatchRunning:', globalBatchRunning);
    console.log('Store isRunning:', storeState.isRunning);
    console.log('globalBatchPaused:', globalBatchPaused);
    console.log('Store isPaused:', storeState.isPaused);
    
    // Use store state directly to avoid hook synchronization issues
    if (!storeState.isRunning || storeState.isPaused) {
      console.log('🛑 Global batch processing stopped or paused');
      return;
    }

    // Get the next partnership to process
    console.log('📋 Getting next partnership...');
    const nextPartnership = getNextPartnership();
    console.log('Next partnership:', nextPartnership);
    
    if (!nextPartnership) {
      // No more partnerships to process - show completion modal
      handleGlobalBatchComplete();
      return;
    }

    try {
      // Set current partnership in global store
      setCurrentPartnership(nextPartnership);
      
      // Auto-select this partnership in the UI
      setSelectedPartnership(nextPartnership);
      
      // Small delay to let UI update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Process this partnership using existing batch logic
      await processSinglePartnershipInGlobalBatch(nextPartnership);
      
      // Mark partnership as completed
      completeCurrentPartnership({
        caseStudy: getCaseStudy(nextPartnership.id),
        metadata: getAdvancedMetadata(nextPartnership.id),
        references: getReferences(nextPartnership.id)
      }, 'success');

      // Delay before next partnership
      if (hasMorePartnerships()) {
        addLog('info', `Waiting ${useGlobalBatchStore.getState().delayBetweenPartnerships}ms before next partnership`);
        await new Promise(resolve => setTimeout(resolve, useGlobalBatchStore.getState().delayBetweenPartnerships));
        
        // Process next partnership recursively
        await processNextPartnership();
      } else {
        // All done - show completion modal
        handleGlobalBatchComplete();
      }

    } catch (error) {
      console.error('❌ Error processing partnership:', nextPartnership.company, '+', nextPartnership.partner, error);
      
      // Record the error
      recordError(nextPartnership, error);
      
      // Mark partnership as failed
      completeCurrentPartnership({
        error: error.message
      }, 'error');

      // Continue with next partnership (resilient processing)
      if (hasMorePartnerships()) {
        addLog('warn', `Skipping failed partnership, continuing with next...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Short delay after error
        await processNextPartnership();
      } else {
        handleGlobalBatchComplete();
      }
    }
  };

  const processSinglePartnershipInGlobalBatch = async (partnership) => {
    addLog('info', `Starting 3-step processing for ${partnership.company} + ${partnership.partner}`);

    try {
      // Step 1: Generate Case Study
      updateCurrentPartnershipProgress(1, 'in_progress');
      addLog('info', 'Step 1: Generating case study...');
      
      await handleGenerateCaseStudy(partnership, true); // Force regenerate
      
      // Wait for completion
      let attempts = 0;
      while (!getCaseStudy(partnership.id) && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (!getCaseStudy(partnership.id)) {
        throw new Error('Case study generation timeout');
      }
      
      updateCurrentPartnershipProgress(1, 'completed');
      addLog('info', 'Step 1: Case study completed');

      // Step 2: Advanced Analysis  
      updateCurrentPartnershipProgress(2, 'in_progress');
      addLog('info', 'Step 2: Running advanced analysis...');
      
      const caseStudy = getCaseStudy(partnership.id);
      await handleAnalyzeCaseStudy(partnership, caseStudy);
      
      // Wait for analysis completion
      attempts = 0;
      while (!getAdvancedMetadata(partnership.id) && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (!getAdvancedMetadata(partnership.id)) {
        throw new Error('Advanced analysis timeout');
      }
      
      updateCurrentPartnershipProgress(2, 'completed');
      addLog('info', 'Step 2: Advanced analysis completed');

      // Step 3: Collect References
      updateCurrentPartnershipProgress(3, 'in_progress');
      addLog('info', 'Step 3: Collecting references...');
      
      await handleCollectReferences(partnership, caseStudy);
      
      // Wait for references completion
      attempts = 0;
      while (!isCollected(partnership.id) && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (!isCollected(partnership.id)) {
        throw new Error('References collection timeout');
      }
      
      updateCurrentPartnershipProgress(3, 'completed');
      addLog('info', 'Step 3: References collection completed');
      
      addLog('info', `✅ Partnership processing completed successfully`);

    } catch (error) {
      // Record which step failed
      const currentProgress = getCurrentPartnershipProgress();
      const failedStep = currentProgress.current + 1;
      
      updateCurrentPartnershipProgress(failedStep, 'error', error);
      addLog('error', `Partnership processing failed at step ${failedStep}: ${error.message}`);
      
      throw error; // Re-throw to be handled by processNextPartnership
    }
  };

  const stopGlobalBatchProcess = () => {
    stopGlobalBatch();
    
    // Also stop any running individual batch process
    if (batchMode) {
      stopBatchProcess();
    }
    
    console.log('🛑 Global batch processing stopped by user');
  };

  const pauseGlobalBatchProcess = () => {
    pauseGlobalBatch();
    console.log('⏸️ Global batch processing paused by user');
  };

  const resumeGlobalBatchProcess = async () => {
    resumeGlobalBatch();
    console.log('▶️ Resuming global batch processing');
    
    // Continue processing from where we left off
    await processNextPartnership();
  };

  // Global batch completion handler
  const handleGlobalBatchComplete = () => {
    console.log('🎉 Global batch processing completed!');
    
    // Get completion statistics
    const stats = getProcessingStats();
    const processedPartnerships = [];
    
    // Collect all successfully processed partnerships with their data
    partnerships.forEach(partnership => {
      const caseStudy = getCaseStudy(partnership.id);
      const metadata = getAdvancedMetadata(partnership.id);
      const references = getReferences(partnership.id);
      const furtherReading = getFurtherReading(partnership.id);
      
      if (caseStudy) {
        processedPartnerships.push({
          partnership,
          caseStudy,
          metadata,
          references,
          furtherReading,
          hasMetadata: !!metadata,
          hasReferences: references.length > 0 || furtherReading.length > 0
        });
      }
    });
    
    // Set results for the completion modal
    setBatchResults({
      stats,
      processedPartnerships,
      sessionReport: getSessionReport(),
      timestamp: new Date().toISOString()
    });
    
    // Complete the batch in the store
    completeGlobalBatch();
    
    // Show completion modal
    setShowBatchCompleteModal(true);
  };

  // Batch export functions
  const exportAllToZip = async () => {
    if (!batchResults) return;
    
    try {
      console.log('📦 Creating ZIP export for', batchResults.processedPartnerships.length, 'partnerships');
      
      // Create zip file content
      const zipContent = [];
      
      // Add individual case studies
      batchResults.processedPartnerships.forEach(({ partnership, caseStudy, metadata, references, furtherReading }, index) => {
        const filename = `${partnership.company}-${partnership.partner}-${partnership.year || 'unknown'}.md`.replace(/[^a-zA-Z0-9-_.]/g, '-');
        
        // Generate markdown content
        const markdownContent = generateMarkdownContent(partnership, caseStudy, metadata, references, furtherReading);
        zipContent.push({ filename, content: markdownContent });
        
        // Also add JSON version
        const jsonFilename = filename.replace('.md', '.json');
        const jsonContent = JSON.stringify({
          partnership,
          caseStudy,
          metadata,
          references,
          furtherReading,
          exportedAt: new Date().toISOString()
        }, null, 2);
        zipContent.push({ filename: jsonFilename, content: jsonContent });
      });
      
      // Add processing report
      const reportContent = generateProcessingReport(batchResults);
      zipContent.push({ filename: 'processing-report.md', content: reportContent });
      
      // Add session data
      const sessionData = JSON.stringify(batchResults.sessionReport, null, 2);
      zipContent.push({ filename: 'session-data.json', content: sessionData });
      
      // Create and download ZIP (using JSZip library would be ideal, but for now we'll create a simple download)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const zipFilename = `qookie-export-${timestamp}.zip`;
      
      // For now, create individual file downloads (would need JSZip for actual ZIP)
      // This is a simplified version - in production you'd want JSZip
      console.log('📁 Generated', zipContent.length, 'files for export');
      
      // Download as individual files for now (TODO: implement proper ZIP)
      zipContent.forEach(({ filename, content }) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      
      console.log('✅ Export completed successfully');
      
    } catch (error) {
      console.error('❌ Error exporting to ZIP:', error);
      setError(`Failed to export: ${error.message}`);
    }
  };

  const pushAllToGitHub = async () => {
    if (!batchResults) return;
    
    try {
      console.log('🔗 Pushing', batchResults.processedPartnerships.length, 'case studies to GitHub');
      
      for (const { partnership, caseStudy, metadata, references, furtherReading } of batchResults.processedPartnerships) {
        await pushToGitHub(partnership, {
          ...caseStudy,
          metadata,
          references,
          furtherReading
        });
        
        // Small delay between pushes to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('✅ All case studies pushed to GitHub successfully');
      
    } catch (error) {
      console.error('❌ Error pushing to GitHub:', error);
      setError(`Failed to push to GitHub: ${error.message}`);
    }
  };

  // Export all case studies in OpenQase-compatible format with enhanced validation
  const exportAllToOpenQase = async () => {
    if (!batchResults) return;
    
    try {
      console.log('🔄 Creating OpenQase export for', batchResults.processedPartnerships.length, 'partnerships');
      
      // Import validation and error handling utilities
      const { validationEngine } = await import('./utils/ValidationEngine.js');
      const { exportErrorHandler } = await import('./utils/ExportErrorHandler.js');
      const { qualityScorer } = await import('./utils/QualityScorer.js');
      
      // Step 1: Run comprehensive validation
      console.log('📊 Running export validation...');
      const validation = validationEngine.validateCaseStudiesForExport(batchResults.processedPartnerships);
      const qualityAnalysis = qualityScorer.calculateBatchQuality(batchResults.processedPartnerships);
      
      console.log('✅ Validation completed:', {
        canExport: validation.summary.canExport,
        overallQuality: Math.round(validation.summary.overallQuality),
        criticalErrors: validation.criticalErrors.length,
        warnings: validation.warnings.length
      });
      
      // Step 2: Handle critical errors (block export)
      if (!validation.summary.canExport) {
        const errorSummary = validation.criticalErrors.slice(0, 3).map(e => `• ${e.partnership}: ${e.message}`).join('\n');
        const additionalErrors = validation.criticalErrors.length > 3 ? `\n• ... and ${validation.criticalErrors.length - 3} more critical errors` : '';
        
        const errorMessage = `❌ Export blocked due to critical errors:\n\n${errorSummary}${additionalErrors}\n\nPlease fix these issues before exporting to ensure successful import into OpenQase.`;
        
        setError(errorMessage);
        console.error('🚫 Export blocked:', validation.criticalErrors);
        return;
      }
      
      // Step 3: Show quality warnings (but allow export)
      if (validation.warnings.length > 0) {
        const warningCount = validation.warnings.length;
        const qualityScore = Math.round(validation.summary.overallQuality);
        
        console.warn(`⚠️ Export proceeding with ${warningCount} quality warnings (Quality Score: ${qualityScore}%)`);
        
        // Log top warnings for user awareness
        const topWarnings = validation.warnings.slice(0, 3).map(w => `• ${w.partnership}: ${w.message}`).join('\n');
        const additionalWarnings = warningCount > 3 ? `\n• ... and ${warningCount - 3} more warnings` : '';
        
        console.log(`📋 Quality Warnings:\n${topWarnings}${additionalWarnings}`);
      } else {
        console.log('✅ All case studies passed quality validation');
      }
      
      // Step 4: Use enhanced error handling for safe processing
      console.log('🔄 Processing case studies with error handling...');
      const processingResults = exportErrorHandler.safelyProcessCaseStudies(
        batchResults.processedPartnerships,
        (current, total) => {
          if (current % 5 === 0) console.log(`📈 Processing ${current + 1}/${total} case studies...`);
        }
      );
      
      // Log processing results
      console.log('📊 Processing completed:', {
        successful: processingResults.successful.length,
        failed: processingResults.failed.length,
        warnings: processingResults.warnings.length
      });
      
      // Handle processing failures
      if (processingResults.failed.length > 0) {
        const failureMessage = `⚠️ ${processingResults.failed.length} case studies failed processing and will be excluded from export:\n\n` +
          processingResults.failed.slice(0, 3).map(f => `• ${f.partnership}: ${f.error}`).join('\n') +
          (processingResults.failed.length > 3 ? `\n• ... and ${processingResults.failed.length - 3} more failures` : '');
        
        console.warn('Processing failures:', failureMessage);
      }
      
      // Stop if no successful case studies
      if (processingResults.successful.length === 0) {
        setError('❌ No case studies could be successfully processed for export. Please check the data quality and try again.');
        return;
      }
      
      // Use successfully processed case studies (already in OpenQase format from error handler)
      const transformedCaseStudies = processingResults.successful;
      
      // Create OpenQase export structure
      const openQaseExport = {
        export_metadata: {
          export_version: "1.0",
          export_date: new Date().toISOString(),
          total_items: transformedCaseStudies.length,
          export_type: "batch",
          source: "qookie"
        },
        case_studies: transformedCaseStudies
      };
      
      // Download the OpenQase export file
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `qookie-openqase-export-${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(openQaseExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Generate comprehensive export summary
      const exportSummary = {
        successful: transformedCaseStudies.length,
        failed: processingResults.failed.length,
        warnings: processingResults.warnings.length,
        overallQuality: Math.round(validation.summary.overallQuality),
        filename: filename,
        fileSize: `${(JSON.stringify(openQaseExport).length / 1024).toFixed(1)}KB`
      };
      
      console.log('✅ OpenQase export completed successfully');
      console.log('📊 Export Summary:', exportSummary);
      
      // Show user-friendly completion message
      const qualityBadge = exportSummary.overallQuality >= 85 ? '🟢 Excellent' :
                          exportSummary.overallQuality >= 70 ? '🔵 Good' :
                          exportSummary.overallQuality >= 50 ? '🟡 Fair' : '🟠 Needs Work';
      
      const successMessage = `✅ Export completed successfully!\n\n` +
        `📁 File: ${filename}\n` +
        `📊 Case Studies: ${exportSummary.successful} exported${exportSummary.failed > 0 ? `, ${exportSummary.failed} failed` : ''}\n` +
        `🎯 Quality Score: ${exportSummary.overallQuality}% (${qualityBadge})\n` +
        `📦 File Size: ${exportSummary.fileSize}\n\n` +
        `Ready for import into OpenQase!`;
      
      // Could show this in a toast notification or modal in a real UI
      console.log(successMessage);
      
    } catch (error) {
      console.error('❌ Error exporting to OpenQase format:', error);
      setError(`Failed to export to OpenQase format: ${error.message}`);
    }
  };

  const generateMarkdownContent = (partnership, caseStudy, metadata, references, furtherReading) => {
    // Generate comprehensive markdown content
    let content = `# ${partnership.company} + ${partnership.partner} Case Study\n\n`;
    
    content += `**Year:** ${partnership.year || 'Unknown'}\n`;
    content += `**Notes:** ${partnership.notes || 'No additional notes'}\n\n`;
    
    if (caseStudy.title) content += `## ${caseStudy.title}\n\n`;
    if (caseStudy.summary) content += `### Executive Summary\n${caseStudy.summary}\n\n`;
    if (caseStudy.introduction) content += `### Introduction\n${caseStudy.introduction}\n\n`;
    if (caseStudy.challenge) content += `### Challenge\n${caseStudy.challenge}\n\n`;
    if (caseStudy.solution) content += `### Solution\n${caseStudy.solution}\n\n`;
    if (caseStudy.implementation) content += `### Implementation\n${caseStudy.implementation}\n\n`;
    if (caseStudy.results_and_business_impact) content += `### Results & Business Impact\n${caseStudy.results_and_business_impact}\n\n`;
    if (caseStudy.future_directions) content += `### Future Directions\n${caseStudy.future_directions}\n\n`;
    
    // Add metadata if available
    if (metadata) {
      content += `## Analysis Metadata\n\n`;
      if (metadata.algorithms?.length > 0) content += `**Algorithms:** ${metadata.algorithms.join(', ')}\n`;
      if (metadata.industries?.length > 0) content += `**Industries:** ${metadata.industries.join(', ')}\n`;
      if (metadata.personas?.length > 0) content += `**Target Personas:** ${metadata.personas.join(', ')}\n`;
      if (metadata.confidence_score) content += `**Confidence Score:** ${metadata.confidence_score}\n`;
      if (metadata.analysis_notes) content += `**Analysis Notes:** ${metadata.analysis_notes}\n`;
      content += '\n';
    }
    
    // Add references if available
    if (references?.length > 0) {
      content += `## Academic References\n\n`;
      references.forEach((ref, index) => {
        content += `${index + 1}. **${ref.title}**\n`;
        if (ref.authors) content += `   *Authors:* ${ref.authors}\n`;
        if (ref.journal) content += `   *Journal:* ${ref.journal}\n`;
        if (ref.year) content += `   *Year:* ${ref.year}\n`;
        if (ref.url) content += `   *URL:* ${ref.url}\n`;
        content += '\n';
      });
    }
    
    // Add further reading if available
    if (furtherReading?.length > 0) {
      content += `## Further Reading\n\n`;
      furtherReading.forEach((item, index) => {
        content += `${index + 1}. **${item.title}**\n`;
        if (item.source) content += `   *Source:* ${item.source}\n`;
        if (item.type) content += `   *Type:* ${item.type}\n`;
        if (item.date) content += `   *Date:* ${item.date}\n`;
        if (item.url) content += `   *URL:* ${item.url}\n`;
        if (item.description) content += `   *Description:* ${item.description}\n`;
        content += '\n';
      });
    }
    
    content += `\n---\n*Generated by Qookie on ${new Date().toLocaleDateString()}*\n`;
    
    return content;
  };

  const generateProcessingReport = (results) => {
    const { stats, processedPartnerships } = results;
    
    let report = `# Qookie Batch Processing Report\n\n`;
    
    report += `**Processing Date:** ${new Date(results.timestamp).toLocaleDateString()}\n`;
    report += `**Total Partnerships:** ${stats.total}\n`;
    report += `**Successfully Processed:** ${stats.success}\n`;
    report += `**Errors:** ${stats.errors}\n`;
    report += `**Processing Duration:** ${stats.duration ? Math.round(stats.duration / 60) : 'Unknown'} minutes\n\n`;
    
    report += `## Processing Summary\n\n`;
    processedPartnerships.forEach(({ partnership, hasMetadata, hasReferences }) => {
      report += `- **${partnership.company} + ${partnership.partner}** `;
      report += `(${partnership.year || 'Unknown year'}) `;
      report += hasMetadata ? '✅ Metadata ' : '❌ Metadata ';
      report += hasReferences ? '✅ References' : '❌ References';
      report += '\n';
    });
    
    if (stats.errors > 0) {
      report += `\n## Errors Encountered\n\n`;
      // Add error details from session report
      // This would need to be populated from the actual error data
    }
    
    report += `\n---\n*Generated by Qookie Batch Processing System*\n`;
    
    return report;
  };

  // Settings calculation functions
  const getCurrentDelay = () => {
    return settings.modes[settings.rateLimitMode]?.delay || 2;
  };

  const getCurrentAIModel = () => {
    return settings.modes[settings.rateLimitMode]?.aiModel || 'claude-sonnet-4-20250514';
  };

  const calculateEstimatedCost = (mode = settings.rateLimitMode) => {
    const partnershipCount = partnerships?.length || 0;
    if (partnershipCount === 0) return '0.00';

    // Rough cost estimates per partnership (3 API calls each)
    const costPerPartnership = {
      'claude-opus-4-20250514': 0.60,     // Most Capable
      'claude-sonnet-4-20250514': 0.45,   // Latest & Recommended
      'claude-3-5-sonnet-20241022': 0.25, // Standard Claude
      'claude-3-5-haiku-20241022': 0.15,  // Fast & Smart
      'claude-3-opus-20240229': 0.50,     // Claude 3 Opus
      'claude-3-sonnet-20240229': 0.20,   // Claude 3 Sonnet
      'claude-3-haiku-20240307': 0.10,    // Fastest
      'gemini-2.5-pro': 0.125,            // Google Gemini 2.5 Pro
      'gemini-2.5-flash': 0.075,          // Google Gemini 2.5 Flash  
      'gemini-2.0-flash': 0.10,           // Google Gemini 2.0 Flash
      'gemini-1.5-pro': 0.125,            // Google Gemini 1.5 Pro
      'gemini-1.5-flash': 0.075           // Google Gemini 1.5 Flash
    };

    const selectedModel = settings.modes[mode]?.aiModel || 'claude-sonnet-4-20250514';
    const baseCost = (costPerPartnership[selectedModel] || 0.25) * partnershipCount;
    
    // Conservative mode might use more tokens due to retries/slower processing
    const modeMultiplier = {
      'uncapped': 1.0,
      'conservative': 1.1,  // 10% more due to potential retries
      'custom': 1.05        // 5% more due to variable delays
    };

    const finalCost = baseCost * (modeMultiplier[mode] || 1.0);
    return finalCost.toFixed(2);
  };

  const calculateTotalTime = () => {
    const partnershipCount = partnerships?.length || 0;
    if (partnershipCount === 0) return '0 minutes';

    const delaySeconds = getCurrentDelay();
    const avgProcessingTimePerPartnership = 45; // seconds per partnership (3 steps)
    
    const totalSeconds = partnershipCount * (avgProcessingTimePerPartnership + delaySeconds);
    const minutes = Math.round(totalSeconds / 60);
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const pushToGitHub = async (partnership, caseStudy) => {
    if (!caseStudy) return;
    
    setGithubPushing(true);
    setGithubStatus(null);
    setError(null);

    try {
      const filename = `${partnership.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${partnership.partner.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${partnership.year}`;
      
      console.log('Pushing to GitHub:', filename);

      const response = await fetch('http://localhost:3556/api/github/push', {
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

      const response = await fetch('http://localhost:3556/api/github/overwrite', {
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

      const response = await fetch('http://localhost:3556/api/github/backup-session', {
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
      const response = await fetch('http://localhost:3556/api/github/list-backups');
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

      const response = await fetch('http://localhost:3556/api/github/restore-session', {
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

  // Prompt editing functions
  const handleEditPrompt = (promptKey) => {
    const prompts = getAllPrompts();
    setEditingPrompt(promptKey);
    setEditText(prompts[promptKey].template);
  };

  const handleSavePrompt = () => {
    if (editingPrompt) {
      saveCustomPrompt(editingPrompt, editText);
      setPromptsData(getAllPrompts());
      setEditingPrompt(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingPrompt(null);
    setEditText('');
  };

  const handleResetPrompt = (promptKey) => {
    resetPromptToDefault(promptKey);
    setPromptsData(getAllPrompts());
  };

  // Prompt configuration for dynamic rendering
  const promptConfig = [
    { key: 'researchPrompt', icon: '🔬', title: 'Research Case Study Prompt' },
    { key: 'validationPrompt', icon: '🔍', title: 'Validation Prompt' },
    { key: 'followUpPrompt', icon: '📚', title: 'Follow-up Research Prompt' },
    { key: 'serverApiPrompt', icon: '🔗', title: 'API Research Prompt' },
    { key: 'metadataPrompt', icon: '🏷️', title: 'Metadata Analysis Prompt' },
    { key: 'referencesPrompt', icon: '📚', title: 'References Collection Prompt' }
  ];

  // Load prompts data when modal opens
  useEffect(() => {
    if (showPromptsModal) {
      setPromptsData(getAllPrompts());
    }
  }, [showPromptsModal]);

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
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Title */}
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                🍪 <span className="text-quantum-600 dark:text-quantum-400">Qookie</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 ml-10">
                AI-powered quantum computing case studies
              </p>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-2">
              {/* Session Management Group */}
              <div className="flex items-center space-x-1 px-3 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <button
                  onClick={backupSession}
                  disabled={backupStatus === 'backing-up'}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    backupStatus === 'backing-up' 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : backupStatus === 'success'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : backupStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500'
                  }`}
                  title="Backup current session to GitHub"
                >
                  {backupStatus === 'backing-up' ? '⏳' :
                   backupStatus === 'success' ? '✅' :
                   backupStatus === 'error' ? '❌' : '💾'}
                </button>

                <button
                  onClick={() => {
                    setShowRestoreDialog(true);
                    loadAvailableBackups();
                  }}
                  disabled={restoreStatus === 'restoring'}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    restoreStatus === 'restoring' 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : restoreStatus === 'success'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : restoreStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500'
                  }`}
                  title="Restore session from GitHub backup"
                >
                  {restoreStatus === 'restoring' ? '⏳' :
                   restoreStatus === 'success' ? '✅' :
                   restoreStatus === 'error' ? '❌' : '📥'}
                </button>
              </div>

              {/* Data Management Group */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadPartnerships()}
                  disabled={globalBatchRunning}
                  className="btn-quantum btn-secondary px-4 py-2 text-sm"
                  title="Refresh partnerships from CSV"
                >
                  🔄 Refresh
                </button>

                <button
                  onClick={() => document.getElementById('csvFileInput').click()}
                  disabled={globalBatchRunning}
                  className="btn-quantum btn-success px-4 py-2 text-sm"
                  title="Import new CSV file"
                >
                  📄 Import
                </button>
              </div>

              {/* Tools Group */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPromptsModal(true)}
                  className="btn-quantum btn-purple px-4 py-2 text-sm"
                  title="View all AI prompts and commands"
                >
                  📝 Prompts
                </button>

                <button
                  onClick={() => setShowSettingsModal(true)}
                  disabled={globalBatchRunning}
                  className="btn-quantum btn-warning px-4 py-2 text-sm"
                  title="Configure batch processing settings"
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={toggleDarkMode}
                  className="btn-quantum btn-secondary w-10 h-10 p-0 text-lg"
                  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>

              {/* Main Action */}
              <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-600">
                {!globalBatchRunning ? (
                  <button
                    onClick={runGlobalBatchProcess}
                    disabled={!partnerships || partnerships.length === 0}
                    className="btn-quantum btn-danger px-6 py-2 text-sm font-semibold"
                    title="Process all partnerships with AI"
                  >
                    🌍 Process All
                  </button>
                ) : (
                  <div className="flex items-center space-x-1">
                    {!globalBatchPaused ? (
                      <button
                        onClick={pauseGlobalBatch}
                        className="btn-quantum btn-warning px-3 py-2 text-xs"
                      >
                        ⏸️
                      </button>
                    ) : (
                      <button
                        onClick={resumeGlobalBatch}
                        className="btn-quantum btn-success px-3 py-2 text-xs"
                      >
                        ▶️
                      </button>
                    )}
                    <button
                      onClick={stopGlobalBatch}
                      className="btn-quantum btn-danger px-3 py-2 text-xs"
                    >
                      🛑
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '0 0 20px 0'
            }}>
              <h2 style={{ 
                margin: '0', 
                fontSize: '20px', 
                fontWeight: '600',
                color: darkMode ? '#f8fafc' : '#1e293b'
              }}>
                Partnerships ({partnerships.length})
              </h2>
              
              {/* Hidden file input */}
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    importCSVFile(file);
                    // Reset the input so the same file can be selected again
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {/* Global Batch Progress Display */}
            {globalBatchRunning && (
              <div style={{
                backgroundColor: darkMode ? '#374151' : '#f8fafc',
                border: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: darkMode ? '#f3f4f6' : '#1f2937'
                  }}>
                    🌍 Global Processing: {processedCount} / {totalPartnerships}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    {globalBatchPaused ? '⏸️ Paused' : '🔄 Running'}
                  </div>
                </div>

                {/* Global Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: darkMode ? '#4b5563' : '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: `${getGlobalProgress().percentage}%`,
                    height: '100%',
                    backgroundColor: '#10b981',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>

                {/* Current Partnership Status */}
                {globalCurrentPartnership && (
                  <div style={{
                    backgroundColor: darkMode ? '#1f2937' : 'white',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: darkMode ? '#f3f4f6' : '#1f2937',
                      marginBottom: '8px'
                    }}>
                      Currently Processing: {globalCurrentPartnership.company} + {globalCurrentPartnership.partner}
                    </div>

                    {/* Current Partnership Steps */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: darkMode ? '#9ca3af' : '#6b7280'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: globalPartnershipProgress?.caseStudy === 'completed' ? '#10b981' : 
                                         globalPartnershipProgress?.caseStudy === 'in_progress' ? '#f59e0b' : '#6b7280'
                        }}></div>
                        Case Study
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: darkMode ? '#9ca3af' : '#6b7280'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: globalPartnershipProgress?.metadata === 'completed' ? '#10b981' : 
                                         globalPartnershipProgress?.metadata === 'in_progress' ? '#f59e0b' : '#6b7280'
                        }}></div>
                        Analysis
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: darkMode ? '#9ca3af' : '#6b7280'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: globalPartnershipProgress?.references === 'completed' ? '#10b981' : 
                                         globalPartnershipProgress?.references === 'in_progress' ? '#f59e0b' : '#6b7280'
                        }}></div>
                        References
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      marginTop: '8px',
                      fontSize: '11px',
                      color: darkMode ? '#9ca3af' : '#6b7280'
                    }}>
                      <span>✅ Success: {successCount}</span>
                      <span>❌ Errors: {errorCount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
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
                        Step {batchStep} of 3: {stepProgress[batchStep]?.name || 'Processing...'}
                        {stepProgress[batchStep]?.status === 'in_progress' ? '...' : ''}
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
                        width: `${getProgress().percentage}%`,
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
              onClick={() => selectedPartnership && !caseStudy && !caseStudyLoading ? handleGenerateCaseStudy(selectedPartnership) : null}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: batchMode && batchStep === 1 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                cursor: selectedPartnership && !caseStudy && !caseStudyLoading ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                opacity: !selectedPartnership ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (selectedPartnership && !caseStudy && !caseStudyLoading) {
                  e.target.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPartnership && !caseStudy && !caseStudyLoading) {
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToMarkdown(selectedPartnership, caseStudy);
                      }}
                      className="btn-quantum btn-secondary px-3 py-1.5 text-sm"
                      title="Export case study as Markdown file"
                    >
                      📄 Export
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        pushToGitHub(selectedPartnership, caseStudy);
                      }}
                      className="btn-quantum btn-success px-3 py-1.5 text-sm"
                      title="Push case study to GitHub repository"
                    >
                      🔗 GitHub
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateCaseStudy(selectedPartnership, true);
                      }}
                      className="btn-quantum btn-warning px-3 py-1.5 text-sm"
                    >
                      🔄 Regenerate
                    </button>
                  </div>
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
                backgroundColor: basicMetadata ? (darkMode ? '#1e3a8a' : '#f0f9ff') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: basicMetadata ? `1px solid #3b82f6` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {basicMetadata ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div><strong>Algorithms:</strong> {basicMetadata.algorithms?.join(', ') || 'None'}</div>
                      <div><strong>Industries:</strong> {basicMetadata.industries?.join(', ') || 'None'}</div>
                      <div><strong>Personas:</strong> {basicMetadata.personas?.join(', ') || 'None'}</div>
                      <div><strong>Quantum Companies:</strong> {basicMetadata.quantum_companies?.join(', ') || 'None'}</div>
                      <div><strong>Partner Companies:</strong> {basicMetadata.partner_companies?.join(', ') || 'None'}</div>
                      <div><strong>Hardware:</strong> {basicMetadata.quantum_hardware?.join(', ') || 'None'}</div>
                      <div><strong>Software:</strong> {basicMetadata.quantum_software?.join(', ') || 'None'}</div>
                      <div><strong>Confidence:</strong> {basicMetadata.confidence_score || 'N/A'}</div>
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
              onClick={() => !batchMode && caseStudy && !advancedMetadata && !metadataAnalyzing ? handleAnalyzeCaseStudy(selectedPartnership, caseStudy) : null}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: batchMode && batchStep === 2 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                cursor: !batchMode && caseStudy && !advancedMetadata && !metadataAnalyzing ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                opacity: !caseStudy ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!batchMode && caseStudy && !advancedMetadata && !metadataAnalyzing) {
                  e.target.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!batchMode && caseStudy && !advancedMetadata && !metadataAnalyzing) {
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
                {advancedMetadata && !metadataAnalyzing && (
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
                backgroundColor: advancedMetadata ? (darkMode ? '#065f46' : '#f0fdf4') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: advancedMetadata ? `1px solid #10b981` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {metadataAnalyzing ? (
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
                ) : advancedMetadata ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div><strong>Algorithms:</strong> {advancedMetadata.algorithms?.join(', ') || 'None'}</div>
                      <div><strong>Industries:</strong> {advancedMetadata.industries?.join(', ') || 'None'}</div>
                      <div><strong>Personas:</strong> {advancedMetadata.personas?.join(', ') || 'None'}</div>
                      <div><strong>Quantum Companies:</strong> {advancedMetadata.quantum_companies?.join(', ') || 'None'}</div>
                      <div><strong>Partner Companies:</strong> {advancedMetadata.partner_companies?.join(', ') || 'None'}</div>
                      <div><strong>Hardware:</strong> {advancedMetadata.quantum_hardware?.join(', ') || 'None'}</div>
                      <div><strong>Software:</strong> {advancedMetadata.quantum_software?.join(', ') || 'None'}</div>
                      {advancedMetadata.hardware_details && Object.keys(advancedMetadata.hardware_details).length > 0 && (
                        <div><strong>Hardware Details:</strong> {
                          Object.entries(advancedMetadata.hardware_details)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')
                        }</div>
                      )}
                      <div><strong>Confidence:</strong> {advancedMetadata.confidence_score || 'N/A'}</div>
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
              onClick={() => !batchMode && caseStudy && !referencesCollected && !referencesCollecting ? collectReferences(selectedPartnership, caseStudy) : null}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: batchMode && batchStep === 3 ? '0 0 0 2px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)',
                border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                cursor: !batchMode && caseStudy && !referencesCollected && !referencesCollecting ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                opacity: !caseStudy ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!batchMode && caseStudy && !referencesCollected && !referencesCollecting) {
                  e.target.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!batchMode && caseStudy && !referencesCollected && !referencesCollecting) {
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
                {referencesCollected && !referencesCollecting && (
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
                backgroundColor: referencesCollected ? (darkMode ? '#451a03' : '#fefce8') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: referencesCollected ? `1px solid #fde047` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {referencesCollecting ? (
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
                ) : referencesCollected ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: darkMode ? '#f3f4f6' : '#1f2937' }}>
                        References Collected
                      </div>
                      <div>Academic papers: {references.length || 0}</div>
                      <div>Further reading: {furtherReading.length || 0}</div>
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
              opacity: !referencesCollected ? 0.6 : 1
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                📰 Resources
              </h3>
              <div style={{ 
                color: darkMode ? '#9ca3af' : '#64748b',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: furtherReading.length > 0 ? (darkMode ? '#064e3b' : '#f0fdf4') : (darkMode ? '#374151' : '#f8fafc'),
                borderRadius: '8px',
                border: furtherReading.length > 0 ? `1px solid #bbf7d0` : `1px dashed ${darkMode ? '#4b5563' : '#cbd5e1'}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {furtherReading.length > 0 ? (
                  <div style={{ textAlign: 'left', width: '100%' }}>
                    <div style={{ fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: darkMode ? '#f3f4f6' : '#1f2937' }}>
                        Further Reading Available
                      </div>
                      <div>Business articles: {furtherReading.length}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                        Collected with references
                      </div>
                    </div>
                  </div>
                ) : referencesCollected ? (
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
      </main>
    </div>

    {/* Settings Modal */}
    {showSettingsModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: darkMode ? '#1f2937' : 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: darkMode ? '#f8fafc' : '#1e293b'
            }}>
              ⚙️ Batch Processing Settings
            </h2>
            <button
              onClick={() => setShowSettingsModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: darkMode ? '#9ca3af' : '#6b7280',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>

          {/* AI Model Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: darkMode ? '#f3f4f6' : '#1f2937',
              marginBottom: '8px'
            }}>
              AI Model
            </label>
            <select
              value={getCurrentAIModel()}
              onChange={(e) => setSettings({
                ...settings,
                modes: {
                  ...settings.modes,
                  [settings.rateLimitMode]: {
                    ...settings.modes[settings.rateLimitMode],
                    aiModel: e.target.value
                  }
                }
              })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: darkMode ? '1px solid #374151' : '1px solid #d1d5db',
                backgroundColor: darkMode ? '#374151' : 'white',
                color: darkMode ? '#f8fafc' : '#1e293b',
                fontSize: '14px'
              }}
            >
              <option value="claude-opus-4-20250514">Claude 4 Opus (Most Capable)</option>
              <option value="claude-sonnet-4-20250514">Claude 4 Sonnet (Latest & Recommended)</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast & Smart)</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fastest)</option>
              <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Latest & Most Capable)</option>
              <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Fast & Cost-Effective)</option>
              <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Agentic Era)</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Cheapest)</option>
            </select>
          </div>

          {/* Rate Limiting Mode */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: darkMode ? '#f3f4f6' : '#1f2937',
              marginBottom: '12px'
            }}>
              Rate Limiting Mode
            </label>

            {/* Uncapped Mode */}
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              border: settings.rateLimitMode === 'uncapped' ? '2px solid #3b82f6' : `1px solid ${darkMode ? '#374151' : '#e2e8f0'}`,
              backgroundColor: settings.rateLimitMode === 'uncapped' ? (darkMode ? '#1e3a8a' : '#eff6ff') : (darkMode ? '#374151' : '#f8fafc'),
              marginBottom: '8px',
              cursor: 'pointer'
            }} onClick={() => setSettings({...settings, rateLimitMode: 'uncapped'})}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: darkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: '4px'
                  }}>
                    📈 Uncapped ({settings.modes.uncapped.delay}s delay)
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    Fastest processing, may hit rate limits with premium models
                  </div>
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: settings.rateLimitMode === 'uncapped' ? '#3b82f6' : (darkMode ? '#9ca3af' : '#6b7280')
                }}>
                  ~${calculateEstimatedCost('uncapped')}
                </div>
              </div>
            </div>

            {/* Conservative Mode */}
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              border: settings.rateLimitMode === 'conservative' ? '2px solid #10b981' : `1px solid ${darkMode ? '#374151' : '#e2e8f0'}`,
              backgroundColor: settings.rateLimitMode === 'conservative' ? (darkMode ? '#064e3b' : '#f0fdf4') : (darkMode ? '#374151' : '#f8fafc'),
              marginBottom: '8px',
              cursor: 'pointer'
            }} onClick={() => setSettings({...settings, rateLimitMode: 'conservative'})}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: darkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: '4px'
                  }}>
                    🛡️ Conservative ({settings.modes.conservative.delay}s delay)
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    Safe for all models, slower processing, ideal for overnight runs
                  </div>
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: settings.rateLimitMode === 'conservative' ? '#10b981' : (darkMode ? '#9ca3af' : '#6b7280')
                }}>
                  ~${calculateEstimatedCost('conservative')}
                </div>
              </div>
            </div>

            {/* Custom Mode */}
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              border: settings.rateLimitMode === 'custom' ? '2px solid #8b5cf6' : `1px solid ${darkMode ? '#374151' : '#e2e8f0'}`,
              backgroundColor: settings.rateLimitMode === 'custom' ? (darkMode ? '#581c87' : '#faf5ff') : (darkMode ? '#374151' : '#f8fafc'),
              cursor: 'pointer'
            }} onClick={() => setSettings({...settings, rateLimitMode: 'custom'})}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: darkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: '4px'
                  }}>
                    ⚙️ Custom Delay
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    marginBottom: '8px'
                  }}>
                    Set your own delay between partnerships
                  </div>
                  {settings.rateLimitMode === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="range"
                        min="2"
                        max="300"
                        value={settings.modes.custom.delay}
                        onChange={(e) => {
                          const newDelay = parseInt(e.target.value);
                          setSettings({
                            ...settings,
                            modes: { ...settings.modes, custom: { ...settings.modes.custom, delay: newDelay } }
                          });
                        }}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="number"
                        min="2"
                        max="300"
                        value={settings.modes.custom.delay}
                        onChange={(e) => {
                          const newDelay = parseInt(e.target.value) || 2;
                          setSettings({
                            ...settings,
                            modes: { ...settings.modes, custom: { ...settings.modes.custom, delay: Math.min(300, Math.max(2, newDelay)) } }
                          });
                        }}
                        style={{
                          width: '60px',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                          backgroundColor: darkMode ? '#4b5563' : 'white',
                          color: darkMode ? '#f8fafc' : '#1e293b',
                          fontSize: '12px'
                        }}
                      />
                      <span style={{
                        fontSize: '12px',
                        color: darkMode ? '#9ca3af' : '#6b7280'
                      }}>seconds</span>
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: settings.rateLimitMode === 'custom' ? '#8b5cf6' : (darkMode ? '#9ca3af' : '#6b7280')
                }}>
                  ~${calculateEstimatedCost('custom')}
                </div>
              </div>
            </div>
          </div>

          {/* Processing Estimate */}
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: darkMode ? '#374151' : '#f8fafc',
            border: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: darkMode ? '#f3f4f6' : '#1f2937',
              marginBottom: '8px'
            }}>
              📊 Processing Estimate
            </div>
            <div style={{
              fontSize: '13px',
              color: darkMode ? '#9ca3af' : '#6b7280',
              lineHeight: '1.4'
            }}>
              <div>• {partnerships?.length || 0} partnerships</div>
              <div>• ~{calculateTotalTime()} processing time</div>
              <div>• Estimated cost: ${calculateEstimatedCost()}</div>
              <div>• {getCurrentDelay()}s between partnerships</div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowSettingsModal(false)}
              style={btn('secondary', 'md', false, darkMode)}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Save settings (could persist to localStorage here)
                setSelectedModel(getCurrentAIModel());
                setShowSettingsModal(false);
              }}
              style={btn('primary', 'md', false, darkMode)}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Batch Complete Modal */}
    {showBatchCompleteModal && batchResults && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: darkMode ? '#1f2937' : 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Modal Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>🎉</div>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: darkMode ? '#f8fafc' : '#1e293b',
              marginBottom: '8px'
            }}>
              Batch Processing Complete!
            </h2>
            <p style={{
              margin: 0,
              fontSize: '16px',
              color: darkMode ? '#9ca3af' : '#6b7280'
            }}>
              Successfully processed {batchResults.stats.success} of {batchResults.stats.total} partnerships
            </p>
          </div>

          {/* Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: darkMode ? '#064e3b' : '#f0fdf4',
              border: darkMode ? '1px solid #065f46' : '1px solid #bbf7d0'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#10b981',
                marginBottom: '4px'
              }}>{batchResults.stats.success}</div>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#9ca3af' : '#6b7280'
              }}>Successful</div>
            </div>
            
            {batchResults.stats.errors > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: darkMode ? '#7f1d1d' : '#fef2f2',
                border: darkMode ? '1px solid #991b1b' : '1px solid #fecaca'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ef4444',
                  marginBottom: '4px'
                }}>{batchResults.stats.errors}</div>
                <div style={{
                  fontSize: '12px',
                  color: darkMode ? '#9ca3af' : '#6b7280'
                }}>Errors</div>
              </div>
            )}
            
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: darkMode ? '#1e3a8a' : '#eff6ff',
              border: darkMode ? '1px solid #1e40af' : '1px solid #bfdbfe'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: '4px'
              }}>{batchResults.stats.duration ? Math.round(batchResults.stats.duration / 60) : '?'}</div>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#9ca3af' : '#6b7280'
              }}>Minutes</div>
            </div>
          </div>

          {/* Export Options */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <button
              onClick={exportAllToZip}
              style={btn('primary', 'lg', false, darkMode)}
            >
              📦 Export All to Files
            </button>
            
            <button
              onClick={pushAllToGitHub}
              style={btn('success', 'lg', false, darkMode)}
            >
              🔗 Push All to GitHub
            </button>
            
            <button
              onClick={() => setShowExportPreview(true)}
              style={btn('info', 'lg', false, darkMode)}
            >
              🚀 Export for OpenQase
            </button>
            
            <button
              onClick={() => {
                const reportContent = generateProcessingReport(batchResults);
                const blob = new Blob([reportContent], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `qookie-processing-report-${new Date().toISOString().slice(0, 10)}.md`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              style={{
                padding: '16px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#8b5cf6',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
            >
              📊 Download Processing Report
            </button>
          </div>

          {/* Processing Summary */}
          <div style={{
            backgroundColor: darkMode ? '#374151' : '#f8fafc',
            border: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: darkMode ? '#f3f4f6' : '#1f2937',
              marginBottom: '12px'
            }}>
              Processing Summary:
            </div>
            <div style={{
              fontSize: '13px',
              color: darkMode ? '#9ca3af' : '#6b7280',
              lineHeight: '1.4'
            }}>
              {batchResults.processedPartnerships.map(({ partnership, hasMetadata, hasReferences }) => (
                <div key={partnership.id} style={{ marginBottom: '4px' }}>
                  <strong>{partnership.company} + {partnership.partner}</strong>
                  {' '}
                  {hasMetadata ? '✅' : '❌'} Metadata
                  {' '}
                  {hasReferences ? '✅' : '❌'} References
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => {
                setShowBatchCompleteModal(false);
                setBatchResults(null);
              }}
              style={btn('secondary', 'md', false, darkMode)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Prompts Modal */}
    {showPromptsModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        }}>
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            paddingBottom: '16px'
          }}>
            <h2 style={{
              color: darkMode ? '#f8fafc' : '#1e293b',
              fontSize: '20px',
              fontWeight: '600',
              margin: 0
            }}>
              📝 AI Prompts & Commands
            </h2>
            <button
              onClick={() => setShowPromptsModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#9ca3af' : '#6b7280',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Modal Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            paddingRight: '20px' // Extra padding for scrollbar
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px'
            }}>
              
              {/* Dynamic Prompt Sections */}
              {promptConfig.map(({ key, icon, title }) => {
                const prompts = promptsData || {};
                const promptTemplate = prompts[key]?.template || '';
                const isEditing = editingPrompt === key;
                
                return (
                  <div key={key}>
                    <h3 style={{
                      color: darkMode ? '#f8fafc' : '#1e293b',
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {icon} {title}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!isEditing ? (
                          <button
                            onClick={() => handleEditPrompt(key)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            ✏️ Edit
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleSavePrompt}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              💾 Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleResetPrompt(key)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          🔄 Reset
                        </button>
                      </div>
                    </h3>
                    <div style={{
                      backgroundColor: darkMode ? '#374151' : '#f9fafb',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      {isEditing ? (
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '200px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: darkMode ? '#e5e7eb' : '#4b5563',
                            backgroundColor: darkMode ? '#1f2937' : 'white',
                            border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                            borderRadius: '4px',
                            padding: '12px',
                            resize: 'vertical',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.4'
                          }}
                        />
                      ) : (
                        <div style={{
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          color: darkMode ? '#e5e7eb' : '#4b5563',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.4',
                        }}>
                          {promptTemplate}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: darkMode ? '1px solid #374151' : '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setShowPromptsModal(false)}
              style={btn('secondary', 'md', false, darkMode)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Export Preview Modal */}
    <ExportPreviewModal
      isOpen={showExportPreview}
      onClose={() => setShowExportPreview(false)}
      batchResults={batchResults}
      onExport={exportAllToOpenQase}
      darkMode={darkMode}
    />
    </>
  );
}

export default App;