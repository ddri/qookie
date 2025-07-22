import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useReferencesStore = create(
  devtools(
    (set, get) => ({
      // State
      references: {}, // { partnershipId: [{ title, authors, journal, year, url, citation }] }
      furtherReading: {}, // { partnershipId: [{ title, source, url, type, date, description }] }
      collectionNotes: {}, // { partnershipId: "notes about collection process" }
      collecting: false,
      error: null,

      // Actions
      setReferences: (partnershipId, refs) => {
        console.log('📚 Setting references in store:', partnershipId, refs)
        set(state => ({
          references: { ...state.references, [partnershipId]: refs }
        }))
      },

      setFurtherReading: (partnershipId, reading) => {
        console.log('📖 Setting further reading in store:', partnershipId, reading)
        set(state => ({
          furtherReading: { ...state.furtherReading, [partnershipId]: reading }
        }))
      },

      setCollectionNotes: (partnershipId, notes) => {
        console.log('📝 Setting collection notes in store:', partnershipId, notes)
        set(state => ({
          collectionNotes: { ...state.collectionNotes, [partnershipId]: notes }
        }))
      },

      collectReferences: async (partnership, caseStudy) => {
        const partnershipId = partnership.id

        if (!caseStudy) {
          throw new Error('Case study is required for references collection')
        }

        set({ collecting: true, error: null })

        try {
          console.log('🔍 Starting references collection for:', partnership.company, '+', partnership.partner)
          
          // Step 1: Search for academic papers
          const academicQuery = `"${partnership.company}" "${partnership.partner}" quantum computing research paper`
          console.log('Searching for academic papers:', academicQuery)
          
          const academicResponse = await fetch('http://localhost:3556/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: academicQuery,
              type: 'academic'
            })
          })
          
          if (!academicResponse.ok) {
            throw new Error(`Academic search failed: ${academicResponse.status}`)
          }
          
          const academicData = await academicResponse.json()
          console.log('Academic search results:', academicData)
          
          // Step 2: Search for business coverage
          const businessQuery = `"${partnership.company}" "${partnership.partner}" partnership announcement blog press release`
          console.log('Searching for business coverage:', businessQuery)
          
          const businessResponse = await fetch('http://localhost:3556/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: businessQuery,
              type: 'business'
            })
          })
          
          if (!businessResponse.ok) {
            throw new Error(`Business search failed: ${businessResponse.status}`)
          }
          
          const businessData = await businessResponse.json()
          console.log('Business search results:', businessData)
          
          // Step 3: Use Claude to curate references from search results
          const referencesResponse = await fetch('http://localhost:3556/api/references', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              academicData: academicData,
              businessData: businessData,
              caseStudy: caseStudy,
              model: 'claude-sonnet-4-20250514' // TODO: Make this configurable
            })
          })
          
          if (!referencesResponse.ok) {
            const errorData = await referencesResponse.json()
            throw new Error(errorData.error || `References API failed: ${referencesResponse.status}`)
          }
          
          const referencesResult = await referencesResponse.json()
          console.log('References API response:', referencesResult)
          
          // Store the collected data
          const refs = referencesResult.references?.references || []
          const reading = referencesResult.references?.further_reading || []
          const notes = referencesResult.references?.collection_notes || ''
          
          get().setReferences(partnershipId, refs)
          get().setFurtherReading(partnershipId, reading)
          get().setCollectionNotes(partnershipId, notes)
          
          // Mark as collected with timestamp
          set(state => ({
            [`${partnershipId}_collected`]: true,
            [`${partnershipId}_collectedAt`]: new Date().toISOString(),
            collecting: false
          }))

          console.log('✅ References collection completed successfully')
          console.log('- Academic references:', refs.length)
          console.log('- Business references:', reading.length)
          
          return {
            references: refs,
            furtherReading: reading,
            collectionNotes: notes
          }

        } catch (error) {
          console.error('❌ Error collecting references:', error)
          set({ error: error.message, collecting: false })
          throw error
        }
      },

      clearError: () => set({ error: null }),

      // Selectors
      getReferences: (partnershipId) => {
        return get().references[partnershipId] || []
      },

      getFurtherReading: (partnershipId) => {
        return get().furtherReading[partnershipId] || []
      },

      getCollectionNotes: (partnershipId) => {
        return get().collectionNotes[partnershipId] || ''
      },

      hasReferences: (partnershipId) => {
        const refs = get().references[partnershipId]
        return refs && refs.length > 0
      },

      hasFurtherReading: (partnershipId) => {
        const reading = get().furtherReading[partnershipId]
        return reading && reading.length > 0
      },

      isCollected: (partnershipId) => {
        return !!get()[`${partnershipId}_collected`]
      },

      getCollectedAt: (partnershipId) => {
        return get()[`${partnershipId}_collectedAt`] || null
      },

      getAllReferences: () => get().references,
      getAllFurtherReading: () => get().furtherReading,
      getAllCollectionNotes: () => get().collectionNotes
    }),
    {
      name: 'references-store', // Name for devtools
    }
  )
)