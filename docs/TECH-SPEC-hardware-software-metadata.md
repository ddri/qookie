# Technical Specification: Quantum Hardware & Software Metadata

## Executive Summary
Extend the advanced metadata system to capture and analyze quantum hardware and software platforms used in case studies through a discovery-first approach.

## Architecture Overview

### Current State
- **Metadata Store**: `useMetadataStore.js` manages algorithms, industries, personas
- **Analysis Flow**: Case study → Analysis prompt → Metadata extraction
- **Reference System**: Static reference lists for matching

### Proposed Changes

#### 1. Schema Extension
```javascript
// Current advanced metadata structure
{
  algorithms: string[],
  industries: string[], 
  personas: string[],
  confidence_score: number,
  analysis_notes: string,
  _analyzed: boolean,
  _analyzedAt: string
}

// Extended structure (backward compatible)
{
  algorithms: string[],
  industries: string[],
  personas: string[],
  quantum_hardware: string[],      // NEW: e.g., ["IBM Quantum System One", "IonQ Aria"]
  quantum_software: string[],      // NEW: e.g., ["Qiskit", "Cirq", "PennyLane"]
  hardware_details: {              // NEW: Optional structured details
    platform?: string,
    qubit_type?: string,
    qubit_count?: number
  },
  confidence_score: number,
  analysis_notes: string,
  _analyzed: boolean,
  _analyzedAt: string
}
```

#### 2. Discovery Mode Implementation
```javascript
// Phase 1: Pure discovery (no reference matching)
"quantum_hardware": ["Extract any quantum hardware platforms mentioned"],
"quantum_software": ["Extract any quantum software/SDKs mentioned"],

// Phase 2: Hybrid mode (discovery + optional matching)
"quantum_hardware": matchOrDiscover(content, referenceHardware),
"quantum_software": matchOrDiscover(content, referenceSoftware),
```

## Implementation Plan

### Phase 1: Foundation (Current Sprint)

#### 1.1 Update Metadata Store (`useMetadataStore.js`)
- Add new fields to state interface
- Maintain backward compatibility
- No breaking changes to existing consumers

#### 1.2 Modify Analysis Prompt
- Extend prompt in `analyzeMetadata` function (line 50)
- Add extraction rules for hardware/software
- Include fallback for when no hardware/software found

#### 1.3 Create Seed Reference Lists
```markdown
# /public/reference/ReferenceListQuantumHardware.md
## Superconducting Quantum Computers
- IBM Quantum System One
- IBM Quantum System Two
- Google Sycamore
- Rigetti Aspen-M-3

## Trapped Ion Quantum Computers
- IonQ Aria
- IonQ Forte
- Quantinuum H-Series
- Alpine Quantum Technologies

## Quantum Annealers
- D-Wave Advantage
- D-Wave 2000Q

## Other Platforms
- Xanadu X-Series (photonic)
- QuEra Aquila (neutral atom)
```

### Phase 2: UI Integration

#### 2.1 Update Display Component (`App.jsx`)
- Add hardware/software display in advanced metadata section
- Use existing dark mode styles
- Maintain responsive layout

#### 2.2 Export Enhancement
- Include hardware/software in markdown exports
- Update JSON export structure

### Phase 3: Intelligence Layer

#### 3.1 Discovery Analytics
- Track discovered hardware/software across case studies
- Build frequency maps for future reference list curation
- Identify emerging platforms

## API Contract Changes

### Analysis Endpoint Request
No changes - existing structure maintained

### Analysis Response
```javascript
{
  "analysis": {
    "algorithms": [...],
    "industries": [...],
    "personas": [...],
    "quantum_hardware": ["IBM Quantum System One", "Qiskit Runtime"],  // NEW
    "quantum_software": ["Qiskit", "Qiskit Aer"],                      // NEW
    "hardware_details": {                                               // NEW
      "platform": "IBM Quantum",
      "qubit_type": "superconducting",
      "qubit_count": 127
    },
    "confidence_score": 0.85,
    "analysis_notes": "..."
  }
}
```

## Risk Assessment

### Low Risk
- All changes are additive
- Backward compatibility maintained
- No database migrations required

### Mitigation Strategies
- Feature flag: `ENABLE_HARDWARE_SOFTWARE_METADATA`
- Gradual rollout by partnership
- Comprehensive logging for discovery validation

## Success Criteria
1. Hardware identified in 80%+ of analyzed case studies
2. Software/SDK identified in 70%+ of analyzed case studies  
3. Zero regression in existing metadata functionality
4. Analysis time increase <10%

## Timeline
- Week 1: Core implementation (store, analysis, reference lists)
- Week 2: UI integration and testing
- Week 3: Monitoring and optimization

## Future Enhancements
1. Auto-population of reference lists from discoveries
2. Hardware specification matching (qubit counts, architectures)
3. Software version tracking
4. Hardware/software compatibility matrix