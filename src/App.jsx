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
      }
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
        status: row.status || '',
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
- **Status**: ${partnership.status || 'Unknown'}
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

  const analyzeCaseStudy = async (partnership, caseStudy) => {
    if (!caseStudy) return;
    
    setAnalyzing(true);
    setError(null);

    try {
      console.log('Analyzing case study with reference lists...', partnership);
      
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
Algorithms: ${referenceLists.algorithms.join(', ')}
Industries: ${referenceLists.industries.join(', ')}
Personas: ${referenceLists.personas.join(', ')}

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

      const response = await fetch('http://localhost:3002/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: partnership.company,
          partner: partnership.partner,
          year: partnership.year,
          status: partnership.status,
          notes: prompt
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
          status: partnership.status,
          notes: partnership.notes
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
                    color: '#64748b',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span>{partnership.year || 'Unknown'}</span>
                    <span>•</span>
                    <span>{partnership.status || 'Unknown'}</span>
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
                padding: '24px',
                marginBottom: '30px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  🎯 Selected Partnership
                </h3>
                
                <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#374151', minWidth: '140px' }}>Quantum Company:</span>
                    <span style={{ color: '#1e293b' }}>{selectedPartnership.company}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#374151', minWidth: '140px' }}>Commercial Partner:</span>
                    <span style={{ color: '#1e293b' }}>{selectedPartnership.partner}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#374151', minWidth: '140px' }}>Year:</span>
                    <span style={{ color: '#1e293b' }}>{selectedPartnership.year || 'Unknown'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#374151', minWidth: '140px' }}>Status:</span>
                    <span style={{ color: '#1e293b' }}>{selectedPartnership.status || 'Unknown'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    onClick={() => generateCaseStudy(selectedPartnership)}
                    disabled={loading}
                    style={{
                      padding: '14px 28px',
                      backgroundColor: loading ? '#94a3b8' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? 'Generating...' : '🔬 Generate Case Study'}
                  </button>

                  {/* Regenerate button - only show if case study exists */}
                  {caseStudy && !loading && (
                    <button 
                      onClick={() => generateCaseStudy(selectedPartnership, true)}
                      style={{
                        padding: '14px 20px',
                        backgroundColor: '#f59e0b',
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

                  {/* Analyze button with different states */}
                  <button 
                    onClick={() => analyzeCaseStudy(selectedPartnership, caseStudy)}
                    disabled={!caseStudy || loading || analyzing}
                    style={{
                      padding: '14px 20px',
                      backgroundColor: !caseStudy || loading || analyzing 
                        ? '#94a3b8' 
                        : caseStudy?.advancedMetadata?._analyzed 
                          ? '#7c3aed' 
                          : '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: !caseStudy || loading || analyzing ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: !caseStudy || loading || analyzing ? 0.6 : 1
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
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                marginBottom: '30px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
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
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '30px',
                border: '1px solid #fecaca'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                  Generation Failed
                </h3>
                <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Case Study Display */}
            {caseStudy && (
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                marginBottom: '40px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0'
              }}>
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