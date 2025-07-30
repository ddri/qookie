// ValidationEngine.js - Core validation logic for OpenQase exports
// Implements validation rules from OPENQASE-EXPORT-PRD.md

export class ValidationEngine {
  constructor() {
    this.rules = {
      critical: [
        'hasCompanyNames',
        'hasCaseStudyTitle',
        'hasMinimalContent'
      ],
      warnings: [
        'hasAllContentSections',
        'hasAdequateWordCount',
        'hasSummary',
        'hasMetadata',
        'hasReasonableConfidence'
      ]
    };
  }

  // Main validation method
  validateCaseStudiesForExport(processedPartnerships) {
    const results = {
      total: processedPartnerships.length,
      valid: 0,
      criticalErrors: [],
      warnings: [],
      qualityScores: [],
      summary: {
        canExport: true,
        overallQuality: 0,
        completionRate: 0
      }
    };

    processedPartnerships.forEach((item, index) => {
      const validation = this.validateSingleCaseStudy(item, index);
      
      if (validation.criticalErrors.length === 0) {
        results.valid++;
      }
      
      results.criticalErrors.push(...validation.criticalErrors);
      results.warnings.push(...validation.warnings);
      results.qualityScores.push(validation.qualityScore);
    });

    // Calculate summary metrics
    results.summary.canExport = results.criticalErrors.length === 0;
    results.summary.overallQuality = results.qualityScores.length > 0 
      ? results.qualityScores.reduce((a, b) => a + b, 0) / results.qualityScores.length 
      : 0;
    results.summary.completionRate = results.valid / results.total;

    return results;
  }

  // Validate individual case study
  validateSingleCaseStudy({ partnership, caseStudy, metadata, references, furtherReading }, index) {
    const partnershipName = `${partnership.company} + ${partnership.partner}`;
    const validation = {
      partnership: partnershipName,
      index,
      criticalErrors: [],
      warnings: [],
      qualityScore: 0,
      details: {}
    };

    // Run critical validations
    this.rules.critical.forEach(ruleName => {
      const result = this[ruleName](partnership, caseStudy, metadata);
      if (!result.isValid) {
        validation.criticalErrors.push({
          rule: ruleName,
          message: result.message,
          partnership: partnershipName,
          type: 'critical'
        });
      }
      validation.details[ruleName] = result;
    });

    // Run warning validations
    this.rules.warnings.forEach(ruleName => {
      const result = this[ruleName](partnership, caseStudy, metadata, references, furtherReading);
      if (!result.isValid) {
        validation.warnings.push({
          rule: ruleName,
          message: result.message,
          partnership: partnershipName,
          type: 'warning',
          severity: result.severity || 'medium'
        });
      }
      validation.details[ruleName] = result;
    });

    // Calculate quality score (0-100)
    validation.qualityScore = this.calculateQualityScore(validation.details);

    return validation;
  }

  // CRITICAL VALIDATION RULES

  hasCompanyNames(partnership, caseStudy, metadata) {
    const hasProvider = partnership.company && partnership.company.trim().length > 0;
    const hasPartner = partnership.partner && partnership.partner.trim().length > 0;
    
    return {
      isValid: hasProvider && hasPartner,
      message: !hasProvider ? 'Missing quantum provider name' : 
               !hasPartner ? 'Missing commercial partner name' : 
               'Company names are valid',
      score: (hasProvider && hasPartner) ? 100 : 0
    };
  }

  hasCaseStudyTitle(partnership, caseStudy, metadata) {
    const hasTitle = caseStudy.title && caseStudy.title.trim().length > 0;
    
    return {
      isValid: hasTitle,
      message: hasTitle ? 'Case study has title' : 'Case study missing title',
      score: hasTitle ? 100 : 0
    };
  }

  hasMinimalContent(partnership, caseStudy, metadata) {
    const contentSections = ['introduction', 'challenge', 'solution', 'implementation', 'results_and_business_impact', 'future_directions'];
    const hasAnyContent = contentSections.some(section => 
      caseStudy[section] && caseStudy[section].trim().length > 0
    );
    
    return {
      isValid: hasAnyContent,
      message: hasAnyContent ? 'Case study has content' : 'Case study has no content in any section',
      score: hasAnyContent ? 100 : 0
    };
  }

  // WARNING VALIDATION RULES

  hasAllContentSections(partnership, caseStudy, metadata) {
    const requiredSections = ['introduction', 'challenge', 'solution', 'implementation', 'results_and_business_impact', 'future_directions'];
    const missingSections = requiredSections.filter(section => 
      !caseStudy[section] || caseStudy[section].trim().length === 0
    );
    
    const completionRate = (requiredSections.length - missingSections.length) / requiredSections.length;
    
    return {
      isValid: missingSections.length === 0,
      message: missingSections.length === 0 ? 
        'All content sections present' : 
        `Missing sections: ${missingSections.join(', ')}`,
      score: completionRate * 100,
      missingSections,
      completionRate,
      severity: missingSections.length > 3 ? 'high' : missingSections.length > 1 ? 'medium' : 'low'
    };
  }

  hasAdequateWordCount(partnership, caseStudy, metadata) {
    const contentSections = ['introduction', 'challenge', 'solution', 'implementation', 'results_and_business_impact', 'future_directions', 'technical_details'];
    const allContent = contentSections.map(section => caseStudy[section] || '').join(' ') + (caseStudy.summary || '');
    const wordCount = allContent.split(/\s+/).filter(word => word.length > 0).length;
    
    const minWords = 500;
    const goodWords = 1500;
    const isAdequate = wordCount >= minWords;
    
    let score = 0;
    if (wordCount >= goodWords) score = 100;
    else if (wordCount >= minWords) score = 50 + (wordCount - minWords) / (goodWords - minWords) * 50;
    else score = (wordCount / minWords) * 50;
    
    return {
      isValid: isAdequate,
      message: isAdequate ? 
        `Good content volume (${wordCount} words)` : 
        `Low content volume (${wordCount} words). Recommended: ${minWords}+ words`,
      score,
      wordCount,
      severity: wordCount < 200 ? 'high' : wordCount < minWords ? 'medium' : 'low'
    };
  }

  hasSummary(partnership, caseStudy, metadata) {
    const hasSummary = caseStudy.summary && caseStudy.summary.trim().length > 0;
    const summaryLength = hasSummary ? caseStudy.summary.trim().length : 0;
    const isGoodLength = summaryLength >= 100 && summaryLength <= 500;
    
    return {
      isValid: hasSummary,
      message: !hasSummary ? 'Missing executive summary' :
               !isGoodLength ? `Summary length (${summaryLength} chars) should be 100-500 characters` :
               'Summary is present and well-sized',
      score: hasSummary ? (isGoodLength ? 100 : 70) : 0,
      summaryLength,
      severity: 'low'
    };
  }

  hasMetadata(partnership, caseStudy, metadata, references, furtherReading) {
    const hasAlgorithms = metadata?.algorithms?.length > 0 || metadata?.advancedMetadata?.algorithms?.length > 0;
    const hasIndustries = metadata?.industries?.length > 0 || metadata?.advancedMetadata?.industries?.length > 0;
    const hasPersonas = metadata?.personas?.length > 0 || metadata?.advancedMetadata?.personas?.length > 0;
    const hasQuantumCompanies = caseStudy?.quantum_companies?.length > 0 || metadata?.quantum_companies?.length > 0 || metadata?.advancedMetadata?.quantum_companies?.length > 0;
    const hasPartnerCompanies = caseStudy?.partner_companies?.length > 0 || metadata?.partner_companies?.length > 0 || metadata?.advancedMetadata?.partner_companies?.length > 0;
    const hasQuantumHardware = caseStudy?.quantum_hardware?.length > 0 || metadata?.quantum_hardware?.length > 0 || metadata?.advancedMetadata?.quantum_hardware?.length > 0;
    const hasQuantumSoftware = caseStudy?.quantum_software?.length > 0 || metadata?.quantum_software?.length > 0 || metadata?.advancedMetadata?.quantum_software?.length > 0;
    const hasReferences = references?.length > 0 || furtherReading?.length > 0;
    
    const metadataScore = [hasAlgorithms, hasIndustries, hasPersonas, hasQuantumCompanies, hasPartnerCompanies, hasQuantumHardware, hasQuantumSoftware, hasReferences].filter(Boolean).length;
    const isAdequate = metadataScore >= 4;
    
    return {
      isValid: isAdequate,
      message: isAdequate ? 
        'Good metadata coverage' : 
        'Limited metadata (missing algorithms, industries, personas, or references)',
      score: (metadataScore / 4) * 100,
      hasAlgorithms,
      hasIndustries,
      hasPersonas,
      hasReferences,
      metadataScore,
      severity: metadataScore === 0 ? 'high' : metadataScore === 1 ? 'medium' : 'low'
    };
  }

  hasReasonableConfidence(partnership, caseStudy, metadata) {
    const confidenceScore = metadata?.confidence_score || metadata?.advancedMetadata?.confidence_score || 0.5;
    const isReasonable = confidenceScore >= 0.3;
    
    return {
      isValid: isReasonable,
      message: isReasonable ? 
        `Confidence score: ${(confidenceScore * 100).toFixed(0)}%` : 
        `Very low confidence score: ${(confidenceScore * 100).toFixed(0)}%`,
      score: confidenceScore * 100,
      confidenceScore,
      severity: confidenceScore < 0.2 ? 'high' : confidenceScore < 0.3 ? 'medium' : 'low'
    };
  }

  // Calculate overall quality score (0-100)
  calculateQualityScore(details) {
    const weights = {
      // Critical rules (higher weight)
      hasCompanyNames: 0.2,
      hasCaseStudyTitle: 0.15,
      hasMinimalContent: 0.15,
      
      // Warning rules
      hasAllContentSections: 0.2,
      hasAdequateWordCount: 0.15,
      hasSummary: 0.05,
      hasMetadata: 0.08,
      hasReasonableConfidence: 0.02
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([ruleName, weight]) => {
      if (details[ruleName]) {
        totalScore += details[ruleName].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  // Get human-readable quality level
  getQualityLevel(score) {
    if (score >= 85) return { level: 'excellent', color: 'green', emoji: '🟢' };
    if (score >= 70) return { level: 'good', color: 'blue', emoji: '🔵' };
    if (score >= 50) return { level: 'fair', color: 'yellow', emoji: '🟡' };
    if (score >= 30) return { level: 'poor', color: 'orange', emoji: '🟠' };
    return { level: 'critical', color: 'red', emoji: '🔴' };
  }

  // Generate human-readable summary
  generateValidationSummary(validationResults) {
    const { total, valid, criticalErrors, warnings, summary } = validationResults;
    
    let summaryText = '';
    
    if (!summary.canExport) {
      summaryText = `❌ Export blocked: ${criticalErrors.length} critical error${criticalErrors.length !== 1 ? 's' : ''} found`;
    } else if (warnings.length > 0) {
      summaryText = `⚠️ Export ready with ${warnings.length} quality warning${warnings.length !== 1 ? 's' : ''}`;
    } else {
      summaryText = `✅ Export ready: ${valid} high-quality case stud${valid !== 1 ? 'ies' : 'y'}`;
    }
    
    summaryText += `\n📊 Overall Quality: ${Math.round(summary.overallQuality)}% • Completion: ${Math.round(summary.completionRate * 100)}%`;
    
    return summaryText;
  }
}

// Export singleton instance
export const validationEngine = new ValidationEngine();