// ExportPreviewModal.jsx - Preview and control interface for OpenQase exports
// Implements preview requirements from OPENQASE-EXPORT-PRD.md

import React, { useState, useEffect } from 'react';
import { X, Download, AlertTriangle, CheckCircle, Info, Eye } from 'lucide-react';

const ExportPreviewModal = ({ 
  isOpen, 
  onClose, 
  batchResults, 
  onExport, 
  darkMode = false 
}) => {
  const [validationResults, setValidationResults] = useState(null);
  const [qualityAnalysis, setQualityAnalysis] = useState(null);
  const [selectedCaseStudies, setSelectedCaseStudies] = useState(new Set());
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [previewCaseStudy, setPreviewCaseStudy] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize validation and quality analysis when modal opens
  useEffect(() => {
    if (isOpen && batchResults) {
      initializePreview();
    }
  }, [isOpen, batchResults]);

  const initializePreview = async () => {
    setLoading(true);
    try {
      // Import validation utilities
      const { validationEngine } = await import('../utils/ValidationEngine.js');
      const { qualityScorer } = await import('../utils/QualityScorer.js');
      
      // Run validation and quality analysis
      const validation = validationEngine.validateCaseStudiesForExport(batchResults.processedPartnerships);
      const quality = qualityScorer.calculateBatchQuality(batchResults.processedPartnerships);
      
      setValidationResults(validation);
      setQualityAnalysis(quality);
      
      // Initialize selection (select all valid case studies by default)
      const validCaseStudies = new Set(
        batchResults.processedPartnerships
          .map((_, index) => index)
          .filter(index => {
            const hasErrors = validation.criticalErrors.some(error => 
              error.partnership === `${batchResults.processedPartnerships[index].partnership.company} + ${batchResults.processedPartnerships[index].partnership.partner}`
            );
            return !hasErrors;
          })
      );
      setSelectedCaseStudies(validCaseStudies);
      
    } catch (error) {
      console.error('Failed to initialize preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedCaseStudies.size === 0) return;
    
    // Filter to only selected case studies
    const selectedData = {
      ...batchResults,
      processedPartnerships: batchResults.processedPartnerships.filter((_, index) => 
        selectedCaseStudies.has(index)
      )
    };
    
    await onExport(selectedData);
    onClose();
  };

  const toggleCaseStudy = (index) => {
    const newSelection = new Set(selectedCaseStudies);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedCaseStudies(newSelection);
  };

  const selectAll = () => {
    const allIndexes = new Set(batchResults.processedPartnerships.map((_, index) => index));
    setSelectedCaseStudies(allIndexes);
  };

  const selectNone = () => {
    setSelectedCaseStudies(new Set());
  };

  const selectOnlyValid = () => {
    if (!validationResults) return;
    
    const validIndexes = new Set(
      batchResults.processedPartnerships
        .map((_, index) => index)
        .filter(index => {
          const hasErrors = validationResults.criticalErrors.some(error => 
            error.partnership === `${batchResults.processedPartnerships[index].partnership.company} + ${batchResults.processedPartnerships[index].partnership.partner}`
          );
          return !hasErrors;
        })
    );
    setSelectedCaseStudies(validIndexes);
  };

  const getQualityIndicator = (index) => {
    if (!qualityAnalysis) return { emoji: '⚪', level: 'unknown', score: 0 };
    
    const caseQuality = qualityAnalysis.individualScores[index];
    if (!caseQuality) return { emoji: '⚪', level: 'unknown', score: 0 };
    
    return {
      emoji: caseQuality.qualityLevel.emoji,
      level: caseQuality.qualityLevel.level,
      score: Math.round(caseQuality.overall),
      description: caseQuality.qualityLevel.description
    };
  };

  const hasErrors = (index) => {
    if (!validationResults) return false;
    const partnership = batchResults.processedPartnerships[index].partnership;
    const partnershipName = `${partnership.company} + ${partnership.partner}`;
    return validationResults.criticalErrors.some(error => error.partnership === partnershipName);
  };

  const getErrorsForCaseStudy = (index) => {
    if (!validationResults) return [];
    const partnership = batchResults.processedPartnerships[index].partnership;
    const partnershipName = `${partnership.company} + ${partnership.partner}`;
    return validationResults.criticalErrors.filter(error => error.partnership === partnershipName);
  };

  const getWarningsForCaseStudy = (index) => {
    if (!validationResults) return [];
    const partnership = batchResults.processedPartnerships[index].partnership;
    const partnershipName = `${partnership.company} + ${partnership.partner}`;
    return validationResults.warnings.filter(warning => warning.partnership === partnershipName);
  };

  if (!isOpen) return null;

  const canExport = validationResults?.summary.canExport && selectedCaseStudies.size > 0;
  const selectedCount = selectedCaseStudies.size;
  const totalCount = batchResults?.processedPartnerships.length || 0;

  // Modal styles
  const modalBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const modalBorder = darkMode ? 'border-gray-600' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';
  const bgSecondary = darkMode ? 'bg-gray-700' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`${modalBg} ${modalBorder} border rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col`}>
        
        {/* Header */}
        <div className={`${bgSecondary} px-6 py-4 border-b ${modalBorder} flex items-center justify-between`}>
          <div>
            <h2 className={`text-xl font-semibold ${textPrimary}`}>
              OpenQase Export Preview
            </h2>
            <p className={`text-sm ${textSecondary} mt-1`}>
              Review and select case studies for export
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 ${textSecondary}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className={`text-center ${textSecondary}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Analyzing case studies...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && validationResults && qualityAnalysis && (
          <>
            {/* Summary Section */}
            <div className={`px-6 py-4 border-b ${modalBorder}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Quality Overview */}
                <div className={`${bgSecondary} p-4 rounded-lg`}>
                  <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>
                    Overall Quality
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {Math.round(validationResults.summary.overallQuality) >= 85 ? '🟢' :
                       Math.round(validationResults.summary.overallQuality) >= 70 ? '🔵' :
                       Math.round(validationResults.summary.overallQuality) >= 50 ? '🟡' : '🟠'}
                    </span>
                    <div>
                      <p className={`text-lg font-semibold ${textPrimary}`}>
                        {Math.round(validationResults.summary.overallQuality)}%
                      </p>
                      <p className={`text-xs ${textSecondary}`}>
                        {Math.round(validationResults.summary.overallQuality) >= 85 ? 'Excellent' :
                         Math.round(validationResults.summary.overallQuality) >= 70 ? 'Good' :
                         Math.round(validationResults.summary.overallQuality) >= 50 ? 'Fair' : 'Needs Work'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Export Status */}
                <div className={`${bgSecondary} p-4 rounded-lg`}>
                  <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>
                    Export Status
                  </h3>
                  <div className="flex items-center space-x-2">
                    {validationResults.summary.canExport ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <AlertTriangle className="text-red-500" size={20} />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${textPrimary}`}>
                        {validationResults.summary.canExport ? 'Ready to Export' : 'Blocked'}
                      </p>
                      <p className={`text-xs ${textSecondary}`}>
                        {validationResults.criticalErrors.length > 0 
                          ? `${validationResults.criticalErrors.length} critical errors`
                          : 'No critical issues'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selection Info */}
                <div className={`${bgSecondary} p-4 rounded-lg`}>
                  <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>
                    Selection
                  </h3>
                  <div>
                    <p className={`text-lg font-semibold ${textPrimary}`}>
                      {selectedCount} / {totalCount}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>
                      case studies selected
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {validationResults.criticalErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="text-red-500 mt-0.5" size={16} />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {validationResults.criticalErrors.length} Critical Error{validationResults.criticalErrors.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        Some case studies cannot be exported due to missing required data
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {validationResults.warnings.length > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="text-yellow-500 mt-0.5" size={16} />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        {validationResults.warnings.length} Quality Warning{validationResults.warnings.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                        Export will proceed but some case studies have quality issues
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Selection Controls */}
            <div className={`px-6 py-3 border-b ${modalBorder} flex items-center justify-between`}>
              <div className="flex space-x-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  Select All
                </button>
                <button
                  onClick={selectOnlyValid}
                  className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                >
                  Valid Only
                </button>
                <button
                  onClick={selectNone}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Select None
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Eye size={12} />
                  <span>Preview JSON</span>
                </button>
              </div>
            </div>

            {/* Case Studies List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {batchResults.processedPartnerships.map((item, index) => {
                const quality = getQualityIndicator(index);
                const errors = getErrorsForCaseStudy(index);
                const warnings = getWarningsForCaseStudy(index);
                const isSelected = selectedCaseStudies.has(index);
                const hasError = errors.length > 0;
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : `${modalBorder} hover:border-gray-400 dark:hover:border-gray-500`
                    } ${hasError ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCaseStudy(index)}
                        disabled={hasError}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{quality.emoji}</span>
                          <h3 className={`font-medium ${textPrimary} truncate`}>
                            {item.partnership.company} + {item.partnership.partner}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            hasError ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            quality.score >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}>
                            {hasError ? 'Error' : `${quality.score}%`}
                          </span>
                          {item.partnership.year && (
                            <span className={`text-xs ${textSecondary}`}>
                              {item.partnership.year}
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm ${textSecondary} mb-2`}>
                          {item.caseStudy.title || 'No title'}
                        </p>
                        
                        {errors.length > 0 && (
                          <div className="mb-2">
                            {errors.slice(0, 2).map((error, errorIndex) => (
                              <p key={errorIndex} className="text-xs text-red-600 dark:text-red-400">
                                ❌ {error.message}
                              </p>
                            ))}
                            {errors.length > 2 && (
                              <p className="text-xs text-red-500">
                                ... and {errors.length - 2} more errors
                              </p>
                            )}
                          </div>
                        )}
                        
                        {warnings.length > 0 && errors.length === 0 && (
                          <div className="mb-2">
                            {warnings.slice(0, 1).map((warning, warningIndex) => (
                              <p key={warningIndex} className="text-xs text-yellow-600 dark:text-yellow-400">
                                ⚠️ {warning.message}
                              </p>
                            ))}
                            {warnings.length > 1 && (
                              <p className="text-xs text-yellow-500">
                                ... and {warnings.length - 1} more warnings
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            📝 {qualityAnalysis.individualScores[index]?.breakdown.content.wordCount || 0} words
                          </span>
                          <span>
                            📊 {quality.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* JSON Preview */}
            {showJsonPreview && (
              <div className={`border-t ${modalBorder} px-6 py-4`}>
                <h3 className={`text-sm font-medium ${textPrimary} mb-2`}>
                  OpenQase Export Preview (First Case Study)
                </h3>
                <pre className={`text-xs ${bgSecondary} p-3 rounded overflow-x-auto max-h-40`}>
                  {selectedCaseStudies.size > 0 ? 
                    JSON.stringify({
                      export_metadata: {
                        export_version: "1.0",
                        export_date: new Date().toISOString(),
                        total_items: selectedCount,
                        export_type: "batch",
                        source: "qookie"
                      },
                      case_studies: ["... case study objects ..."]
                    }, null, 2) :
                    "No case studies selected"
                  }
                </pre>
              </div>
            )}

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${modalBorder} flex items-center justify-between`}>
              <div className={`text-sm ${textSecondary}`}>
                {selectedCount} case stud{selectedCount !== 1 ? 'ies' : 'y'} selected for export
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={!canExport}
                  className={`px-4 py-2 text-sm rounded-lg flex items-center space-x-2 ${
                    canExport
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Download size={16} />
                  <span>Export to OpenQase</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportPreviewModal;