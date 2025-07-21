import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useBatchStore = create(
  devtools(
    (set, get) => ({
      // State
      isRunning: false,
      currentStep: 0,
      totalSteps: 3,
      error: null,
      stepProgress: {
        1: { name: 'Case Study', status: 'pending', error: null },
        2: { name: 'Metadata Analysis', status: 'pending', error: null },
        3: { name: 'References Collection', status: 'pending', error: null }
      },

      // Actions
      startBatch: (partnership, selectedModel) => {
        console.log('🚀 Starting batch processing for:', partnership.company, '+', partnership.partner)
        set({
          isRunning: true,
          currentStep: 1,
          error: null,
          stepProgress: {
            1: { name: 'Case Study', status: 'pending', error: null },
            2: { name: 'Metadata Analysis', status: 'pending', error: null },
            3: { name: 'References Collection', status: 'pending', error: null }
          }
        })
      },

      setStepInProgress: (step) => {
        console.log(`📋 Step ${step} in progress:`, get().stepProgress[step].name)
        set(state => ({
          currentStep: step,
          stepProgress: {
            ...state.stepProgress,
            [step]: {
              ...state.stepProgress[step],
              status: 'in_progress',
              error: null
            }
          }
        }))
      },

      setStepCompleted: (step) => {
        console.log(`✅ Step ${step} completed:`, get().stepProgress[step].name)
        set(state => ({
          stepProgress: {
            ...state.stepProgress,
            [step]: {
              ...state.stepProgress[step],
              status: 'completed',
              error: null
            }
          }
        }))
      },

      setStepError: (step, error) => {
        console.error(`❌ Step ${step} failed:`, get().stepProgress[step].name, error)
        set(state => ({
          stepProgress: {
            ...state.stepProgress,
            [step]: {
              ...state.stepProgress[step],
              status: 'error',
              error: error.message
            }
          },
          error: error.message,
          isRunning: false
        }))
      },

      completeBatch: () => {
        console.log('🎉 Batch processing completed successfully!')
        set({
          isRunning: false,
          currentStep: 0,
          error: null
        })
      },

      stopBatch: () => {
        console.log('🛑 Batch processing stopped by user')
        set({
          isRunning: false,
          currentStep: 0,
          error: null,
          stepProgress: {
            1: { name: 'Case Study', status: 'pending', error: null },
            2: { name: 'Metadata Analysis', status: 'pending', error: null },
            3: { name: 'References Collection', status: 'pending', error: null }
          }
        })
      },

      clearError: () => set({ error: null }),

      // Selectors
      getStepStatus: (step) => {
        return get().stepProgress[step]?.status || 'pending'
      },

      getStepError: (step) => {
        return get().stepProgress[step]?.error || null
      },

      getProgress: () => {
        const steps = get().stepProgress
        const completedSteps = Object.values(steps).filter(step => step.status === 'completed').length
        return {
          completed: completedSteps,
          total: get().totalSteps,
          percentage: Math.round((completedSteps / get().totalSteps) * 100)
        }
      },

      canProceedToNextStep: (currentStep) => {
        const stepStatus = get().getStepStatus(currentStep)
        return stepStatus === 'completed'
      },

      getAllStepsCompleted: () => {
        const steps = get().stepProgress
        return Object.values(steps).every(step => step.status === 'completed')
      }
    }),
    {
      name: 'batch-store', // Name for devtools
    }
  )
)