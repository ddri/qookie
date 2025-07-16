/**
 * Quantum Research Engine
 * 
 * This engine manages the research process for quantum computing partnerships,
 * ensuring high-quality case studies that match the reference standard.
 */

import { ResearchPromptSystem } from './ResearchPromptSystem.js';

export class QuantumResearchEngine {
  constructor() {
    this.referenceExample = null;
    this.claudeAPI = null;
    this.researchCache = new Map();
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * Initialize the research engine with reference example
   */
  async initialize(referenceExample) {
    this.referenceExample = referenceExample;
    
    // Check if Claude API is available
    if (typeof window !== 'undefined' && window.claude) {
      this.claudeAPI = window.claude;
      console.log('Claude API initialized for research');
    } else {
      console.warn('Claude API not available - using mock mode');
      this.claudeAPI = this.createMockAPI();
    }
  }

  /**
   * Create a mock API for development/testing
   */
  createMockAPI() {
    return {
      complete: async (prompt) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if this is a research prompt
        if (prompt.includes('partnership between')) {
          return this.generateMockResearchResponse(prompt);
        }
        
        return JSON.stringify({
          error: "Mock API - Claude not available for real research"
        });
      }
    };
  }

  /**
   * Generate a mock research response that looks realistic
   */
  generateMockResearchResponse(prompt) {
    const companyMatch = prompt.match(/between ([^and]+) and ([^.]+)/);
    const quantumCompany = companyMatch ? companyMatch[1].trim() : 'Unknown';
    const partner = companyMatch ? companyMatch[2].trim() : 'Unknown';
    
    const mockResponse = {
      title: `${quantumCompany} and ${partner}: Quantum Computing Partnership`,
      slug: `${quantumCompany.toLowerCase().replace(/\s+/g, '-')}-${partner.toLowerCase().replace(/\s+/g, '-')}-quantum-partnership`,
      summary: `${quantumCompany} partnered with ${partner} to explore quantum computing applications in their industry, focusing on optimization and computational challenges that could benefit from quantum advantages.`,
      introduction: `In recent years, ${quantumCompany} has established a strategic partnership with ${partner} to explore the potential of quantum computing in solving complex computational challenges. This collaboration represents a significant step forward in the practical application of quantum technologies in enterprise environments.`,
      challenge: `${partner} faced significant computational challenges in their operations that required innovative approaches. Traditional computing methods were reaching their limits in handling the scale and complexity of modern business requirements. The partnership aimed to identify specific use cases where quantum computing could provide meaningful advantages.`,
      solution: `${quantumCompany} developed a quantum computing solution tailored to ${partner}'s specific needs. The solution leveraged quantum algorithms and specialized hardware to address the computational bottlenecks identified in the challenge assessment phase.`,
      implementation: `The implementation followed a structured approach starting with proof-of-concept development, followed by pilot testing, and gradual scaling to production environments. The teams worked closely to ensure seamless integration with existing systems.`,
      results_and_business_impact: `The partnership demonstrated promising results in the targeted application areas. While specific metrics may vary, the collaboration has established a foundation for future quantum computing initiatives and has positioned both companies at the forefront of quantum technology adoption.`,
      future_directions: `Both companies plan to expand their quantum computing collaboration, exploring additional use cases and scaling successful implementations. This partnership serves as a model for other organizations considering quantum computing adoption.`,
      technical_details: `The solution utilized quantum algorithms appropriate for the problem domain, implemented on suitable quantum hardware platforms. Technical integration challenges were addressed through hybrid quantum-classical approaches.`,
      algorithms: ["Quantum Optimization", "Variational Quantum Algorithms"],
      industries: ["Technology", "Enterprise Computing"],
      personas: ["CTO", "Quantum Research Lead", "Business Decision-Maker"],
      scientific_references: [
        {
          title: "Mock Reference - Limited Research Available",
          url: "https://example.com/mock-reference",
          year: "2023",
          type: "press_release"
        }
      ],
      company_resources: [
        {
          title: "Mock Company Resource",
          url: "https://example.com/mock-resource",
          type: "press_release"
        }
      ],
      research_quality: {
        sources_found: "limited",
        confidence_level: "low",
        data_availability: "limited",
        verification_status: "preliminary"
      },
      metadata: {
        company: quantumCompany,
        partner: partner,
        year: "TBD",
        status: "TBD",
        research_date: new Date().toISOString().split('T')[0],
        word_count: "approximately 500"
      }
    };

    return JSON.stringify(mockResponse);
  }

  /**
   * Conduct research on a quantum partnership
   */
  async conductResearch(partnership) {
    if (!this.referenceExample) {
      throw new Error('Research engine not initialized with reference example');
    }

    const cacheKey = `${partnership.company}-${partnership.partner}`;
    
    // Check cache first
    if (this.researchCache.has(cacheKey)) {
      console.log(`Using cached research for ${cacheKey}`);
      return this.researchCache.get(cacheKey);
    }

    console.log(`Starting research for ${partnership.company} + ${partnership.partner}`);
    
    try {
      // Generate comprehensive research prompt
      const prompt = ResearchPromptSystem.generateResearchPrompt(
        partnership, 
        this.referenceExample
      );

      // Conduct research with retries
      const result = await this.executeResearchWithRetries(prompt, partnership);
      
      // Cache the result
      this.researchCache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error(`Research failed for ${partnership.company} + ${partnership.partner}:`, error);
      return this.createErrorResult(partnership, error);
    }
  }

  /**
   * Execute research with retry logic
   */
  async executeResearchWithRetries(prompt, partnership) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Research attempt ${attempt} for ${partnership.company} + ${partnership.partner}`);
        
        const response = await this.claudeAPI.complete(prompt);
        console.log('Claude API response:', response);
        const parsedResponse = JSON.parse(response);
        console.log('Parsed response:', parsedResponse);
        
        // Validate the response
        if (this.validateResearchResponse(parsedResponse)) {
          return {
            id: partnership.id,
            company: partnership.company,
            partner: partnership.partner,
            searchSuccess: true,
            data: parsedResponse,
            searchDate: new Date().toISOString(),
            attempt: attempt
          };
        } else {
          throw new Error('Invalid research response format');
        }
        
      } catch (error) {
        lastError = error;
        console.warn(`Research attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate research response format
   */
  validateResearchResponse(response) {
    const requiredFields = [
      'title', 'summary', 'introduction', 'challenge', 'solution',
      'implementation', 'results_and_business_impact', 'future_directions'
    ];
    
    console.log('Validating research response:', response);
    
    for (const field of requiredFields) {
      const fieldValue = response[field];
      const isValid = fieldValue && typeof fieldValue === 'string' && fieldValue.length > 50;
      console.log(`Field "${field}": ${isValid ? 'VALID' : 'INVALID'}`, {
        exists: !!fieldValue,
        type: typeof fieldValue,
        length: fieldValue?.length || 0
      });
      
      if (!isValid) {
        console.error(`Validation failed for field "${field}":`, fieldValue);
        return false;
      }
    }
    
    console.log('All fields validated successfully');
    return true;
  }

  /**
   * Create error result
   */
  createErrorResult(partnership, error) {
    return {
      id: partnership.id,
      company: partnership.company,
      partner: partnership.partner,
      searchSuccess: false,
      error: error.message,
      searchDate: new Date().toISOString()
    };
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate case study quality against reference
   */
  async validateCaseStudy(caseStudy) {
    if (!this.referenceExample) {
      throw new Error('No reference example available for validation');
    }

    try {
      const validationPrompt = ResearchPromptSystem.generateValidationPrompt(
        caseStudy, 
        this.referenceExample
      );
      
      const response = await this.claudeAPI.complete(validationPrompt);
      return JSON.parse(response);
      
    } catch (error) {
      console.error('Validation failed:', error);
      return {
        quality_score: 0,
        error: error.message,
        meets_reference_standard: false
      };
    }
  }

  /**
   * Get research statistics
   */
  getResearchStats() {
    return {
      cached_results: this.researchCache.size,
      api_available: this.claudeAPI !== null,
      reference_loaded: this.referenceExample !== null
    };
  }
}

export default QuantumResearchEngine;