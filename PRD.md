# Quantum Case Study Tool - Product Requirements Document
**As Approved by CTO Review**

## Executive Summary
A research tool that uses Claude AI to automatically generate comprehensive case studies from a CSV of quantum computing partnerships. The tool conducts real AI research on each partnership and produces publication-ready case studies with metadata extraction.

## Core Value Proposition
Transform raw partnership data into detailed, researched case studies that would otherwise require hours of manual research per partnership.

## Phase 1: Prove Core Concept (Week 1)
**Goal**: Validate that Claude AI can produce quality research for quantum partnerships

### Deliverables
1. **Minimal API Integration**
   - Single function that calls Claude API successfully
   - Basic error handling and response parsing
   - Simple HTML page to test the integration

2. **Research Quality Validation**
   - Test 3-5 real partnerships from CSV
   - Validate research depth and accuracy
   - Determine optimal prompt structure
   - Measure response times and costs

3. **Technical Decisions Made**
   - API architecture (direct call vs backend proxy)
   - Response format standardization
   - Error handling strategy

### Success Criteria
- Can generate at least one high-quality case study
- Research contains accurate, detailed information
- Response time under 30 seconds per partnership
- Cost per case study under acceptable threshold

## Phase 2: Build Core Research Flow (Week 2)
**Goal**: End-to-end working prototype with real AI

### Features
1. **CSV Data Loading**
   - Load quantum partnerships from `/public/data/quantum-partnerships.csv`
   - Parse and display partnership list
   - Handle CSV parsing errors gracefully

2. **Partnership Selection & Research**
   - Click to select partnership from list
   - Trigger real Claude AI research
   - Display loading state during research
   - Show generated case study

3. **Basic Case Study Display**
   - Structured display of research results
   - Clear sections: Summary, Challenge, Solution, Impact
   - Basic styling (functional, not polished)

4. **Error Handling**
   - API failures with retry logic
   - Invalid partnerships
   - Rate limiting handling

### Technical Architecture
```
CSV Load → Partnership List → Select Partnership → 
Claude API Research → Parse Response → Display Case Study
```

### API Integration Strategy
- **Backend Proxy Approach**: Node.js server to handle CORS
- **Environment**: `.env` file with `ANTHROPIC_API_KEY`
- **Endpoint**: `POST /api/research` with partnership data
- **Response**: Structured JSON with case study sections

### Success Criteria
- Complete workflow works for any CSV partnership
- Real AI generates coherent, detailed case studies
- System handles failures gracefully
- Performance acceptable for single-user usage

## Phase 3: Production Features (Week 3+)
**Goal**: Full-featured application ready for real usage

### Advanced Features
1. **Data Persistence**
   - localStorage caching of generated case studies
   - Regeneration capability
   - Research history tracking

2. **Metadata Extraction**
   - Quantum algorithms identified
   - Industry classifications
   - Target personas
   - Scientific references
   - Company resources

3. **Export Capabilities**
   - Markdown export
   - PDF generation
   - Batch processing

4. **Enhanced UI/UX**
   - Professional styling
   - Dark mode support
   - Progress indicators
   - Search and filtering

5. **Research Quality Features**
   - Multiple research attempts with quality scoring
   - Reference validation
   - Fact-checking integration

## Technical Specifications

### API Contract
```typescript
interface ResearchRequest {
  company: string;
  partner: string;
  year?: string;
  status?: string;
  notes?: string;
}

interface CaseStudyResponse {
  title: string;
  summary: string;
  introduction: string;
  challenge: string;
  solution: string;
  implementation: string;
  results_and_business_impact: string;
  future_directions: string;
  metadata: {
    algorithms: string[];
    industries: string[];
    personas: string[];
    references: Reference[];
    confidence_score: number;
  };
}
```

### Data Flow
1. **Input**: CSV with columns: `id`, `quantum_company`, `commercial_partner`, `status`, `year`, `notes`
2. **Processing**: Claude AI research with structured prompting
3. **Output**: Structured case study with metadata
4. **Storage**: localStorage with versioning

### Quality Standards
- **Research Depth**: Minimum 500 words per section
- **Accuracy**: Factual claims must be verifiable
- **Structure**: Consistent format across all case studies
- **Metadata**: At least 3 algorithms, 2 industries, 3 personas identified

## Implementation Plan

### Week 1 Tasks
- [ ] Set up basic Node.js backend with Express
- [ ] Implement single Claude API call endpoint
- [ ] Create test HTML page for API validation
- [ ] Test with 3 real partnerships
- [ ] Document API response patterns
- [ ] Make architecture decisions

### Week 2 Tasks
- [ ] Build React frontend with CSV loading
- [ ] Implement partnership selection UI
- [ ] Connect to backend API
- [ ] Build case study display component
- [ ] Add loading states and error handling
- [ ] Test end-to-end workflow

### Week 3+ Tasks
- [ ] Add localStorage caching
- [ ] Implement regeneration feature
- [ ] Build metadata extraction
- [ ] Add export functionality
- [ ] Polish UI/UX
- [ ] Add batch processing

## Success Metrics
- **Quality**: Case studies are factually accurate and comprehensive
- **Performance**: <30 seconds per case study generation
- **Reliability**: <5% failure rate on research generation
- **Cost**: <$2 per case study in API costs
- **Usability**: Non-technical users can operate the tool

## Risk Mitigation
1. **API Costs**: Implement usage tracking and limits
2. **Rate Limiting**: Add retry logic with exponential backoff
3. **Quality Control**: Validate research against known facts
4. **Performance**: Cache results and implement pagination
5. **Reliability**: Graceful degradation when API unavailable

---

This PRD prioritizes proving the core concept first, then building around the reality of what Claude AI can actually deliver. We'll know within a week if this product concept is viable.