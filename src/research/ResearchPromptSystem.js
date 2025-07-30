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
  "quantum_companies": ["List of quantum computing companies involved in the partnership"],
  "partner_companies": ["List of commercial/business partner companies involved"],
  "quantum_hardware": ["Specific quantum hardware systems mentioned (e.g., IBM Quantum, Google Sycamore, IonQ trapped-ion systems)"],
  "quantum_software": ["Specific quantum software/frameworks mentioned (e.g., Qiskit, Cirq, PennyLane, Forest)"],
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
    "publication_year": "{year}",
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

OPENQASE FIELD EXTRACTION REQUIREMENTS:
- **quantum_companies**: Identify all quantum computing companies involved (IBM Quantum, Google Quantum, Rigetti, IonQ, Quantinuum, etc.)
- **partner_companies**: Identify all commercial/business partners (banks, pharmaceuticals, logistics companies, etc.)
- **quantum_hardware**: Research and specify exact quantum hardware systems mentioned:
  • IBM: IBM Quantum processors (Condor, Flamingo, Heron series)
  • Google: Sycamore, Bristlecone processors
  • IonQ: Trapped-ion quantum computers
  • Rigetti: Superconducting quantum processors
  • Quantinuum: H-Series quantum computers
  • D-Wave: Quantum annealers (Advantage series)
- **quantum_software**: Research and specify quantum development tools/frameworks:
  • Qiskit (IBM's quantum computing framework)
  • Cirq (Google's quantum computing framework)
  • Forest (Rigetti's quantum cloud services)
  • PennyLane (quantum machine learning)
  • Amazon Braket SDK
  • Microsoft Q# and Azure Quantum
- **publication_year**: Year when the case study/partnership was publicly announced or published (not project duration)

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

Respond in JSON format with detailed information about this specific topic.`,

  serverApiPrompt: `Research and create a comprehensive case study about the quantum computing partnership between "{company}" and "{partner}".

CRITICAL TIMELINE RESEARCH: You must actively research and identify specific dates, timelines, and milestones for this partnership, even if not provided in the source data. Look for announcement dates, project phases, and current status.

IMPORTANT: You must respond with ONLY valid JSON. No markdown, no explanations, no text before or after the JSON.

Return this exact JSON structure:

{
  "title": "Partnership title",
  "summary": "2-3 sentence executive summary",
  "introduction": "Detailed introduction (200+ words) - MUST include specific partnership announcement date and timeline details",
  "challenge": "What challenge did this partnership address? (200+ words)",
  "solution": "What quantum solution was developed? (200+ words)", 
  "implementation": "How was it implemented? (200+ words) - MUST include project phases with specific dates/timeframes",
  "results_and_business_impact": "What were the results and business impact? (200+ words)",
  "future_directions": "What are the future plans? (150+ words)",
  "metadata": {
    "algorithms": ["list", "of", "quantum", "algorithms"],
    "industries": ["list", "of", "industries"],
    "personas": ["list", "of", "target", "personas"],
    "quantum_companies": ["list", "of", "quantum", "computing", "companies"],
    "partner_companies": ["list", "of", "commercial", "partner", "companies"],
    "quantum_hardware": ["specific", "quantum", "hardware", "systems"],
    "quantum_software": ["specific", "quantum", "software", "frameworks"],
    "announcement_date": "YYYY-MM-DD format - research and find actual date",
    "project_timeline": "Brief description of project phases and timing",
    "confidence_score": 0.85
  }
}

Additional context:
- Year: {year}
- Notes: {notes}

OPENQASE FIELD REQUIREMENTS:
- quantum_companies: Identify all quantum computing companies (IBM Quantum, Google Quantum, Rigetti, IonQ, Quantinuum, etc.)
- partner_companies: Identify all commercial/business partners (banks, pharmaceuticals, logistics companies, etc.)
- quantum_hardware: Research specific quantum hardware systems (IBM Quantum processors, Google Sycamore, IonQ trapped-ion systems, etc.)
- quantum_software: Research quantum development tools/frameworks (Qiskit, Cirq, PennyLane, Forest, Amazon Braket SDK, etc.)

Focus on factual information and realistic quantum computing applications. Respond with ONLY the JSON object.`,

  metadataPrompt: `You are a quantum computing metadata analyst tasked with extracting and analyzing structured metadata from case study content.

CASE STUDY CONTENT:
{caseStudyContent}

EXTRACTION REQUIREMENTS:
Extract the following metadata categories with high accuracy:

1. **Quantum Algorithms**: Identify specific quantum algorithms mentioned (QAOA, VQE, Grover's, Shor's, quantum annealing, etc.)
2. **Industries**: Identify primary industry sectors (finance, healthcare, logistics, manufacturing, etc.)
3. **Personas**: Identify key stakeholder types (CTO, Quantum Research Lead, Business Decision-Maker, etc.)
4. **Quantum Companies**: Identify quantum computing companies involved (IBM Quantum, Google Quantum, Rigetti, IonQ, Quantinuum, etc.)
5. **Partner Companies**: Identify commercial/business partners (banks, pharmaceuticals, logistics companies, etc.)
6. **Quantum Hardware**: Identify specific quantum hardware systems (IBM Quantum processors, Google Sycamore, IonQ trapped-ion systems, etc.)
7. **Quantum Software**: Identify quantum development tools/frameworks (Qiskit, Cirq, PennyLane, Forest, Amazon Braket SDK, etc.)

Return ONLY valid JSON in this format:
{
  "algorithms": ["list of quantum algorithms"],
  "industries": ["list of industries"],
  "personas": ["list of personas"],
  "quantum_companies": ["list of quantum companies"],
  "partner_companies": ["list of partner companies"],
  "quantum_hardware": ["list of hardware systems"],
  "quantum_software": ["list of software frameworks"],
  "confidence_score": 0.85,
  "extraction_notes": "Brief notes about extraction quality and any limitations"
}`,

  referencesPrompt: `You are a research librarian specializing in quantum computing partnerships. Your task is to find and validate references for case study content.

CASE STUDY CONTENT:
{caseStudyContent}

PARTNERSHIP DETAILS:
- Quantum Company: {company}
- Commercial Partner: {partner}
- Year: {year}

REFERENCE COLLECTION REQUIREMENTS:
Find and validate references in these categories:

1. **Scientific References**: Academic papers, research publications, technical reports
2. **Company Resources**: Press releases, blog posts, technical documentation, official case studies
3. **News Coverage**: Industry news, analyst reports, conference presentations
4. **Technical Documentation**: API docs, white papers, implementation guides

VALIDATION CRITERIA:
- Verify URL accessibility
- Check publication dates and relevance
- Assess source credibility
- Ensure technical accuracy

Return ONLY valid JSON in this format:
{
  "scientific_references": [
    {
      "title": "Reference title",
      "url": "https://example.com/reference",
      "year": "2023",
      "type": "academic_paper|technical_report|conference_paper",
      "authors": ["Author Name"],
      "publication": "Journal/Conference Name"
    }
  ],
  "company_resources": [
    {
      "title": "Resource title",
      "url": "https://example.com/resource",
      "type": "press_release|blog_post|technical_documentation|case_study",
      "company": "Company Name",
      "date": "YYYY-MM-DD"
    }
  ],
  "news_coverage": [
    {
      "title": "Article title",
      "url": "https://example.com/article",
      "publication": "Publication Name",
      "date": "YYYY-MM-DD",
      "type": "news_article|analyst_report|interview"
    }
  ],
  "validation_summary": {
    "total_references_found": 0,
    "verified_links": 0,
    "confidence_level": "high|medium|low",
    "search_completeness": "comprehensive|moderate|limited"
  }
}`
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
    },
    serverApiPrompt: {
      name: 'API Research Prompt',
      template: getPromptTemplate('serverApiPrompt'),
      isCustom: localStorage.getItem('qookie-custom-prompts') && JSON.parse(localStorage.getItem('qookie-custom-prompts')).serverApiPrompt
    },
    metadataPrompt: {
      name: 'Metadata Analysis Prompt',
      template: getPromptTemplate('metadataPrompt'),
      isCustom: localStorage.getItem('qookie-custom-prompts') && JSON.parse(localStorage.getItem('qookie-custom-prompts')).metadataPrompt
    },
    referencesPrompt: {
      name: 'References Collection Prompt',
      template: getPromptTemplate('referencesPrompt'),
      isCustom: localStorage.getItem('qookie-custom-prompts') && JSON.parse(localStorage.getItem('qookie-custom-prompts')).referencesPrompt
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