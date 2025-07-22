import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useCaseStudyStore = create(
  devtools(
    (set, get) => ({
      // State
      caseStudies: {},
      loading: false,
      error: null,

      // Actions
      setCaseStudy: (partnershipId, caseStudy) => {
        console.log('📦 Setting case study in store:', partnershipId, caseStudy)
        set(state => ({
          caseStudies: { ...state.caseStudies, [partnershipId]: caseStudy }
        }))
      },

      updateCaseStudy: (partnershipId, updates) => {
        console.log('🔄 Updating case study in store:', partnershipId, updates)
        set(state => ({
          caseStudies: {
            ...state.caseStudies,
            [partnershipId]: {
              ...state.caseStudies[partnershipId],
              ...updates
            }
          }
        }))
      },

      generateCaseStudy: async (partnership, selectedModel, forceRegenerate = false) => {
        const partnershipId = partnership.id

        // Check for cached version first (unless force regenerating)
        if (!forceRegenerate) {
          const existing = get().getCaseStudy(partnershipId)
          if (existing) {
            console.log('📋 Using existing case study for:', partnershipId)
            return existing
          }
        }

        set({ loading: true, error: null })
        
        try {
          console.log('🔬 Generating case study for:', partnership, 'forceRegenerate:', forceRegenerate)
          
          const response = await fetch('http://localhost:3556/api/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company: partnership.company,
              partner: partnership.partner,
              year: partnership.year || '',
              notes: partnership.notes || '',
              model: selectedModel
            })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'API request failed')
          }

          // Store the new case study
          get().setCaseStudy(partnershipId, data.caseStudy)
          
          // Extract and store basic metadata if it exists
          if (data.caseStudy.metadata) {
            // Import metadata store and set basic metadata
            const { useMetadataStore } = await import('./useMetadataStore')
            useMetadataStore.getState().setBasicMetadata(partnershipId, data.caseStudy.metadata)
          }
          
          set({ loading: false })
          
          console.log('✅ Case study generated and stored successfully')
          return data.caseStudy

        } catch (error) {
          console.error('❌ Error generating case study:', error)
          set({ error: error.message, loading: false })
          throw error
        }
      },

      regenerateCaseStudy: async (partnership, selectedModel) => {
        const partnershipId = partnership.id
        const existingCaseStudy = get().getCaseStudy(partnershipId)
        
        set({ loading: true, error: null })
        
        try {
          console.log('🔄 Regenerating case study for:', partnership)
          
          const response = await fetch('http://localhost:3556/api/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company: partnership.company,
              partner: partnership.partner,
              year: partnership.year || '',
              notes: partnership.notes || '',
              model: selectedModel
            })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'API request failed')
          }

          // Preserve existing metadata/references when regenerating content
          const updatedCaseStudy = existingCaseStudy ? {
            ...existingCaseStudy, // Keep existing advanced metadata, references, etc.
            ...data.caseStudy,    // Update with new case study content
            // Explicitly preserve fields that shouldn't be overwritten
            advancedMetadata: existingCaseStudy.advancedMetadata,
            references: existingCaseStudy.references,
            furtherReading: existingCaseStudy.furtherReading,
            _referencesCollected: existingCaseStudy._referencesCollected
          } : data.caseStudy

          get().setCaseStudy(partnershipId, updatedCaseStudy)
          
          // Extract and store basic metadata if it exists
          if (data.caseStudy.metadata) {
            // Import metadata store and set basic metadata
            const { useMetadataStore } = await import('./useMetadataStore')
            useMetadataStore.getState().setBasicMetadata(partnershipId, data.caseStudy.metadata)
          }
          
          set({ loading: false })
          
          console.log('✅ Case study regenerated successfully')
          return updatedCaseStudy

        } catch (error) {
          console.error('❌ Error regenerating case study:', error)
          set({ error: error.message, loading: false })
          throw error
        }
      },

      clearError: () => set({ error: null }),

      // Selectors
      getCaseStudy: (partnershipId) => {
        const caseStudy = get().caseStudies[partnershipId]
        return caseStudy || null
      },

      getAllCaseStudies: () => get().caseStudies,

      hasCaseStudy: (partnershipId) => {
        return !!get().caseStudies[partnershipId]
      }
    }),
    {
      name: 'case-study-store', // Name for devtools
    }
  )
)