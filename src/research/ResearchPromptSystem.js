/**
 * Quantum Partnership Research Prompt System
 * 
 * This system provides structured prompts for generating comprehensive case studies
 * that match the quality and format of the reference Barclays-Quantinuum case study.
 */

// Default prompt templates - can be overridden by localStorage
const DEFAULT_PROMPTS = {
  researchPrompt: `You are a quantum computing industry researcher tasked with creating a comprehensive case study about the partnership between {company} and {partner}. 

REFERENCE QUALITY STANDARD:
Use the following reference case study as your quality benchmark. Your output should match this level of detail, technical accuracy, and professional presentation:

---
{referenceExample}
---

RESEARCH TASK:
Create a detailed case study about the quantum computing partnership between {company} and {partner}. 

RESEARCH REQUIREMENTS:
1. Conduct thorough research using publicly available information
2. Focus on factual, verifiable information only
3. CRITICAL: Research and identify the actual partnership timeline, announcement date, project phases, and key milestones - even if not provided in source data
4. Include specific technical details about quantum implementation
5. Provide quantifiable business impact metrics where available
6. Maintain professional, academic tone throughout
7. Include proper citations and references

CASE STUDY STRUCTURE:
Your response must be structured as a valid JSON object with the following format:

{
  "title": "Professional title for the case study",
  "slug": "url-friendly-slug",
  "summary": "2-3 sentence executive summary",
  "introduction": "Comprehensive introduction paragraph explaining the partnership context, companies involved, and strategic objectives. MUST include specific dates: partnership announcement date, project start date, and key timeline milestones.",
  "challenge": "Detailed description of the specific business or technical challenge being addressed. Include industry context, market pressures, and why quantum computing was chosen as the solution approach.",
  "solution": "Technical description of the quantum computing solution implemented. Include specific quantum hardware/software platforms, algorithms used, technical architecture, and how it integrates with existing systems.",
  "implementation": "Step-by-step description of how the solution was implemented. Include specific project phases with dates, detailed timeline with months/quarters, team composition, testing procedures, and deployment strategy.",
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
    "company": "{company}",
    "partner": "{partner}",
    "year": "{year}",
    "announcement_date": "Specific date when partnership was announced (YYYY-MM-DD format)",
    "project_start_date": "Date when project/collaboration began (YYYY-MM-DD format)",
    "timeline_status": "ongoing|completed|pilot_phase|commercial_deployment",
    "research_date": "{researchDate}",
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
- Quantum Company: {company}
- Commercial Partner: {partner}
- Year: {year}
- Notes: {notes}

TIMELINE RESEARCH INSTRUCTIONS:
- If partnership year is missing or 'TBD', you MUST research and find:
  • Partnership announcement date
  • Project initiation date  
  • Key milestone dates
  • Current status and timeline
- Look for press releases, company announcements, research papers, and news articles
- Include specific months/quarters when possible
- If multiple phases exist, document each phase timeline

BEGIN RESEARCH AND CASE STUDY GENERATION:`,

  validationPrompt: `You are a quantum computing industry expert reviewing a case study for quality and accuracy.

REFERENCE STANDARD:
{referenceExample}

CASE STUDY TO REVIEW:
{caseStudy}

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
}`,

  followUpPrompt: `You are conducting follow-up research on the quantum computing partnership between {company} and {partner}.

FOCUS AREA: {specificTopic}

Please provide detailed information specifically about this aspect of the partnership. Include:
- Technical specifications
- Implementation details
- Business impact metrics
- Timeline and milestones
- Key personnel involved
- References and sources

Respond in JSON format with detailed information about this specific topic.`
};

// Get custom prompts from localStorage or use defaults
const getPromptTemplate = (promptName) => {
  const customPrompts = JSON.parse(localStorage.getItem('qookie-custom-prompts') || '{}');
  return customPrompts[promptName] || DEFAULT_PROMPTS[promptName];
};

// Save custom prompt to localStorage
export const saveCustomPrompt = (promptName, promptText) => {
  const customPrompts = JSON.parse(localStorage.getItem('qookie-custom-prompts') || '{}');
  customPrompts[promptName] = promptText;
  localStorage.setItem('qookie-custom-prompts', JSON.stringify(customPrompts));
};

// Reset prompt to default
export const resetPromptToDefault = (promptName) => {
  const customPrompts = JSON.parse(localStorage.getItem('qookie-custom-prompts') || '{}');
  delete customPrompts[promptName];
  localStorage.setItem('qookie-custom-prompts', JSON.stringify(customPrompts));
};

// Get all prompts for display in modal
export const getAllPrompts = () => {
  return {
    researchPrompt: {
      name: 'Research Prompt',
      template: getPromptTemplate('researchPrompt'),
      isCustom: localStorage.getItem('qookie-custom-prompts') && JSON.parse(localStorage.getItem('qookie-custom-prompts')).researchPrompt
    },
    validationPrompt: {
      name: 'Validation Prompt', 
      template: getPromptTemplate('validationPrompt'),
      isCustom: localStorage.getItem('qookie-custom-prompts') && JSON.parse(localStorage.getItem('qookie-custom-prompts')).validationPrompt
    },
    followUpPrompt: {
      name: 'Follow-up Prompt',
      template: getPromptTemplate('followUpPrompt'),
      isCustom: localStorage.getItem('qookie-custom-prompts') && JSON.parse(localStorage.getItem('qookie-custom-prompts')).followUpPrompt
    }
  };
};

export const ResearchPromptSystem = {
  /**
   * Generate a comprehensive research prompt for a quantum partnership
   */
  generateResearchPrompt: (partnership, referenceExample) => {
    const template = getPromptTemplate('researchPrompt');
    
    return template
      .replace(/\{company\}/g, partnership.company)
      .replace(/\{partner\}/g, partnership.partner)
      .replace(/\{year\}/g, partnership.year || 'RESEARCH REQUIRED - Find announcement/start dates')
      .replace(/\{notes\}/g, partnership.notes || 'No additional notes')
      .replace(/\{referenceExample\}/g, referenceExample)
      .replace(/\{researchDate\}/g, new Date().toISOString().split('T')[0]);
  },

  /**
   * Generate a validation prompt to check case study quality
   */
  generateValidationPrompt: (caseStudy, referenceExample) => {
    const template = getPromptTemplate('validationPrompt');
    
    return template
      .replace(/\{referenceExample\}/g, referenceExample)
      .replace(/\{caseStudy\}/g, JSON.stringify(caseStudy, null, 2));
  },

  /**
   * Generate a follow-up research prompt for additional details
   */
  generateFollowUpPrompt: (partnership, specificTopic) => {
    const template = getPromptTemplate('followUpPrompt');
    
    return template
      .replace(/\{company\}/g, partnership.company)
      .replace(/\{partner\}/g, partnership.partner)
      .replace(/\{specificTopic\}/g, specificTopic);
  }
};

export default ResearchPromptSystem;