// CaseStudyCard.jsx - Individual case study preview card with quality indicators
// Implements case study card requirements from OPENQASE-EXPORT-PRD.md

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock, FileText, Tags, Users } from 'lucide-react';

const CaseStudyCard = ({ 
  caseStudyData, 
  index, 
  qualityScore, 
  errors = [], 
  warnings = [], 
  isSelected, 
  onToggle, 
  darkMode = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { partnership, caseStudy, metadata, references, furtherReading } = caseStudyData;
  
  // Determine card state
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const isDisabled = hasErrors;
  
  // Quality level determination
  const getQualityLevel = (score) => {
    if (score >= 85) return { level: 'excellent', color: 'green', emoji: '🟢', bgClass: 'bg-green-50 dark:bg-green-900/20' };
    if (score >= 70) return { level: 'good', color: 'blue', emoji: '🔵', bgClass: 'bg-blue-50 dark:bg-blue-900/20' };
    if (score >= 50) return { level: 'fair', color: 'yellow', emoji: '🟡', bgClass: 'bg-yellow-50 dark:bg-yellow-900/20' };
    if (score >= 30) return { level: 'poor', color: 'orange', emoji: '🟠', bgClass: 'bg-orange-50 dark:bg-orange-900/20' };
    return { level: 'critical', color: 'red', emoji: '🔴', bgClass: 'bg-red-50 dark:bg-red-900/20' };
  };
  
  const qualityLevel = getQualityLevel(qualityScore?.overall || 0);
  
  // Content analysis
  const getContentCompleteness = () => {
    const sections = ['introduction', 'challenge', 'solution', 'implementation', 'results_and_business_impact', 'future_directions'];
    const completed = sections.filter(section => caseStudy[section] && caseStudy[section].trim().length > 0);
    return { completed: completed.length, total: sections.length, percentage: (completed.length / sections.length) * 100 };
  };
  
  const contentStats = getContentCompleteness();
  const wordCount = qualityScore?.breakdown?.content?.wordCount || 0;
  const confidenceScore = metadata?.confidence_score || metadata?.advancedMetadata?.confidence_score || 0;
  
  // Metadata analysis
  const getMetadataRichness = () => {
    const algorithms = metadata?.algorithms?.length || metadata?.advancedMetadata?.algorithms?.length || 0;
    const industries = metadata?.industries?.length || metadata?.advancedMetadata?.industries?.length || 0;
    const personas = metadata?.personas?.length || metadata?.advancedMetadata?.personas?.length || 0;
    const quantumCompanies = metadata?.quantum_companies?.length || metadata?.advancedMetadata?.quantum_companies?.length || 0;
    const partnerCompanies = metadata?.partner_companies?.length || metadata?.advancedMetadata?.partner_companies?.length || 0;
    const quantumHardware = metadata?.quantum_hardware?.length || metadata?.advancedMetadata?.quantum_hardware?.length || 0;
    const quantumSoftware = metadata?.quantum_software?.length || metadata?.advancedMetadata?.quantum_software?.length || 0;
    const referencesCount = (references?.length || 0) + (furtherReading?.length || 0);
    
    return { algorithms, industries, personas, quantumCompanies, partnerCompanies, quantumHardware, quantumSoftware, references: referencesCount };
  };
  
  const metadataStats = getMetadataRichness();
  
  // Styling
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const cardBorder = isSelected 
    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
    : hasErrors 
      ? 'border-red-300 dark:border-red-700' 
      : 'border-gray-200 dark:border-gray-700';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500';
  
  return (
    <div className={`${cardBg} border-2 ${cardBorder} rounded-lg transition-all duration-200 ${
      isDisabled ? 'opacity-60' : 'hover:shadow-md'
    } ${isSelected && !isDisabled ? qualityLevel.bgClass : ''}`}>
      
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start space-x-3">
          
          {/* Selection Checkbox */}
          <div className="flex items-center mt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(index)}
              disabled={isDisabled}
              className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${
                isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
          </div>
          
          {/* Quality Indicator */}
          <div className="flex flex-col items-center">
            <span className="text-2xl mb-1">{qualityLevel.emoji}</span>
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              hasErrors ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
              qualityLevel.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              qualityLevel.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
              qualityLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
            }`}>
              {hasErrors ? 'Error' : `${Math.round(qualityScore?.overall || 0)}%`}
            </span>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Title and Partnership */}
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${textPrimary} truncate`}>
                {partnership.company} + {partnership.partner}
              </h3>
              <div className="flex items-center space-x-2 text-xs">
                {partnership.year && (
                  <span className={`px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded ${textMuted}`}>
                    {partnership.year}
                  </span>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${textMuted}`}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
            
            {/* Case Study Title */}
            <p className={`text-sm ${textSecondary} mb-3 line-clamp-2`}>
              {caseStudy.title || <span className="italic text-red-500">No title provided</span>}
            </p>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-4 mb-3">
              
              {/* Content Status */}
              <div className="flex items-center space-x-1">
                <FileText size={14} className={textMuted} />
                <span className={`text-xs ${textMuted}`}>
                  {contentStats.completed}/{contentStats.total} sections
                </span>
                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      contentStats.percentage >= 80 ? 'bg-green-500' :
                      contentStats.percentage >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${contentStats.percentage}%` }}
                  />
                </div>
              </div>
              
              {/* Word Count */}
              <div className="flex items-center space-x-1">
                <Clock size={14} className={textMuted} />
                <span className={`text-xs ${textMuted}`}>
                  {wordCount} words
                </span>
              </div>
              
              {/* Metadata Richness */}
              <div className="flex items-center space-x-1">
                <Tags size={14} className={textMuted} />
                <span className={`text-xs ${textMuted}`}>
                  {metadataStats.algorithms + metadataStats.industries + metadataStats.personas} tags
                </span>
              </div>
            </div>
            
            {/* Errors and Warnings */}
            {hasErrors && (
              <div className="mb-3">
                <div className="flex items-start space-x-1">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    {errors.slice(0, 2).map((error, errorIndex) => (
                      <p key={errorIndex} className="text-xs text-red-600 dark:text-red-400 truncate">
                        {error.message}
                      </p>
                    ))}
                    {errors.length > 2 && (
                      <p className="text-xs text-red-500">
                        +{errors.length - 2} more errors
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {hasWarnings && !hasErrors && (
              <div className="mb-3">
                <div className="flex items-start space-x-1">
                  <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 truncate">
                      {warnings[0]?.message}
                    </p>
                    {warnings.length > 1 && (
                      <p className="text-xs text-yellow-500">
                        +{warnings.length - 1} more warnings
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Quality Summary */}
            {!hasErrors && (
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle size={14} className="text-green-500" />
                <span className={textMuted}>
                  {qualityLevel.level === 'excellent' ? 'Excellent quality - ready for export' :
                   qualityLevel.level === 'good' ? 'Good quality - ready for export' :
                   qualityLevel.level === 'fair' ? 'Fair quality - may need minor improvements' :
                   'Needs improvement before export'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          
          {/* Content Analysis */}
          <div>
            <h4 className={`text-sm font-medium ${textPrimary} mb-2 flex items-center space-x-1`}>
              <FileText size={16} />
              <span>Content Analysis</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className={textMuted}>Section Completion</p>
                <p className={textSecondary}>{contentStats.completed}/6 sections ({Math.round(contentStats.percentage)}%)</p>
              </div>
              <div>
                <p className={textMuted}>Word Count</p>
                <p className={textSecondary}>
                  {wordCount} words 
                  <span className={`ml-1 ${
                    wordCount >= 1500 ? 'text-green-600' :
                    wordCount >= 500 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    ({wordCount >= 1500 ? 'excellent' : wordCount >= 500 ? 'adequate' : 'low'})
                  </span>
                </p>
              </div>
              <div>
                <p className={textMuted}>Confidence Score</p>
                <p className={textSecondary}>
                  {Math.round(confidenceScore * 100)}%
                  <span className={`ml-1 ${
                    confidenceScore >= 0.8 ? 'text-green-600' :
                    confidenceScore >= 0.5 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    ({confidenceScore >= 0.8 ? 'high' : confidenceScore >= 0.5 ? 'medium' : 'low'})
                  </span>
                </p>
              </div>
              <div>
                <p className={textMuted}>References</p>
                <p className={textSecondary}>{metadataStats.references} references</p>
              </div>
            </div>
          </div>
          
          {/* Metadata Breakdown */}
          <div>
            <h4 className={`text-sm font-medium ${textPrimary} mb-2 flex items-center space-x-1`}>
              <Tags size={16} />
              <span>Categorization</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className={textMuted}>Algorithms</p>
                <p className={textSecondary}>{metadataStats.algorithms} items</p>
                {metadata?.algorithms?.slice(0, 2).map((algo, i) => (
                  <p key={i} className={`${textMuted} truncate`}>• {algo}</p>
                ))}
              </div>
              <div>
                <p className={textMuted}>Industries</p>
                <p className={textSecondary}>{metadataStats.industries} items</p>
                {metadata?.industries?.slice(0, 2).map((industry, i) => (
                  <p key={i} className={`${textMuted} truncate`}>• {industry}</p>
                ))}
              </div>
              <div>
                <p className={textMuted}>Personas</p>
                <p className={textSecondary}>{metadataStats.personas} items</p>
                {metadata?.personas?.slice(0, 2).map((persona, i) => (
                  <p key={i} className={`${textMuted} truncate`}>• {persona}</p>
                ))}
              </div>
              <div>
                <p className={textMuted}>Quantum Companies</p>
                <p className={textSecondary}>{metadataStats.quantumCompanies} items</p>
                {(metadata?.quantum_companies || metadata?.advancedMetadata?.quantum_companies)?.slice(0, 2).map((company, i) => (
                  <p key={i} className={`${textMuted} truncate`}>• {company}</p>
                ))}
              </div>
              <div>
                <p className={textMuted}>Partner Companies</p>
                <p className={textSecondary}>{metadataStats.partnerCompanies} items</p>
                {(metadata?.partner_companies || metadata?.advancedMetadata?.partner_companies)?.slice(0, 2).map((company, i) => (
                  <p key={i} className={`${textMuted} truncate`}>• {company}</p>
                ))}
              </div>
              <div>
                <p className={textMuted}>Quantum Hardware</p>
                <p className={textSecondary}>{metadataStats.quantumHardware} items</p>
                {(metadata?.quantum_hardware || metadata?.advancedMetadata?.quantum_hardware)?.slice(0, 2).map((hardware, i) => (
                  <p key={i} className={`${textMuted} truncate`}>• {hardware}</p>
                ))}
              </div>
              <div>
                <p className={textMuted}>Quantum Software</p>
                <p className={textSecondary}>{metadataStats.quantumSoftware} items</p>
                {(metadata?.quantum_software || metadata?.advancedMetadata?.quantum_software)?.slice(0, 2).map((software, i) => (
                  <p key={i} className={`${textMuted} truncate`}>• {software}</p>
                ))}
              </div>
            </div>
          </div>
          
          {/* Detailed Issues */}
          {(hasErrors || hasWarnings) && (
            <div>
              <h4 className={`text-sm font-medium ${textPrimary} mb-2`}>
                Issues & Recommendations
              </h4>
              <div className="space-y-1">
                {errors.map((error, i) => (
                  <div key={`error-${i}`} className="flex items-start space-x-2">
                    <AlertTriangle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      <span className="font-medium">Error:</span> {error.message}
                    </p>
                  </div>
                ))}
                {warnings.map((warning, i) => (
                  <div key={`warning-${i}`} className="flex items-start space-x-2">
                    <AlertTriangle size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      <span className="font-medium">Warning:</span> {warning.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quality Recommendations */}
          {qualityScore?.recommendations && qualityScore.recommendations.length > 0 && (
            <div>
              <h4 className={`text-sm font-medium ${textPrimary} mb-2`}>
                Improvement Suggestions
              </h4>
              <div className="space-y-1">
                {qualityScore.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <Users size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseStudyCard;