// ExportErrorHandler.js - Centralized error handling for OpenQase exports
// Implements error handling strategy from OPENQASE-EXPORT-PRD.md

export class ExportErrorHandler {
  constructor() {
    this.fallbackValues = {
      content: '',
      array: [],
      confidence: 0.5,
      year: null,
      wordCount: 0
    };
    
    this.errorLog = [];
  }

  // Main method to safely process case studies for export
  safelyProcessCaseStudies(processedPartnerships, onProgress = null) {
    const results = {
      successful: [],
      failed: [],
      warnings: [],
      summary: {
        totalAttempted: processedPartnerships.length,
        successCount: 0,
        failureCount: 0,
        warningCount: 0
      }
    };

    processedPartnerships.forEach((item, index) => {
      try {
        if (onProgress) onProgress(index, processedPartnerships.length);
        
        const processed = this.safelyProcessSingleCaseStudy(item, index);
        
        if (processed.success) {
          results.successful.push(processed.data);
          if (processed.warnings.length > 0) {
            results.warnings.push(...processed.warnings);
            results.summary.warningCount++;
          }
          results.summary.successCount++;
        } else {
          results.failed.push(processed.error);
          results.summary.failureCount++;
        }
        
      } catch (error) {
        const failureRecord = this.createFailureRecord(item, error, index);
        results.failed.push(failureRecord);
        results.summary.failureCount++;
        
        this.logError('PROCESSING_FAILURE', error, { item, index });
      }
    });

    return results;
  }

  // Safely process individual case study with fallbacks
  safelyProcessSingleCaseStudy({ partnership, caseStudy, metadata, references, furtherReading }, index) {
    const result = {
      success: false,
      data: null,
      warnings: [],
      error: null
    };

    try {
      // Validate minimum required data
      const validation = this.validateMinimumRequirements(partnership, caseStudy);
      if (!validation.isValid) {
        result.error = this.createFailureRecord({ partnership, caseStudy, metadata }, validation.error, index);
        return result;
      }

      // Safely extract and transform data with fallbacks
      const transformedData = this.safeTransform(partnership, caseStudy, metadata, references, furtherReading, result.warnings);
      
      result.success = true;
      result.data = transformedData;
      
    } catch (error) {
      result.error = this.createFailureRecord({ partnership, caseStudy, metadata }, error, index);
      this.logError('TRANSFORM_FAILURE', error, { partnership, index });
    }

    return result;
  }

  // Validate absolute minimum requirements for export
  validateMinimumRequirements(partnership, caseStudy) {
    const errors = [];

    // Must have partnership data
    if (!partnership) {
      errors.push('Partnership data is completely missing');
    } else {
      if (!partnership.company || typeof partnership.company !== 'string' || partnership.company.trim().length === 0) {
        errors.push('Quantum provider company name is missing or invalid');
      }
      if (!partnership.partner || typeof partnership.partner !== 'string' || partnership.partner.trim().length === 0) {
        errors.push('Commercial partner name is missing or invalid');
      }
    }

    // Must have some case study data
    if (!caseStudy) {
      errors.push('Case study data is completely missing');
    } else if (typeof caseStudy !== 'object') {
      errors.push('Case study data is not in expected format');
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? new Error(`Critical validation failed: ${errors.join('; ')}`) : null
    };
  }

  // Safely transform data with comprehensive fallbacks
  safeTransform(partnership, caseStudy, metadata, references, furtherReading, warnings) {
    const partnershipName = `${partnership.company} + ${partnership.partner}`;
    
    // Safe ID generation
    const partnershipId = this.safeGetString(partnership.id) || 
      `${this.safeGetString(partnership.company)}-${this.safeGetString(partnership.partner)}-${partnership.year || 'unknown'}`;
    
    // Safe slug generation
    const slug = `${this.safeGetString(partnership.company)}-${this.safeGetString(partnership.partner)}-quantum-partnership`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Safe content sections mapping
    const mainContent = {
      introduction: this.safeGetContent(caseStudy.introduction, 'introduction', partnershipName, warnings),
      challenge: this.safeGetContent(caseStudy.challenge, 'challenge', partnershipName, warnings),
      solution: this.safeGetContent(caseStudy.solution, 'solution', partnershipName, warnings),
      implementation: this.safeGetContent(caseStudy.implementation, 'implementation', partnershipName, warnings),
      results: this.safeGetContent(caseStudy.results_and_business_impact, 'results', partnershipName, warnings),
      future: this.safeGetContent(caseStudy.future_directions, 'future', partnershipName, warnings),
      technical: this.safeGetContent(caseStudy.technical_details, 'technical', partnershipName, warnings)
    };

    // Safe technology extraction
    const technologies = this.safeExtractTechnologies(metadata, partnershipName, warnings);

    // Safe categories mapping
    const categories = {
      industries: this.safeGetArray(metadata?.industries || metadata?.advancedMetadata?.industries, 'industries', partnershipName, warnings),
      algorithms: this.safeGetArray(metadata?.algorithms || metadata?.advancedMetadata?.algorithms, 'algorithms', partnershipName, warnings),
      personas: this.safeGetArray(metadata?.personas || metadata?.advancedMetadata?.personas, 'personas', partnershipName, warnings),
      technologies: technologies
    };

    // Safe references processing
    const allReferences = this.safeProcessReferences(references, furtherReading, partnership.year, partnershipName, warnings);

    // Safe word count calculation
    const wordCount = this.safeCalculateWordCount(mainContent, caseStudy.summary, partnershipName, warnings);

    // Safe confidence level determination
    const confidenceLevel = this.safeGetConfidenceLevel(metadata, partnershipName, warnings);

    // Safe data sources detection
    const dataSources = this.safeDetectDataSources(references, furtherReading, partnershipName, warnings);

    return {
      id: partnershipId,
      slug: slug,
      title: this.safeGetString(caseStudy.title) || `${partnership.company} and ${partnership.partner}: Quantum Computing Partnership`,
      summary: this.safeGetString(caseStudy.summary),
      main_content: mainContent,
      companies: {
        quantum_provider: this.safeGetString(partnership.company),
        commercial_partner: this.safeGetString(partnership.partner),
        year: this.safeGetNumber(partnership.year)
      },
      categories: categories,
      references: allReferences,
      metadata: {
        word_count: wordCount,
        research_date: this.safeGetDate(metadata?.advancedMetadata?._analyzedAt) || new Date().toISOString(),
        confidence_level: confidenceLevel,
        data_sources: dataSources,
        last_updated: new Date().toISOString()
      }
    };
  }

  // SAFE EXTRACTION METHODS

  safeGetString(value, fallback = '') {
    if (typeof value === 'string') return value;
    if (value != null) return String(value);
    return fallback;
  }

  safeGetNumber(value, fallback = null) {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  }

  safeGetArray(value, fieldName, partnershipName, warnings, fallback = []) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'string') {
      warnings.push({
        type: 'data_conversion',
        message: `${partnershipName}: Converted string to array for ${fieldName}`,
        field: fieldName
      });
      return [value];
    }
    if (value != null) {
      warnings.push({
        type: 'data_fallback',
        message: `${partnershipName}: Used fallback for invalid ${fieldName} data`,
        field: fieldName
      });
    }
    return fallback;
  }

  safeGetContent(value, sectionName, partnershipName, warnings) {
    const content = this.safeGetString(value);
    if (!content && value !== undefined) {
      warnings.push({
        type: 'missing_content',
        message: `${partnershipName}: Missing ${sectionName} section`,
        section: sectionName
      });
    }
    return content;
  }

  safeGetDate(value) {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  }

  safeExtractTechnologies(metadata, partnershipName, warnings) {
    const hardware = this.safeGetArray(
      metadata?.quantum_hardware || metadata?.advancedMetadata?.quantum_hardware, 
      'quantum_hardware', partnershipName, warnings
    );
    
    const software = this.safeGetArray(
      metadata?.quantum_software || metadata?.advancedMetadata?.quantum_software, 
      'quantum_software', partnershipName, warnings
    );

    return { hardware, software };
  }

  safeProcessReferences(references, furtherReading, partnershipYear, partnershipName, warnings) {
    const allReferences = [];

    // Process academic references
    if (Array.isArray(references)) {
      references.forEach((ref, index) => {
        try {
          allReferences.push({
            title: this.safeGetString(ref.title) || `Reference ${index + 1}`,
            url: this.safeGetString(ref.url),
            type: ref.journal ? 'academic_paper' : 'general_reference',
            date: this.safeGetString(ref.year) || partnershipYear || null
          });
        } catch (error) {
          warnings.push({
            type: 'reference_processing',
            message: `${partnershipName}: Failed to process reference ${index + 1}`,
            error: error.message
          });
        }
      });
    }

    // Process further reading
    if (Array.isArray(furtherReading)) {
      furtherReading.forEach((item, index) => {
        try {
          allReferences.push({
            title: this.safeGetString(item.title) || `Further Reading ${index + 1}`,
            url: this.safeGetString(item.url),
            type: this.safeGetString(item.type) || 'general_reference',
            date: this.safeGetString(item.date) || partnershipYear || null
          });
        } catch (error) {
          warnings.push({
            type: 'reference_processing',
            message: `${partnershipName}: Failed to process further reading ${index + 1}`,
            error: error.message
          });
        }
      });
    }

    return allReferences;
  }

  safeCalculateWordCount(mainContent, summary, partnershipName, warnings) {
    try {
      const contentText = Object.values(mainContent).join(' ') + (summary || '');
      return contentText.split(/\s+/).filter(word => word.length > 0).length;
    } catch (error) {
      warnings.push({
        type: 'calculation_error',
        message: `${partnershipName}: Failed to calculate word count, using fallback`,
        error: error.message
      });
      return this.fallbackValues.wordCount;
    }
  }

  safeGetConfidenceLevel(metadata, partnershipName, warnings) {
    try {
      const confidenceScore = metadata?.confidence_score || metadata?.advancedMetadata?.confidence_score;
      if (typeof confidenceScore === 'number') {
        if (confidenceScore >= 0.8) return 'high';
        if (confidenceScore >= 0.5) return 'medium';
        return 'low';
      }
    } catch (error) {
      warnings.push({
        type: 'confidence_calculation',
        message: `${partnershipName}: Failed to determine confidence level`,
        error: error.message
      });
    }
    return 'medium'; // Safe fallback
  }

  safeDetectDataSources(references, furtherReading, partnershipName, warnings) {
    const sources = [];
    
    try {
      if (Array.isArray(references) && references.length > 0) {
        sources.push('academic_paper');
      }
      
      if (Array.isArray(furtherReading)) {
        furtherReading.forEach(item => {
          if (item?.type === 'press_release' && !sources.includes('press_release')) {
            sources.push('press_release');
          }
          if (item?.type === 'blog_post' && !sources.includes('company_blog')) {
            sources.push('company_blog');
          }
        });
      }
      
      if (sources.length === 0) {
        sources.push('general_research');
      }
    } catch (error) {
      warnings.push({
        type: 'source_detection',
        message: `${partnershipName}: Failed to detect data sources`,
        error: error.message
      });
      sources.push('general_research');
    }

    return sources;
  }

  // Create standardized failure record
  createFailureRecord(item, error, index) {
    const partnershipName = item?.partnership ? 
      `${item.partnership.company || 'Unknown'} + ${item.partnership.partner || 'Unknown'}` : 
      `Case Study ${index + 1}`;

    return {
      partnership: partnershipName,
      index,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      type: 'processing_failure'
    };
  }

  // Central error logging
  logError(type, error, context = {}) {
    const errorRecord = {
      type,
      message: error.message || error,
      timestamp: new Date().toISOString(),
      context,
      stack: error.stack || null
    };
    
    this.errorLog.push(errorRecord);
    console.error(`[ExportErrorHandler] ${type}:`, errorRecord);
  }

  // Get error summary for reporting
  getErrorSummary() {
    const summary = {
      totalErrors: this.errorLog.length,
      errorTypes: {},
      recentErrors: this.errorLog.slice(-5)
    };

    this.errorLog.forEach(error => {
      summary.errorTypes[error.type] = (summary.errorTypes[error.type] || 0) + 1;
    });

    return summary;
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
  }
}

// Export singleton instance
export const exportErrorHandler = new ExportErrorHandler();