import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useMetadataStore = create(
  devtools(
    (set, get) => ({
      // State
      basicMetadata: {}, // { partnershipId: { algorithms, industries, personas, confidence_score } }
      advancedMetadata: {}, // { partnershipId: { algorithms, industries, personas, quantum_hardware, quantum_software, hardware_details, confidence_score, analysis_notes, _analyzed, _analyzedAt } }
      analyzing: false,
      error: null,

      // Actions for Basic Metadata
      setBasicMetadata: (partnershipId, metadata) => {
        console.log('📋 Setting basic metadata in store:', partnershipId, metadata)
        set(state => ({
          basicMetadata: { ...state.basicMetadata, [partnershipId]: metadata }
        }))
      },

      // Actions for Advanced Metadata
      setAdvancedMetadata: (partnershipId, metadata) => {
        console.log('🔬 Setting advanced metadata in store:', partnershipId, metadata)
        set(state => ({
          advancedMetadata: { ...state.advancedMetadata, [partnershipId]: metadata }
        }))
      },
      
      // Generic setter for session persistence
      setMetadata: (partnershipId, metadata) => {
        // Set both basic and advanced metadata for compatibility
        if (metadata) {
          get().setBasicMetadata(partnershipId, metadata);
          get().setAdvancedMetadata(partnershipId, metadata);
        }
      },
      
      // Generic getter for session persistence
      getMetadata: (partnershipId) => {
        const advanced = get().advancedMetadata[partnershipId];
        const basic = get().basicMetadata[partnershipId];
        // Prefer advanced metadata if available
        return advanced || basic || null;
      },

      analyzeMetadata: async (partnership, caseStudy, referenceLists, selectedModel) => {
        const partnershipId = partnership.id

        if (!caseStudy) {
          throw new Error('Case study is required for metadata analysis')
        }

        if (!partnership) {
          console.error('Invalid partnership data for analysis:', partnership)
          throw new Error('Invalid partnership data. Cannot analyze case study.')
        }
        
        set({ analyzing: true, error: null })

        try {
          console.log('🔍 Starting metadata analysis for:', partnership.company || partnership.quantum_company, '+', partnership.partner || partnership.commercial_partner)
          console.log('🔍 Reference lists at analysis time:')
          console.log('- Algorithms count:', referenceLists.algorithms?.length || 0)
          console.log('- Industries count:', referenceLists.industries?.length || 0)
          console.log('- Personas count:', referenceLists.personas?.length || 0)
          
          const prompt = `You are analyzing a quantum computing case study. Your task is to analyze the content for algorithms, industries, personas, and discover quantum hardware/software platforms used.

CASE STUDY TO ANALYZE:
Title: ${caseStudy.title}
Summary: ${caseStudy.summary || ''}
Introduction: ${caseStudy.introduction || ''}
Challenge: ${caseStudy.challenge || ''}
Solution: ${caseStudy.solution || ''}
Implementation: ${caseStudy.implementation || ''}
Results: ${caseStudy.results_and_business_impact || ''}
Future: ${caseStudy.future_directions || ''}

REFERENCE LISTS TO MATCH AGAINST:
Algorithms: ${referenceLists.algorithms?.join(', ') || 'No algorithms loaded'}
Industries: ${referenceLists.industries?.join(', ') || 'No industries loaded'}
Personas: ${referenceLists.personas?.join(', ') || 'No personas loaded'}

Your task is to analyze the case study content and return ONLY a JSON object with these exact fields:

{
  "algorithms": ["algorithm1", "algorithm2"],
  "industries": ["industry1", "industry2"], 
  "personas": ["persona1", "persona2"],
  "quantum_hardware": ["IBM Quantum System One", "IonQ Aria"],
  "quantum_software": ["Qiskit", "Cirq", "PennyLane"],
  "hardware_details": {
    "platform": "IBM Quantum",
    "qubit_type": "superconducting",
    "qubit_count": 127
  },
  "confidence_score": 0.85,
  "analysis_notes": "Brief notes about the analysis and any assumptions made"
}

ANALYSIS RULES:
1. Algorithms/Industries/Personas: ONLY include items from the reference lists above
2. Quantum Hardware/Software: DISCOVER and extract any quantum computing platforms, systems, or SDKs mentioned
3. Hardware Details: Extract technical specifications if mentioned (platform, qubit type/count)
4. If no clear matches/discoveries are found, return empty arrays [] or empty objects {}
5. Confidence score should be between 0.0 and 1.0
6. Analysis notes should be 1-2 sentences maximum

Return ONLY the JSON object above with your analysis results.`;

          console.log('🚀 Sending analysis request to API...')
          
          const response = await fetch('http://localhost:3556/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caseStudy: caseStudy,
              analysisPrompt: prompt,
              model: selectedModel
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Analysis request failed: ${response.status}`)
          }

          const data = await response.json()
          console.log('📊 Analysis API response:', data)

          const analysisResult = data.analysis || {}
          
          // Create enhanced metadata object
          const enhancedMetadata = {
            algorithms: analysisResult.algorithms || [],
            industries: analysisResult.industries || [],
            personas: analysisResult.personas || [],
            quantum_hardware: analysisResult.quantum_hardware || [],
            quantum_software: analysisResult.quantum_software || [],
            hardware_details: analysisResult.hardware_details || {},
            confidence_score: analysisResult.confidence_score || 0.8,
            analysis_notes: analysisResult.analysis_notes || '',
            _analyzed: true,
            _analyzedAt: new Date().toISOString()
          }

          // Store the advanced metadata
          get().setAdvancedMetadata(partnershipId, enhancedMetadata)
          set({ analyzing: false })

          console.log('✅ Metadata analysis completed successfully')
          return enhancedMetadata

        } catch (error) {
          console.error('❌ Error analyzing metadata:', error)
          set({ error: error.message, analyzing: false })
          throw error
        }
      },

      clearError: () => set({ error: null }),

      // Selectors
      getBasicMetadata: (partnershipId) => {
        return get().basicMetadata[partnershipId] || null
      },

      getAdvancedMetadata: (partnershipId) => {
        return get().advancedMetadata[partnershipId] || null
      },

      hasBasicMetadata: (partnershipId) => {
        return !!get().basicMetadata[partnershipId]
      },

      hasAdvancedMetadata: (partnershipId) => {
        return !!get().advancedMetadata[partnershipId]
      },

      getAllBasicMetadata: () => get().basicMetadata,
      getAllAdvancedMetadata: () => get().advancedMetadata
    }),
    {
      name: 'metadata-store', // Name for devtools
    }
  )
)