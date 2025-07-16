/**
 * Quantum Partnership Research Prompt System
 * 
 * This system provides structured prompts for generating comprehensive case studies
 * that match the quality and format of the reference Barclays-Quantinuum case study.
 */

export const ResearchPromptSystem = {
  /**
   * Generate a comprehensive research prompt for a quantum partnership
   */
  generateResearchPrompt: (partnership, referenceExample) => {
    const prompt = `You are a quantum computing industry researcher tasked with creating a comprehensive case study about the partnership between ${partnership.company} and ${partnership.partner}. 

REFERENCE QUALITY STANDARD:
Use the following reference case study as your quality benchmark. Your output should match this level of detail, technical accuracy, and professional presentation:

---
${referenceExample}
---

RESEARCH TASK:
Create a detailed case study about the quantum computing partnership between ${partnership.company} and ${partnership.partner}. 

RESEARCH REQUIREMENTS:
1. Conduct thorough research using publicly available information
2. Focus on factual, verifiable information only
3. Include specific technical details about quantum implementation
4. Provide quantifiable business impact metrics where available
5. Maintain professional, academic tone throughout
6. Include proper citations and references

CASE STUDY STRUCTURE:
Your response must be structured as a valid JSON object with the following format:

{
  "title": "Professional title for the case study",
  "slug": "url-friendly-slug",
  "summary": "2-3 sentence executive summary",
  "introduction": "Comprehensive introduction paragraph explaining the partnership context, companies involved, and strategic objectives. Include timeline and partnership announcement details.",
  "challenge": "Detailed description of the specific business or technical challenge being addressed. Include industry context, market pressures, and why quantum computing was chosen as the solution approach.",
  "solution": "Technical description of the quantum computing solution implemented. Include specific quantum hardware/software platforms, algorithms used, technical architecture, and how it integrates with existing systems.",
  "implementation": "Step-by-step description of how the solution was implemented. Include project phases, timeline, team composition, testing procedures, and deployment strategy.",
  "results_and_business_impact": "Quantifiable results and business impact. Include specific metrics, performance improvements, cost savings, competitive advantages, and measurable outcomes.",
  "future_directions": "Partnership roadmap and expansion plans. Include next phase developments, scaling plans, commercialization strategy, and long-term vision.",
  "technical_details": "Deep technical information about quantum algorithms, hardware specifications, integration challenges, and technical innovations.",
  "algorithms": ["List of specific quantum algorithms used"],
  "industries": ["Primary industry sectors involved"],
  "personas": ["Key stakeholder types: CTO, Quantum Research Lead, Business Decision-Maker, etc."],
  "scientific_references": [
    {
      "title": "Reference title",
      "url": "https://example.com/reference",
      "year": "2023",
      "type": "academic_paper|press_release|technical_report"
    }
  ],
  "company_resources": [
    {
      "title": "Resource title",
      "url": "https://example.com/resource",
      "type": "press_release|blog_post|technical_documentation|case_study"
    }
  ],
  "research_quality": {
    "sources_found": "number_of_sources_researched",
    "confidence_level": "high|medium|low",
    "data_availability": "comprehensive|moderate|limited",
    "verification_status": "verified|partially_verified|preliminary"
  },
  "metadata": {
    "company": "${partnership.company}",
    "partner": "${partnership.partner}",
    "year": "${partnership.year || 'TBD'}",
    "status": "${partnership.status || 'TBD'}",
    "research_date": "${new Date().toISOString().split('T')[0]}",
    "word_count": "approximate_word_count"
  }
}

RESEARCH GUIDELINES:
- Only include factual information you can verify
- If information is limited, be honest about gaps in the research_quality section
- Focus on technical accuracy and business relevance
- Include specific quantum computing technologies and methodologies
- Provide context about why this partnership matters in the quantum computing ecosystem
- Ensure all sections are substantial and informative (minimum 200 words each for major sections)

CRITICAL: Return ONLY valid JSON. Do not include any text before or after the JSON object.

Partnership Details:
- Quantum Company: ${partnership.company}
- Commercial Partner: ${partnership.partner}
- Status: ${partnership.status || 'Unknown'}
- Year: ${partnership.year || 'Unknown'}
- Notes: ${partnership.notes || 'No additional notes'}

BEGIN RESEARCH AND CASE STUDY GENERATION:`;

    return prompt;
  },

  /**
   * Generate a validation prompt to check case study quality
   */
  generateValidationPrompt: (caseStudy, referenceExample) => {
    return `You are a quantum computing industry expert reviewing a case study for quality and accuracy.

REFERENCE STANDARD:
${referenceExample}

CASE STUDY TO REVIEW:
${JSON.stringify(caseStudy, null, 2)}

VALIDATION CRITERIA:
1. Technical accuracy of quantum computing details
2. Completeness of business impact information
3. Quality of writing and professional presentation
4. Factual accuracy and verifiability
5. Comparison to reference quality standard

Provide a JSON response with:
{
  "quality_score": 1-10,
  "strengths": ["List of strong points"],
  "improvements": ["List of areas for improvement"],
  "technical_accuracy": "assessment of technical details",
  "business_relevance": "assessment of business impact",
  "overall_assessment": "summary evaluation",
  "meets_reference_standard": true/false
}`;
  },

  /**
   * Generate a follow-up research prompt for additional details
   */
  generateFollowUpPrompt: (partnership, specificTopic) => {
    return `You are conducting follow-up research on the quantum computing partnership between ${partnership.company} and ${partnership.partner}.

FOCUS AREA: ${specificTopic}

Please provide detailed information specifically about this aspect of the partnership. Include:
- Technical specifications
- Implementation details
- Business impact metrics
- Timeline and milestones
- Key personnel involved
- References and sources

Respond in JSON format with detailed information about this specific topic.`;
  }
};

export default ResearchPromptSystem;