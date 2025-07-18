import React, { useState, useEffect } from 'react';

function App() {
  const [partnerships, setPartnerships] = useState([]);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [researchHistory, setResearchHistory] = useState([]);
  const [exportStatus, setExportStatus] = useState(null); // 'success', 'error', or null
  const [analyzing, setAnalyzing] = useState(false);
  const [referenceLists, setReferenceLists] = useState({
    algorithms: [],
    industries: [],
    personas: []
  });
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022');
  const [collectingReferences, setCollectingReferences] = useState(false);

  // Load CSV data and research history on mount
  useEffect(() => {
    loadPartnerships();
    setResearchHistory(getResearchHistory());
    loadReferenceLists();
  }, []);

  // Load cached case studies when partnership is selected
  useEffect(() => {
    if (selectedPartnership) {
      const cachedCaseStudy = getCachedCaseStudy(selectedPartnership.id);
      if (cachedCaseStudy) {
        setCaseStudy(cachedCaseStudy);
        console.log('Loaded cached case study for partnership:', selectedPartnership.id);
      } else {
        setCaseStudy(null);
      }
    } else {
      setCaseStudy(null);
    }
  }, [selectedPartnership]);

  const loadPartnerships = async () => {
    try {
      const response = await fetch('/data/quantum-partnerships.csv');
      const csvText = await response.text();
      const parsed = parseCSV(csvText);
      setPartnerships(parsed);
      console.log(`Loaded ${parsed.length} partnerships`);
    } catch (error) {
      console.error('Failed to load partnerships:', error);
      setError('Failed to load partnership data');
    }
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
      
      return {
        id: row.id !== undefined && row.id !== '' ? parseInt(row.id) : index + 1,
        company: row.quantum_company || '',
        partner: row.commercial_partner || '',
        year: row.year || '',
        notes: row.notes || ''
      };
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
        // Extract items from markdown list (lines starting with - or *)
        return text
          .split('\n')
          .filter(line => line.trim().match(/^[-*]\s+/))
          .map(line => line.replace(/^[-*]\s+/, '').trim())
          .filter(item => item.length > 0);
      };

      setReferenceLists({
        algorithms: parseMarkdownList(algorithmsText),
        industries: parseMarkdownList(industriesText),
        personas: parseMarkdownList(personasText)
      });

      console.log('Reference lists loaded successfully');
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

      // Save enhanced case study to cache
      saveCaseStudyToCache(partnership.id, enhancedCaseStudy);
      setCaseStudy(enhancedCaseStudy);

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
    
    
    setAnalyzing(true);
    setError(null);

    try {
      console.log('Analyzing case study with reference lists...', partnership);
      console.log('Reference lists state:', referenceLists);
      console.log('Algorithms count:', referenceLists.algorithms.length);
      console.log('Industries count:', referenceLists.industries.length);
      console.log('Personas count:', referenceLists.personas.length);
      
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

      const response = await fetch('http://localhost:3002/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: partnership.company,
          partner: partnership.partner,
          year: partnership.year,
          notes: prompt,
          caseStudy: caseStudy,
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
        
        // The response should be structured as a case study with metadata
        if (data.caseStudy && data.caseStudy.metadata) {
          analysisResult = data.caseStudy.metadata;
          console.log('Found metadata in response:', analysisResult);
        } else {
          // Fallback: try to parse as raw text
          let responseText = '';
          if (data.caseStudy && data.caseStudy.raw_response) {
            responseText = data.caseStudy.raw_response;
          } else if (data.caseStudy && data.caseStudy.summary) {
            responseText = data.caseStudy.summary;
          } else {
            responseText = JSON.stringify(data);
          }
          
          console.log('Parsing response text:', responseText);
          
          // Try to extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonText = jsonMatch ? jsonMatch[0] : responseText;
          
          console.log('Extracted JSON text:', jsonText);
          
          const fullResult = JSON.parse(jsonText);
          analysisResult = fullResult.metadata || fullResult;
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

      // Save enhanced case study to cache
      saveCaseStudyToCache(partnership.id, enhancedCaseStudy);
      setCaseStudy(enhancedCaseStudy);

      console.log('Case study analysis completed successfully');

    } catch (error) {
      console.error('Error analyzing case study:', error);
      setError(`Failed to analyze case study: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateCaseStudy = async (partnership, forceRegenerate = false) => {
    // Check for cached version first
    if (!forceRegenerate) {
      const cachedCaseStudy = getCachedCaseStudy(partnership.id);
      if (cachedCaseStudy) {
        setCaseStudy(cachedCaseStudy);
        console.log('Using cached case study for:', partnership.id);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setCaseStudy(null);

    try {
      console.log('Generating case study for:', partnership, 'forceRegenerate:', forceRegenerate);
      const response = await fetch('http://localhost:3002/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: partnership.company,
          partner: partnership.partner,
          year: partnership.year,
          notes: partnership.notes,
          model: selectedModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      // Save to cache
      saveCaseStudyToCache(partnership.id, data.caseStudy);
      
      setCaseStudy(data.caseStudy);
      console.log('Case study generated and cached successfully');

    } catch (error) {
      console.error('Error generating case study:', error);
      setError(`Failed to generate case study: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
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
                color: '#1e293b'
              }}>
                🔬 Quantum Partnership Research Tool
              </h1>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#64748b', 
                fontSize: '16px' 
              }}>
                Generate AI-powered case studies from quantum computing partnerships
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                Claude Model:
              </label>
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  minWidth: '260px'
                }}
              >
                <option value="claude-4-opus">Claude 4 Opus (Most Capable)</option>
                <option value="claude-4-sonnet">Claude 4 Sonnet (Latest)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast & Smart)</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fastest)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Left Column - Partnership List */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            position: 'sticky',
            top: '30px'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px', 
              fontWeight: '600',
              color: '#1e293b'
            }}>
              Partnerships ({partnerships.length})
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gap: '8px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {partnerships.slice(0, 20).map(partnership => {
                const hasCachedCaseStudy = getCachedCaseStudy(partnership.id) !== null;
                
                return (
                <div 
                  key={partnership.id}
                  onClick={() => setSelectedPartnership(partnership)}
                  style={{
                    padding: '12px 16px',
                    border: selectedPartnership && selectedPartnership.id === partnership.id 
                      ? '2px solid #3b82f6' 
                      : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: selectedPartnership && selectedPartnership.id === partnership.id 
                      ? '#eff6ff' 
                      : 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#1e293b',
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
                    color: '#64748b'
                  }}>
                    <span>{partnership.year || 'Unknown'}</span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>


          {/* Right Column - Selected Partnership & Case Study */}
          <div>
            {!selectedPartnership ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '60px 40px',
                textAlign: 'center',
                color: '#64748b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👈</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                  Select a Partnership
                </h3>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Choose a quantum computing partnership from the list to generate an AI-powered case study
                </p>
              </div>
            ) : (
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}>
                {/* Partnership Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '32px 32px 24px 32px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <h1 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '28px', 
                        fontWeight: '700',
                        lineHeight: '1.2'
                      }}>
                        {selectedPartnership.company}
                      </h1>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '500',
                        opacity: '0.9'
                      }}>
                        Partnership with {selectedPartnership.partner}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                        {selectedPartnership.year || 'Unknown Year'}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        opacity: '0.7',
                        padding: '2px 6px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '3px',
                        display: 'inline-block'
                      }}>
                        {selectedModel.includes('claude-4-opus') ? '4 Opus' : 
                         selectedModel.includes('claude-4-sonnet') ? '4 Sonnet' :
                         selectedModel.includes('3-5-haiku') ? '3.5 Haiku' :
                         selectedModel.includes('3-5-sonnet') ? '3.5 Sonnet' :
                         selectedModel.includes('opus') ? '3 Opus' :
                         selectedModel.includes('haiku') ? '3 Haiku' : '3 Sonnet'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      onClick={() => generateCaseStudy(selectedPartnership)}
                      disabled={loading}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      {loading ? 'Generating...' : '🔬 Generate Case Study'}
                    </button>

                    {/* Regenerate button */}
                    {caseStudy && !loading && (
                      <button 
                        onClick={() => generateCaseStudy(selectedPartnership, true)}
                        style={{
                          padding: '12px 18px',
                          backgroundColor: 'rgba(245, 158, 11, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        🔄 Regenerate
                      </button>
                    )}

                    {/* Analyze button */}
                    <button 
                      onClick={() => analyzeCaseStudy(selectedPartnership, caseStudy)}
                      disabled={!caseStudy || loading || analyzing || collectingReferences}
                      style={{
                        padding: '12px 18px',
                        backgroundColor: !caseStudy || loading || analyzing || collectingReferences
                          ? 'rgba(255,255,255,0.2)' 
                          : caseStudy?.advancedMetadata?._analyzed 
                            ? 'rgba(124, 58, 237, 0.9)' 
                            : 'rgba(5, 150, 105, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: !caseStudy || loading || analyzing || collectingReferences ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: !caseStudy || loading || analyzing || collectingReferences ? 0.6 : 1
                      }}
                    >
                      {analyzing ? (
                        '🔍 Analyzing...'
                      ) : caseStudy?.advancedMetadata?._analyzed ? (
                        '✅ Re-analyze'
                      ) : (
                        '🔍 Analyze Case Study'
                      )}
                    </button>

                    {/* Collect References button */}
                    <button 
                      onClick={() => collectReferences(selectedPartnership, caseStudy)}
                      disabled={!caseStudy || loading || analyzing || collectingReferences}
                      style={{
                        padding: '12px 18px',
                        backgroundColor: !caseStudy || loading || analyzing || collectingReferences
                          ? 'rgba(255,255,255,0.2)' 
                          : caseStudy?._referencesCollected 
                            ? 'rgba(168, 85, 247, 0.9)' 
                            : 'rgba(217, 119, 6, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: !caseStudy || loading || analyzing || collectingReferences ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: !caseStudy || loading || analyzing || collectingReferences ? 0.6 : 1
                      }}
                    >
                      {collectingReferences ? (
                        '📚 Collecting...'
                      ) : caseStudy?._referencesCollected ? (
                        '✅ Re-collect'
                      ) : (
                        '📚 Collect References'
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: '32px' }}>
                  {/* Loading State */}
                  {loading && (
                    <div style={{ 
                      textAlign: 'center',
                      padding: '60px 40px'
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔬</div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                        Researching Partnership
                      </h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        Claude AI is analyzing the partnership and generating a comprehensive case study...
                      </p>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div style={{ 
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      padding: '24px',
                      border: '1px solid #fecaca',
                      marginBottom: '24px'
                    }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                        Generation Failed
                      </h3>
                      <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px' }}>
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Case Study Content */}
                  {caseStudy && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                          📄 Case Study
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* Export button */}
                          <button
                            onClick={() => exportToMarkdown(selectedPartnership, caseStudy)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#059669',
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
                              e.target.style.backgroundColor = '#047857';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#059669';
                            }}
                          >
                            📄 Export Markdown
                          </button>

                          {/* Cache status indicator */}
                          {caseStudy && caseStudy._cached && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              color: '#065f46'
                            }}>
                              <span>💾</span>
                              <span style={{ fontWeight: '500' }}>
                                Cached {new Date(caseStudy._cachedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                
                      <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '24px' }}>
                        {caseStudy.title}
                      </h3>
                
                {caseStudy.summary && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                      📋 Executive Summary
                    </h4>
                    <p style={{ color: '#1f2937', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
                      {caseStudy.summary}
                    </p>
                  </div>
                )}

                {caseStudy.introduction && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                      🚀 Introduction
                    </h4>
                    <p style={{ color: '#1f2937', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
                      {caseStudy.introduction}
                    </p>
                  </div>
                )}

                {caseStudy.challenge && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                      ⚡ Challenge
                    </h4>
                    <p style={{ color: '#1f2937', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
                      {caseStudy.challenge}
                    </p>
                  </div>
                )}

                {caseStudy.solution && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                      💡 Solution
                    </h4>
                    <p style={{ color: '#1f2937', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
                      {caseStudy.solution}
                    </p>
                  </div>
                )}

                {caseStudy.implementation && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                      ⚙️ Implementation
                    </h4>
                    <p style={{ color: '#1f2937', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
                      {caseStudy.implementation}
                    </p>
                  </div>
                )}

                {caseStudy.results_and_business_impact && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                      📊 Results & Business Impact
                    </h4>
                    <p style={{ color: '#1f2937', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
                      {caseStudy.results_and_business_impact}
                    </p>
                  </div>
                )}

                {caseStudy.future_directions && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                      🔮 Future Directions
                    </h4>
                    <p style={{ color: '#1f2937', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
                      {caseStudy.future_directions}
                    </p>
                  </div>
                )}
                
                {caseStudy.metadata && (
                  <div style={{ 
                    marginTop: '40px', 
                    padding: '24px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🏷️ Metadata
                      <span style={{
                        backgroundColor: '#6b7280',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: '500'
                      }}>
                        ORIGINAL
                      </span>
                    </h4>
                    
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Algorithms: </span>
                        <span style={{ color: '#1f2937' }}>
                          {caseStudy.metadata.algorithms && caseStudy.metadata.algorithms.length > 0 
                            ? caseStudy.metadata.algorithms.join(', ') 
                            : 'None specified'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Industries: </span>
                        <span style={{ color: '#1f2937' }}>
                          {caseStudy.metadata.industries && caseStudy.metadata.industries.length > 0 
                            ? caseStudy.metadata.industries.join(', ') 
                            : 'None specified'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Target Personas: </span>
                        <span style={{ color: '#1f2937' }}>
                          {caseStudy.metadata.personas && caseStudy.metadata.personas.length > 0 
                            ? caseStudy.metadata.personas.join(', ') 
                            : 'None specified'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Confidence Score: </span>
                        <span style={{ 
                          color: '#1f2937',
                          backgroundColor: '#dbeafe',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          {caseStudy.metadata.confidence_score || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {caseStudy.advancedMetadata && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '24px', 
                    backgroundColor: '#f0f9ff', 
                    borderRadius: '8px',
                    border: '1px solid #bae6fd'
                  }}>
                    <h4 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🔬 Advanced Metadata
                      <span style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: '500'
                      }}>
                        ANALYZED
                      </span>
                    </h4>
                    
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Algorithms: </span>
                        <span style={{ color: '#1f2937' }}>
                          {caseStudy.advancedMetadata.algorithms && caseStudy.advancedMetadata.algorithms.length > 0 
                            ? caseStudy.advancedMetadata.algorithms.join(', ') 
                            : 'None specified'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Industries: </span>
                        <span style={{ color: '#1f2937' }}>
                          {caseStudy.advancedMetadata.industries && caseStudy.advancedMetadata.industries.length > 0 
                            ? caseStudy.advancedMetadata.industries.join(', ') 
                            : 'None specified'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Target Personas: </span>
                        <span style={{ color: '#1f2937' }}>
                          {caseStudy.advancedMetadata.personas && caseStudy.advancedMetadata.personas.length > 0 
                            ? caseStudy.advancedMetadata.personas.join(', ') 
                            : 'None specified'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Confidence Score: </span>
                        <span style={{ 
                          color: '#1f2937',
                          backgroundColor: '#dbeafe',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          {caseStudy.advancedMetadata.confidence_score || 'Not provided'}
                        </span>
                      </div>
                      {caseStudy.advancedMetadata.analysis_notes && (
                        <div>
                          <span style={{ fontWeight: '600', color: '#374151' }}>Analysis Notes: </span>
                          <span style={{ color: '#1f2937', fontStyle: 'italic' }}>
                            {caseStudy.advancedMetadata.analysis_notes}
                          </span>
                        </div>
                      )}
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Analyzed: </span>
                        <span style={{ color: '#1f2937', fontSize: '14px' }}>
                          {new Date(caseStudy.advancedMetadata._analyzedAt).toLocaleString()}
                        </span>
                      </div>
                      </div>
                    </div>
                  )}

                  {/* References Section */}
                  {caseStudy.references && caseStudy.references.length > 0 && (
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '24px', 
                      backgroundColor: '#fefce8', 
                      borderRadius: '8px',
                      border: '1px solid #fde047'
                    }}>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📚 References
                        <span style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: '500'
                        }}>
                          ACADEMIC
                        </span>
                      </h4>
                      
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {caseStudy.references.map((ref, index) => (
                          <div key={index} style={{ 
                            padding: '16px',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            border: '1px solid #fed7aa'
                          }}>
                            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                              {ref.title}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                              {ref.authors && ref.authors.join(', ')} ({ref.year})
                            </div>
                            <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px', fontStyle: 'italic' }}>
                              {ref.journal}
                            </div>
                            {ref.relevance_note && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#065f46',
                                backgroundColor: '#ecfdf5',
                                padding: '8px',
                                borderRadius: '4px',
                                marginBottom: '8px',
                                border: '1px solid #bbf7d0'
                              }}>
                                <strong>Relevance:</strong> {ref.relevance_note}
                              </div>
                            )}
                            {ref.citation && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#4b5563',
                                backgroundColor: '#f9fafb',
                                padding: '8px',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                              }}>
                                {ref.citation}
                              </div>
                            )}
                            {ref.url && (
                              <div style={{ marginTop: '8px' }}>
                                <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{
                                  color: '#3b82f6',
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}>
                                  🔗 View Source
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Further Reading Section */}
                  {caseStudy.furtherReading && caseStudy.furtherReading.length > 0 && (
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '24px', 
                      backgroundColor: '#f0fdf4', 
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📰 Further Reading
                        <span style={{
                          backgroundColor: '#059669',
                          color: 'white',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: '500'
                        }}>
                          BUSINESS
                        </span>
                      </h4>
                      
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {caseStudy.furtherReading.map((item, index) => (
                          <div key={index} style={{ 
                            padding: '16px',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0'
                          }}>
                            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                              {item.source} • {item.date}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                {item.description}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{
                                backgroundColor: item.type === 'blog_post' ? '#3b82f6' : 
                                               item.type === 'press_release' ? '#8b5cf6' : 
                                               item.type === 'news' ? '#ef4444' : '#6b7280',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontWeight: '500'
                              }}>
                                {item.type?.replace('_', ' ').toUpperCase() || 'ARTICLE'}
                              </span>
                              {item.url && (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
                                  color: '#3b82f6',
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}>
                                  🔗 Read More
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collection Notes */}
                  {caseStudy.collectionNotes && (
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h5 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        📝 Collection Notes
                      </h5>
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#6b7280',
                        margin: 0,
                        fontStyle: 'italic'
                      }}>
                        {caseStudy.collectionNotes}
                      </p>
                      {caseStudy._referencesCollectedAt && (
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#9ca3af',
                          margin: '8px 0 0 0'
                        }}>
                          Collected: {new Date(caseStudy._referencesCollectedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recently Researched Section */}
        {researchHistory.length > 0 && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            marginTop: '30px'
          }}>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1e293b'
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
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#1e293b',
                    marginBottom: '4px'
                  }}>
                    {entry.partnership?.company} + {entry.partnership?.partner}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b'
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
      </div>
    </div>
  );
}

export default App;