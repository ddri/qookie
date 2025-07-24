# Qookie to OpenQase Import Specification v1.0

## Overview

This specification defines the JSON export format from Qookie (quantum case study processor) that OpenQase can import. The format follows OpenQase's requirements while preserving all research data, metadata, and quality indicators from Qookie's processing pipeline.

## Export File Format

### File Details
- **Format**: JSON (.json)
- **Encoding**: UTF-8
- **Naming Convention**: `qookie-openqase-export-[ISO-timestamp].json`
- **Example**: `qookie-openqase-export-2025-01-24T10-30-00.json`

### Root Structure

```json
{
  "export_metadata": {
    "export_version": "1.0",
    "export_date": "2025-01-24T10:30:00Z",
    "total_items": 45,
    "export_type": "batch",
    "source": "qookie"
  },
  "case_studies": [
    // Array of case study objects
  ]
}
```

## Case Study Object Schema

### Required Fields

```json
{
  "id": "string",              // Unique identifier from Qookie
  "slug": "string",            // URL-friendly identifier
  "title": "string",           // Case study title
  "summary": "string",         // Executive summary (200-400 words)
  "main_content": {            // Structured content sections
    "introduction": "string",
    "challenge": "string", 
    "solution": "string",
    "implementation": "string",
    "results": "string",
    "future": "string",
    "technical": "string"
  },
  "companies": {               // Partnership details
    "quantum_provider": "string",
    "commercial_partner": "string", 
    "year": number|null
  },
  "categories": {              // Taxonomy classifications
    "industries": ["string"],
    "algorithms": ["string"], 
    "personas": ["string"],
    "technologies": {
      "hardware": ["string"],
      "software": ["string"]
    }
  },
  "references": [              // Academic and industry references
    {
      "title": "string",
      "url": "string",
      "type": "string",
      "date": "string|null"
    }
  ],
  "metadata": {                // Quality and processing metadata
    "word_count": number,
    "research_date": "ISO-8601-string",
    "confidence_level": "high|medium|low",
    "data_sources": ["string"],
    "last_updated": "ISO-8601-string"
  }
}
```

## Data Mapping Details

### Content Structure Transformation

Qookie's flat content fields are mapped to OpenQase's `main_content` structure:

| Qookie Field | OpenQase Field |
|--------------|----------------|
| `introduction` → | `main_content.introduction` |
| `challenge` → | `main_content.challenge` |
| `solution` → | `main_content.solution` |
| `implementation` → | `main_content.implementation` |
| `results_and_business_impact` → | `main_content.results` |
| `future_directions` → | `main_content.future` |
| `technical_details` → | `main_content.technical` |

### Metadata Sources

Qookie provides metadata from multiple analysis stages:

1. **Basic Metadata**: `metadata.{algorithms, industries, personas}`
2. **Advanced Metadata**: `metadata.advancedMetadata.{algorithms, industries, personas, quantum_hardware, quantum_software}`
3. **Confidence Scoring**: Numerical confidence converted to high/medium/low levels

### Technology Categorization

```json
"technologies": {
  "hardware": [
    "IBM Quantum System One",
    "Rigetti Aspen-M",
    "IonQ Forte"
  ],
  "software": [
    "Qiskit",
    "Cirq", 
    "PennyLane",
    "Quantum Circuit Optimizer"
  ]
}
```

### Reference Consolidation

Qookie maintains two reference types that are merged:

1. **Academic References**: Scientific papers and journals
2. **Further Reading**: News articles, blog posts, press releases

Both are combined into the unified `references` array with appropriate typing.

## Quality Indicators

### Confidence Level Mapping

```javascript
// Qookie confidence score → OpenQase confidence level
score >= 0.8 → "high"
0.5 <= score < 0.8 → "medium" 
score < 0.5 → "low"
```

### Data Source Detection

The export automatically detects and categorizes data sources:

- `academic_paper`: When references include journal publications
- `press_release`: When further reading includes press releases
- `company_blog`: When further reading includes blog posts
- `general_research`: Default fallback category

### Word Count Calculation

Calculated from all `main_content` sections plus the summary:
```javascript
const contentText = Object.values(main_content).join(' ') + summary;
const word_count = contentText.split(/\s+/).filter(word => word.length > 0).length;
```

## ID and Slug Generation

### ID Generation Logic
```javascript
const id = partnership.id || `${company}-${partner}-${year || 'unknown'}`;
```

### Slug Generation Logic
```javascript
const slug = `${company}-${partner}-quantum-partnership`
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
```

## Import Validation Requirements

### Required Validation Checks

1. **Schema Validation**: Verify all required fields are present
2. **Content Validation**: Ensure main_content has all 7 sections
3. **Company Validation**: Verify quantum_provider and commercial_partner exist
4. **Reference Validation**: Check URLs are valid format
5. **Date Validation**: Ensure ISO-8601 format for timestamps
6. **Category Validation**: Verify arrays are properly formatted

### Error Handling Recommendations

- **Missing Required Fields**: Log error with field name and case study ID
- **Invalid URLs**: Mark reference as invalid but continue import
- **Invalid Dates**: Use current timestamp as fallback
- **Empty Content Sections**: Allow empty strings but log warnings

## Sample Complete Export

```json
{
  "export_metadata": {
    "export_version": "1.0",
    "export_date": "2025-01-24T10:30:00Z",
    "total_items": 1,
    "export_type": "batch",
    "source": "qookie"
  },
  "case_studies": [
    {
      "id": "ibm-mercedes-benz-2024",
      "slug": "ibm-mercedes-benz-quantum-partnership",
      "title": "IBM and Mercedes-Benz: Quantum Computing Partnership",
      "summary": "Strategic partnership leveraging quantum computing for automotive optimization challenges including supply chain, route optimization, and materials science applications.",
      "main_content": {
        "introduction": "IBM and Mercedes-Benz announced a comprehensive quantum computing partnership in 2024...",
        "challenge": "Mercedes-Benz faced complex optimization challenges in manufacturing and logistics...",
        "solution": "The partnership leverages IBM's quantum hardware and software stack...",
        "implementation": "Implementation began with proof-of-concept projects in logistics optimization...",
        "results": "Initial results showed 15% improvement in route optimization algorithms...",
        "future": "The partnership plans to expand into materials science and battery chemistry...",
        "technical": "The implementation uses IBM Quantum System One with Qiskit development framework..."
      },
      "companies": {
        "quantum_provider": "IBM",
        "commercial_partner": "Mercedes-Benz",
        "year": 2024
      },
      "categories": {
        "industries": ["Automotive", "Manufacturing", "Logistics"],
        "algorithms": ["Quantum Optimization", "Variational Quantum Algorithms", "QAOA"],
        "personas": ["CTO", "Technical Architect", "Head of Innovation"],
        "technologies": {
          "hardware": ["IBM Quantum System One"],
          "software": ["Qiskit", "Quantum Network APIs"]
        }
      },
      "references": [
        {
          "title": "IBM Quantum Network Partnership Announcement",
          "url": "https://www.ibm.com/quantum/news/mercedes-benz-partnership",
          "type": "press_release",
          "date": "2024-01-15"
        },
        {
          "title": "Quantum Computing in Automotive Manufacturing",
          "url": "https://example.com/quantum-automotive-research",
          "type": "academic_paper",
          "date": "2024"
        }
      ],
      "metadata": {
        "word_count": 2847,
        "research_date": "2025-01-20T08:00:00Z",
        "confidence_level": "high",
        "data_sources": ["press_release", "academic_paper", "company_blog"],
        "last_updated": "2025-01-24T10:30:00Z"
      }
    }
  ]
}
```

## Implementation Notes for OpenQase

### Import Processing Order

1. **Validate Export Metadata**: Check version compatibility and source
2. **Validate Case Study Schema**: Ensure all required fields present
3. **Process Content Sections**: Import main_content into appropriate fields
4. **Map Categories**: Transform to OpenQase taxonomy if needed
5. **Import References**: Create reference records with proper linking
6. **Set Quality Metadata**: Store confidence levels and data sources
7. **Generate OpenQase IDs**: Create internal IDs while preserving Qookie IDs for tracking

### Recommended Import Settings

- **Batch Size**: Process 10-25 case studies per batch to avoid memory issues
- **Validation Level**: Strict validation with detailed error logging
- **Duplicate Handling**: Check for existing case studies by slug before import
- **Reference Processing**: Validate URLs and create backlinks where appropriate
- **Taxonomy Mapping**: Map Qookie categories to OpenQase taxonomy standards

### Success Metrics

- **Import Success Rate**: Target >95% successful imports per batch
- **Data Completeness**: All 7 main_content sections should have content
- **Reference Integrity**: All URLs should be accessible or marked as archived
- **Category Accuracy**: Taxonomy should align with OpenQase standards

## Version History

- **v1.0** (2025-01-24): Initial specification for Qookie-OpenQase integration

---

**Contact**: For questions about this specification or the Qookie export format, refer to the Qookie codebase documentation in `/CLAUDE.md` or the export function implementation in `/src/App.jsx:1075`.