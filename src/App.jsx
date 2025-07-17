import React, { useState, useEffect } from 'react';

function App() {
  const [partnerships, setPartnerships] = useState([]);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load CSV data on mount
  useEffect(() => {
    loadPartnerships();
  }, []);

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

  const generateCaseStudy = async (partnership) => {
    setLoading(true);
    setError(null);
    setCaseStudy(null);

    try {
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

      setCaseStudy(data.caseStudy);
      console.log('Case study generated successfully');

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
              {partnerships.slice(0, 20).map(partnership => (
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
                    marginBottom: '4px'
                  }}>
                    {partnership.company} + {partnership.partner}
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
              ))}
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
                <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                  📄 Case Study
                </h2>
                
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;