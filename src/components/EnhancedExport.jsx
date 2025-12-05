import React, { useState, useMemo } from 'react';
import { Download, FileText, FileJson, Package, Check, X, Filter, Calendar, Building2 } from 'lucide-react';

const EnhancedExport = ({ 
  partnerships,
  getCaseStudy,
  getMetadata,
  getReferences,
  darkMode 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('markdown');
  const [selectedPartnerships, setSelectedPartnerships] = useState(new Set());
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeReferences, setIncludeReferences] = useState(true);
  const [filterByYear, setFilterByYear] = useState('all');
  const [filterByCompany, setFilterByCompany] = useState('all');
  const [exportProgress, setExportProgress] = useState(null);

  // Get unique years and companies for filtering
  const { uniqueYears, uniqueCompanies } = useMemo(() => {
    const years = new Set();
    const companies = new Set();
    
    partnerships?.forEach(p => {
      if (p.year) years.add(p.year);
      if (p.quantum_company || p.company) {
        companies.add(p.quantum_company || p.company);
      }
    });
    
    return {
      uniqueYears: Array.from(years).sort().reverse(),
      uniqueCompanies: Array.from(companies).sort()
    };
  }, [partnerships]);

  // Filter partnerships based on criteria
  const filteredPartnerships = useMemo(() => {
    if (!partnerships) return [];
    
    return partnerships.filter(p => {
      const caseStudy = getCaseStudy(p.id);
      if (!caseStudy) return false;
      
      if (filterByYear !== 'all' && p.year !== filterByYear) return false;
      if (filterByCompany !== 'all' && (p.quantum_company || p.company) !== filterByCompany) return false;
      
      return true;
    });
  }, [partnerships, filterByYear, filterByCompany, getCaseStudy]);

  // Select/deselect all filtered partnerships
  const toggleSelectAll = () => {
    if (selectedPartnerships.size === filteredPartnerships.length) {
      setSelectedPartnerships(new Set());
    } else {
      setSelectedPartnerships(new Set(filteredPartnerships.map(p => p.id)));
    }
  };

  // Toggle individual partnership selection
  const togglePartnership = (id) => {
    const newSet = new Set(selectedPartnerships);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPartnerships(newSet);
  };

  // Generate export content
  const generateExportContent = () => {
    const selected = partnerships.filter(p => selectedPartnerships.has(p.id));
    
    if (selectedFormat === 'markdown') {
      return generateMarkdown(selected);
    } else if (selectedFormat === 'json') {
      return generateJSON(selected);
    } else if (selectedFormat === 'csv') {
      return generateCSV(selected);
    }
  };

  // Generate Markdown format
  const generateMarkdown = (partnershipsToExport) => {
    let content = '# Quantum Computing Case Studies Export\n\n';
    content += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
    content += `*Total Case Studies: ${partnershipsToExport.length}*\n\n`;
    content += '---\n\n';

    partnershipsToExport.forEach((partnership, index) => {
      const caseStudy = getCaseStudy(partnership.id);
      const metadata = includeMetadata ? getMetadata(partnership.id) : null;
      const references = includeReferences ? getReferences(partnership.id) : null;

      content += `## ${index + 1}. ${caseStudy.title || `${partnership.quantum_company || partnership.company} + ${partnership.commercial_partner || partnership.partner}`}\n\n`;
      
      if (partnership.year) {
        content += `**Year:** ${partnership.year}\n\n`;
      }

      // Case study sections
      if (caseStudy.summary) {
        content += `### Executive Summary\n${caseStudy.summary}\n\n`;
      }
      
      if (caseStudy.introduction) {
        content += `### Introduction\n${caseStudy.introduction}\n\n`;
      }
      
      if (caseStudy.challenge) {
        content += `### Challenge\n${caseStudy.challenge}\n\n`;
      }
      
      if (caseStudy.solution) {
        content += `### Solution\n${caseStudy.solution}\n\n`;
      }
      
      if (caseStudy.implementation) {
        content += `### Implementation\n${caseStudy.implementation}\n\n`;
      }
      
      if (caseStudy.results_and_business_impact) {
        content += `### Results and Business Impact\n${caseStudy.results_and_business_impact}\n\n`;
      }
      
      if (caseStudy.future_directions) {
        content += `### Future Directions\n${caseStudy.future_directions}\n\n`;
      }

      // Metadata
      if (metadata) {
        content += `### Metadata\n`;
        if (metadata.algorithms?.length) {
          content += `**Algorithms:** ${metadata.algorithms.join(', ')}\n`;
        }
        if (metadata.industries?.length) {
          content += `**Industries:** ${metadata.industries.join(', ')}\n`;
        }
        if (metadata.personas?.length) {
          content += `**Personas:** ${metadata.personas.join(', ')}\n`;
        }
        content += '\n';
      }

      // References
      if (references?.length) {
        content += `### References\n`;
        references.forEach(ref => {
          content += `- [${ref.title}](${ref.url})\n`;
        });
        content += '\n';
      }

      content += '---\n\n';
    });

    return content;
  };

  // Generate JSON format
  const generateJSON = (partnershipsToExport) => {
    const data = {
      exportDate: new Date().toISOString(),
      totalCaseStudies: partnershipsToExport.length,
      caseStudies: partnershipsToExport.map(partnership => {
        const caseStudy = getCaseStudy(partnership.id);
        const metadata = includeMetadata ? getMetadata(partnership.id) : null;
        const references = includeReferences ? getReferences(partnership.id) : null;

        return {
          partnership: {
            id: partnership.id,
            quantumCompany: partnership.quantum_company || partnership.company,
            commercialPartner: partnership.commercial_partner || partnership.partner,
            year: partnership.year
          },
          caseStudy,
          ...(metadata && { metadata }),
          ...(references && { references })
        };
      })
    };

    return JSON.stringify(data, null, 2);
  };

  // Generate CSV format
  const generateCSV = (partnershipsToExport) => {
    const headers = [
      'ID',
      'Quantum Company',
      'Commercial Partner',
      'Year',
      'Title',
      'Summary',
      ...(includeMetadata ? ['Algorithms', 'Industries', 'Personas'] : []),
      ...(includeReferences ? ['Reference Count'] : [])
    ];

    const rows = partnershipsToExport.map(partnership => {
      const caseStudy = getCaseStudy(partnership.id);
      const metadata = includeMetadata ? getMetadata(partnership.id) : null;
      const references = includeReferences ? getReferences(partnership.id) : null;

      return [
        partnership.id,
        partnership.quantum_company || partnership.company || '',
        partnership.commercial_partner || partnership.partner || '',
        partnership.year || '',
        caseStudy.title || '',
        (caseStudy.summary || '').replace(/"/g, '""').substring(0, 500),
        ...(includeMetadata ? [
          metadata?.algorithms?.join('; ') || '',
          metadata?.industries?.join('; ') || '',
          metadata?.personas?.join('; ') || ''
        ] : []),
        ...(includeReferences ? [references?.length || 0] : [])
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  // Handle export
  const handleExport = () => {
    if (selectedPartnerships.size === 0) {
      alert('Please select at least one case study to export');
      return;
    }

    setExportProgress('generating');
    
    setTimeout(() => {
      try {
        const content = generateExportContent();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        
        let filename, mimeType;
        if (selectedFormat === 'markdown') {
          filename = `quantum-case-studies-${timestamp}.md`;
          mimeType = 'text/markdown';
        } else if (selectedFormat === 'json') {
          filename = `quantum-case-studies-${timestamp}.json`;
          mimeType = 'application/json';
        } else if (selectedFormat === 'csv') {
          filename = `quantum-case-studies-${timestamp}.csv`;
          mimeType = 'text/csv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        setExportProgress('success');
        setTimeout(() => {
          setExportProgress(null);
          setShowModal(false);
        }, 2000);
      } catch (error) {
        console.error('Export failed:', error);
        setExportProgress('error');
        setTimeout(() => setExportProgress(null), 3000);
      }
    }, 500);
  };

  const exportableCount = filteredPartnerships.length;

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={exportableCount === 0}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
          exportableCount === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
        title={exportableCount === 0 ? 'No case studies to export' : 'Enhanced export options'}
      >
        <Package size={16} />
        <span>Export ({exportableCount})</span>
      </button>

      {/* Export Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package size={24} />
                Enhanced Export
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Filters and Options */}
              <div className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Export Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedFormat('markdown')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedFormat === 'markdown'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <FileText size={20} className="mx-auto mb-1" />
                      <div className="text-xs">Markdown</div>
                    </button>
                    <button
                      onClick={() => setSelectedFormat('json')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedFormat === 'json'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <FileJson size={20} className="mx-auto mb-1" />
                      <div className="text-xs">JSON</div>
                    </button>
                    <button
                      onClick={() => setSelectedFormat('csv')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedFormat === 'csv'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <FileText size={20} className="mx-auto mb-1" />
                      <div className="text-xs">CSV</div>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Filter size={14} className="inline mr-1" />
                    Filters
                  </label>
                  
                  <div className="space-y-2">
                    <select
                      value={filterByYear}
                      onChange={(e) => setFilterByYear(e.target.value)}
                      className={`w-full p-2 rounded border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="all">All Years</option>
                      {uniqueYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>

                    <select
                      value={filterByCompany}
                      onChange={(e) => setFilterByCompany(e.target.value)}
                      className={`w-full p-2 rounded border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="all">All Companies</option>
                      {uniqueCompanies.map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Include Options */}
                <div>
                  <label className="block text-sm font-medium mb-2">Include in Export</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Metadata (algorithms, industries, personas)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeReferences}
                        onChange={(e) => setIncludeReferences(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">References and citations</span>
                    </label>
                  </div>
                </div>

                {/* Statistics */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Available:</span>
                      <span className="font-medium">{filteredPartnerships.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Selected:</span>
                      <span className="font-medium text-blue-500">{selectedPartnerships.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Size:</span>
                      <span className="font-medium">
                        {selectedFormat === 'csv' ? '~' : ''}
                        {selectedPartnerships.size * (includeMetadata ? 15 : 10)}KB
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Partnership Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Select Case Studies</label>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    {selectedPartnerships.size === filteredPartnerships.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className={`border rounded-lg p-2 h-96 overflow-y-auto ${
                  darkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-50'
                }`}>
                  {filteredPartnerships.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No case studies match your filters
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredPartnerships.map(partnership => {
                        const caseStudy = getCaseStudy(partnership.id);
                        const isSelected = selectedPartnerships.has(partnership.id);
                        
                        return (
                          <label
                            key={partnership.id}
                            className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                              isSelected 
                                ? darkMode ? 'bg-blue-900' : 'bg-blue-50'
                                : darkMode ? 'hover:bg-gray-800' : 'hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePartnership(partnership.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {partnership.quantum_company || partnership.company} + {partnership.commercial_partner || partnership.partner}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                {partnership.year && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    {partnership.year}
                                  </span>
                                )}
                                {caseStudy?.title && (
                                  <span className="truncate max-w-xs">{caseStudy.title}</span>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              
              <button
                onClick={handleExport}
                disabled={selectedPartnerships.size === 0 || exportProgress !== null}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  selectedPartnerships.size === 0 || exportProgress !== null
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {exportProgress === 'generating' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Generating...</span>
                  </>
                ) : exportProgress === 'success' ? (
                  <>
                    <Check size={16} />
                    <span>Exported!</span>
                  </>
                ) : exportProgress === 'error' ? (
                  <>
                    <X size={16} />
                    <span>Export Failed</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Export {selectedPartnerships.size} Case Studies</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedExport;