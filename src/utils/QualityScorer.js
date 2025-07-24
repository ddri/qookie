// QualityScorer.js - Quality metrics and scoring for case studies
// Implements quality analytics from OPENQASE-EXPORT-PRD.md

export class QualityScorer {
  constructor() {
    this.metrics = {
      content: {
        minWords: 500,
        goodWords: 1500,
        excellentWords: 2500
      },
      sections: {
        required: ['introduction', 'challenge', 'solution', 'implementation', 'results_and_business_impact', 'future_directions'],
        optional: ['technical_details']
      },
      metadata: {
        categories: ['algorithms', 'industries', 'personas'],
        technologies: ['hardware', 'software']
      }
    };
  }

  // Calculate comprehensive quality scores for batch
  calculateBatchQuality(processedPartnerships) {
    const batchMetrics = {
      overall: {
        averageScore: 0,
        distribution: { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 },
        totalCaseStudies: processedPartnerships.length
      },
      content: {
        averageWordCount: 0,
        completionRates: {},
        averageCompletionRate: 0
      },
      metadata: {
        categoryCompleteness: {},
        averageConfidence: 0,
        referenceCoverage: 0
      },
      readiness: {
        exportReady: 0,
        needsWork: 0,
        blocked: 0
      }
    };

    const individualScores = processedPartnerships.map((item, index) => 
      this.calculateIndividualQuality(item, index)
    );

    // Calculate overall metrics
    this.calculateOverallMetrics(individualScores, batchMetrics);
    this.calculateContentMetrics(individualScores, batchMetrics);
    this.calculateMetadataMetrics(individualScores, batchMetrics);
    this.calculateReadinessMetrics(individualScores, batchMetrics);

    return {
      batchMetrics,
      individualScores,
      recommendations: this.generateRecommendations(batchMetrics, individualScores)
    };
  }

  // Calculate quality for individual case study
  calculateIndividualQuality({ partnership, caseStudy, metadata, references, furtherReading }, index) {
    const partnershipName = `${partnership.company} + ${partnership.partner}`;
    
    const scores = {
      partnership: partnershipName,
      index,
      overall: 0,
      breakdown: {
        content: this.scoreContent(caseStudy),
        metadata: this.scoreMetadata(metadata, references, furtherReading),
        completeness: this.scoreCompleteness(caseStudy, metadata),
        confidence: this.scoreConfidence(metadata)
      },
      details: {},
      recommendations: []
    };

    // Calculate weighted overall score
    const weights = { content: 0.4, metadata: 0.25, completeness: 0.25, confidence: 0.1 };
    scores.overall = Object.entries(weights).reduce((total, [category, weight]) => {
      return total + (scores.breakdown[category].score * weight);
    }, 0);

    // Generate specific recommendations
    scores.recommendations = this.generateIndividualRecommendations(scores.breakdown, partnershipName);
    
    // Add quality level
    scores.qualityLevel = this.getQualityLevel(scores.overall);

    return scores;
  }

  // CONTENT SCORING

  scoreContent(caseStudy) {
    const score = {
      score: 0,
      wordCount: 0,
      sectionCompleteness: 0,
      details: {
        sections: {},
        summary: {}
      }
    };

    // Calculate word count
    const allContent = this.metrics.sections.required
      .map(section => caseStudy[section] || '')
      .join(' ') + (caseStudy.summary || '');
    
    score.wordCount = allContent.split(/\s+/).filter(word => word.length > 0).length;

    // Score based on word count
    let wordScore = 0;
    if (score.wordCount >= this.metrics.content.excellentWords) wordScore = 100;
    else if (score.wordCount >= this.metrics.content.goodWords) wordScore = 80;
    else if (score.wordCount >= this.metrics.content.minWords) wordScore = 60;
    else wordScore = Math.max(0, (score.wordCount / this.metrics.content.minWords) * 60);

    // Score section completeness
    const completedSections = this.metrics.sections.required.filter(section => 
      caseStudy[section] && caseStudy[section].trim().length > 0
    );
    
    score.sectionCompleteness = completedSections.length / this.metrics.sections.required.length;
    const completenessScore = score.sectionCompleteness * 100;

    // Analyze individual sections
    this.metrics.sections.required.forEach(section => {
      const content = caseStudy[section] || '';
      const words = content.split(/\s+/).filter(word => word.length > 0).length;
      
      score.details.sections[section] = {
        hasContent: content.length > 0,
        wordCount: words,
        quality: words >= 100 ? 'good' : words >= 50 ? 'fair' : words > 0 ? 'minimal' : 'missing'
      };
    });

    // Analyze summary
    const summaryWords = (caseStudy.summary || '').split(/\s+/).filter(word => word.length > 0).length;
    score.details.summary = {
      hasContent: summaryWords > 0,
      wordCount: summaryWords,
      quality: summaryWords >= 100 && summaryWords <= 300 ? 'good' : 
               summaryWords >= 50 ? 'fair' : 
               summaryWords > 0 ? 'minimal' : 'missing'
    };

    // Combined content score (70% completeness, 30% word count)
    score.score = (completenessScore * 0.7) + (wordScore * 0.3);

    return score;
  }

  // METADATA SCORING

  scoreMetadata(metadata, references, furtherReading) {
    const score = {
      score: 0,
      categoryCompleteness: 0,
      technologyRichness: 0,
      referenceQuality: 0,
      details: {}
    };

    // Score category completeness
    const categoryScores = this.metrics.metadata.categories.map(category => {
      const data = metadata?.[category] || metadata?.advancedMetadata?.[category] || [];
      const hasData = Array.isArray(data) && data.length > 0;
      
      score.details[category] = {
        hasData,
        count: hasData ? data.length : 0,
        quality: hasData ? (data.length >= 3 ? 'rich' : data.length >= 2 ? 'good' : 'minimal') : 'missing'
      };
      
      return hasData ? 1 : 0;
    });

    score.categoryCompleteness = categoryScores.reduce((a, b) => a + b, 0) / this.metrics.metadata.categories.length;

    // Score technology richness
    const hardware = metadata?.quantum_hardware || metadata?.advancedMetadata?.quantum_hardware || [];
    const software = metadata?.quantum_software || metadata?.advancedMetadata?.quantum_software || [];
    
    const techScore = (
      (Array.isArray(hardware) && hardware.length > 0 ? 1 : 0) +
      (Array.isArray(software) && software.length > 0 ? 1 : 0)
    ) / 2;
    
    score.technologyRichness = techScore;
    score.details.technologies = {
      hardware: { count: hardware.length, quality: hardware.length > 0 ? 'good' : 'missing' },
      software: { count: software.length, quality: software.length > 0 ? 'good' : 'missing' }
    };

    // Score reference quality
    const totalReferences = (references?.length || 0) + (furtherReading?.length || 0);
    const academicReferences = references?.length || 0;
    
    score.referenceQuality = Math.min(1, totalReferences / 3); // Normalize to max 3 references
    score.details.references = {
      total: totalReferences,
      academic: academicReferences,
      quality: totalReferences >= 3 ? 'rich' : totalReferences >= 1 ? 'good' : 'missing'
    };

    // Combined metadata score
    score.score = (score.categoryCompleteness * 50) + (score.technologyRichness * 30) + (score.referenceQuality * 20);

    return score;
  }

  // COMPLETENESS SCORING

  scoreCompleteness(caseStudy, metadata) {
    const score = {
      score: 0,
      requiredFields: 0,
      optionalFields: 0,
      details: {}
    };

    // Check required fields
    const requiredChecks = [
      { field: 'title', value: caseStudy.title },
      { field: 'summary', value: caseStudy.summary },
      { field: 'introduction', value: caseStudy.introduction },
      { field: 'challenge', value: caseStudy.challenge },
      { field: 'solution', value: caseStudy.solution }
    ];

    const requiredComplete = requiredChecks.filter(check => 
      check.value && check.value.trim().length > 0
    ).length;

    score.requiredFields = requiredComplete / requiredChecks.length;

    // Check optional fields
    const optionalChecks = [
      { field: 'implementation', value: caseStudy.implementation },
      { field: 'results_and_business_impact', value: caseStudy.results_and_business_impact },
      { field: 'future_directions', value: caseStudy.future_directions },
      { field: 'technical_details', value: caseStudy.technical_details }
    ];

    const optionalComplete = optionalChecks.filter(check => 
      check.value && check.value.trim().length > 0
    ).length;

    score.optionalFields = optionalComplete / optionalChecks.length;

    // Track individual field completeness
    [...requiredChecks, ...optionalChecks].forEach(check => {
      score.details[check.field] = {
        complete: !!(check.value && check.value.trim().length > 0),
        wordCount: check.value ? check.value.split(/\s+/).filter(word => word.length > 0).length : 0
      };
    });

    // Combined completeness score (80% required, 20% optional)
    score.score = (score.requiredFields * 80) + (score.optionalFields * 20);

    return score;
  }

  // CONFIDENCE SCORING

  scoreConfidence(metadata) {
    const score = {
      score: 0,
      confidenceLevel: 'unknown',
      details: {}
    };

    const confidenceValue = metadata?.confidence_score || metadata?.advancedMetadata?.confidence_score;
    
    if (typeof confidenceValue === 'number') {
      score.score = confidenceValue * 100;
      score.confidenceLevel = confidenceValue >= 0.8 ? 'high' : 
                             confidenceValue >= 0.5 ? 'medium' : 'low';
      
      score.details = {
        hasConfidence: true,
        value: confidenceValue,
        level: score.confidenceLevel
      };
    } else {
      score.score = 50; // Default medium confidence
      score.confidenceLevel = 'unknown';
      score.details = {
        hasConfidence: false,
        value: null,
        level: 'unknown'
      };
    }

    return score;
  }

  // BATCH METRICS CALCULATION

  calculateOverallMetrics(individualScores, batchMetrics) {
    const scores = individualScores.map(item => item.overall);
    batchMetrics.overall.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate distribution
    individualScores.forEach(item => {
      const level = item.qualityLevel.level;
      batchMetrics.overall.distribution[level]++;
    });
  }

  calculateContentMetrics(individualScores, batchMetrics) {
    const wordCounts = individualScores.map(item => item.breakdown.content.wordCount);
    batchMetrics.content.averageWordCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;

    const completionRates = individualScores.map(item => item.breakdown.content.sectionCompleteness);
    batchMetrics.content.averageCompletionRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

    // Section-specific completion rates
    this.metrics.sections.required.forEach(section => {
      const completedCount = individualScores.filter(item => 
        item.breakdown.content.details.sections[section]?.hasContent
      ).length;
      batchMetrics.content.completionRates[section] = completedCount / individualScores.length;
    });
  }

  calculateMetadataMetrics(individualScores, batchMetrics) {
    // Category completeness
    this.metrics.metadata.categories.forEach(category => {
      const completedCount = individualScores.filter(item => 
        item.breakdown.metadata.details[category]?.hasData
      ).length;
      batchMetrics.metadata.categoryCompleteness[category] = completedCount / individualScores.length;
    });

    // Average confidence
    const confidenceScores = individualScores.map(item => item.breakdown.confidence.score);
    batchMetrics.metadata.averageConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

    // Reference coverage
    const referenceCounts = individualScores.filter(item => 
      item.breakdown.metadata.details.references?.total > 0
    ).length;
    batchMetrics.metadata.referenceCoverage = referenceCounts / individualScores.length;
  }

  calculateReadinessMetrics(individualScores, batchMetrics) {
    individualScores.forEach(item => {
      if (item.overall >= 70) {
        batchMetrics.readiness.exportReady++;
      } else if (item.overall >= 40) {
        batchMetrics.readiness.needsWork++;
      } else {
        batchMetrics.readiness.blocked++;
      }
    });
  }

  // RECOMMENDATIONS

  generateRecommendations(batchMetrics, individualScores) {
    const recommendations = [];

    // Overall quality recommendations
    if (batchMetrics.overall.averageScore < 60) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        message: 'Batch quality is below recommended threshold. Consider improving content depth and metadata before export.'
      });
    }

    // Content recommendations
    if (batchMetrics.content.averageWordCount < this.metrics.content.minWords) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        message: `Average word count (${Math.round(batchMetrics.content.averageWordCount)}) is below recommended minimum (${this.metrics.content.minWords}).`
      });
    }

    // Section-specific recommendations
    Object.entries(batchMetrics.content.completionRates).forEach(([section, rate]) => {
      if (rate < 0.7) {
        recommendations.push({
          type: 'content',
          priority: 'medium',
          message: `${Math.round((1 - rate) * 100)}% of case studies missing ${section} section.`
        });
      }
    });

    // Metadata recommendations
    Object.entries(batchMetrics.metadata.categoryCompleteness).forEach(([category, rate]) => {
      if (rate < 0.5) {
        recommendations.push({
          type: 'metadata',
          priority: 'low',
          message: `${Math.round((1 - rate) * 100)}% of case studies missing ${category} categorization.`
        });
      }
    });

    return recommendations;
  }

  generateIndividualRecommendations(breakdown, partnershipName) {
    const recommendations = [];

    // Content recommendations
    if (breakdown.content.score < 60) {
      if (breakdown.content.wordCount < this.metrics.content.minWords) {
        recommendations.push(`Increase content depth (currently ${breakdown.content.wordCount} words)`);
      }
      if (breakdown.content.sectionCompleteness < 0.8) {
        recommendations.push('Complete missing content sections');
      }
    }

    // Metadata recommendations
    if (breakdown.metadata.score < 50) {
      recommendations.push('Add more categorization metadata (algorithms, industries, personas)');
    }

    // Completeness recommendations
    if (breakdown.completeness.score < 70) {
      recommendations.push('Complete required fields (title, summary, key sections)');
    }

    return recommendations;
  }

  // Get quality level from score
  getQualityLevel(score) {
    if (score >= 85) return { level: 'excellent', color: 'green', emoji: '🟢', description: 'Export ready - high quality' };
    if (score >= 70) return { level: 'good', color: 'blue', emoji: '🔵', description: 'Export ready - good quality' };
    if (score >= 50) return { level: 'fair', color: 'yellow', emoji: '🟡', description: 'Export ready with warnings' };
    if (score >= 30) return { level: 'poor', color: 'orange', emoji: '🟠', description: 'Needs improvement before export' };
    return { level: 'critical', color: 'red', emoji: '🔴', description: 'Significant issues - review required' };
  }
}

// Export singleton instance
export const qualityScorer = new QualityScorer();