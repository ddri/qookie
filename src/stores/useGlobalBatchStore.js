import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useGlobalBatchStore = create(
  devtools(
    (set, get) => ({
      // State
      isRunning: false,
      isPaused: false,
      totalPartnerships: 0,
      currentPartnershipIndex: 0,
      processedCount: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      
      // Current partnership being processed
      currentPartnership: null,
      currentPartnershipProgress: null, // Will track the 3-step progress for current partnership
      
      // Queue and tracking
      queue: [], // Array of partnerships to process
      completed: [], // Array of {partnership, status, result, logs, timestamp}
      errors: [], // Array of {partnership, error, timestamp, step}
      
      // Logs for reporting
      sessionLogs: [], // Detailed logs for the entire session
      startTime: null,
      endTime: null,
      
      // Configuration
      delayBetweenPartnerships: 2000, // 2 second delay between partnerships
      maxRetries: 1, // How many times to retry a failed partnership
      
      // Actions
      initializeGlobalBatch: (partnerships, selectedModel) => {
        console.log('🌍 Initializing global batch processing for', partnerships.length, 'partnerships')
        
        const now = new Date().toISOString()
        set({
          queue: [...partnerships],
          totalPartnerships: partnerships.length,
          currentPartnershipIndex: 0,
          processedCount: 0,
          successCount: 0,
          errorCount: 0,
          skippedCount: 0,
          completed: [],
          errors: [],
          sessionLogs: [{
            timestamp: now,
            level: 'info',
            message: `Global batch processing initialized for ${partnerships.length} partnerships`,
            data: { model: selectedModel, totalCount: partnerships.length }
          }],
          startTime: now,
          endTime: null,
          currentPartnership: null,
          currentPartnershipProgress: null
        })
      },

      startGlobalBatch: () => {
        console.log('🚀 Starting global batch processing')
        set({ isRunning: true, isPaused: false })
        
        get().addLog('info', 'Global batch processing started')
      },

      pauseGlobalBatch: () => {
        console.log('⏸️ Pausing global batch processing')
        set({ isPaused: true })
        get().addLog('info', 'Global batch processing paused by user')
      },

      resumeGlobalBatch: () => {
        console.log('▶️ Resuming global batch processing')
        set({ isPaused: false })
        get().addLog('info', 'Global batch processing resumed')
      },

      stopGlobalBatch: () => {
        console.log('🛑 Stopping global batch processing')
        const now = new Date().toISOString()
        set({ 
          isRunning: false, 
          isPaused: false,
          endTime: now,
          currentPartnership: null,
          currentPartnershipProgress: null
        })
        get().addLog('info', 'Global batch processing stopped by user')
      },

      setCurrentPartnership: (partnership) => {
        console.log('📋 Processing partnership:', partnership.company, '+', partnership.partner)
        set(state => ({
          currentPartnership: partnership,
          currentPartnershipIndex: state.processedCount,
          currentPartnershipProgress: {
            caseStudy: 'pending',
            metadata: 'pending', 
            references: 'pending'
          }
        }))
        
        get().addLog('info', `Starting processing for ${partnership.company} + ${partnership.partner}`, {
          partnershipId: partnership.id,
          index: get().processedCount + 1,
          total: get().totalPartnerships
        })
      },

      updateCurrentPartnershipProgress: (step, status, error = null) => {
        const stepNames = {
          1: 'caseStudy',
          2: 'metadata', 
          3: 'references'
        }
        
        const stepName = stepNames[step]
        if (!stepName) return
        
        console.log(`📊 Partnership step ${step} (${stepName}): ${status}`)
        
        set(state => ({
          currentPartnershipProgress: {
            ...state.currentPartnershipProgress,
            [stepName]: status
          }
        }))

        const level = status === 'error' ? 'error' : 'info'
        const message = `Step ${step} (${stepName}): ${status}`
        get().addLog(level, message, { 
          step, 
          stepName, 
          status, 
          error: error?.message,
          partnershipId: get().currentPartnership?.id 
        })
      },

      completeCurrentPartnership: (result, status = 'success') => {
        const partnership = get().currentPartnership
        if (!partnership) return

        const now = new Date().toISOString()
        const completionData = {
          partnership,
          status, // 'success', 'error', 'skipped'
          result,
          timestamp: now,
          logs: get().sessionLogs.filter(log => 
            log.data?.partnershipId === partnership.id
          )
        }

        console.log(`✅ Partnership completed: ${partnership.company} + ${partnership.partner} (${status})`)

        set(state => ({
          completed: [...state.completed, completionData],
          processedCount: state.processedCount + 1,
          successCount: status === 'success' ? state.successCount + 1 : state.successCount,
          errorCount: status === 'error' ? state.errorCount + 1 : state.errorCount,
          skippedCount: status === 'skipped' ? state.skippedCount + 1 : state.skippedCount,
          currentPartnership: null,
          currentPartnershipProgress: null
        }))

        get().addLog('info', `Partnership completed: ${status}`, {
          partnershipId: partnership.id,
          status,
          processingTime: result?.processingTime
        })
      },

      recordError: (partnership, error, step = null) => {
        const now = new Date().toISOString()
        const errorData = {
          partnership,
          error: error.message,
          timestamp: now,
          step
        }

        console.error(`❌ Error in partnership ${partnership.company} + ${partnership.partner}:`, error)

        set(state => ({
          errors: [...state.errors, errorData]
        }))

        get().addLog('error', `Error in partnership processing: ${error.message}`, {
          partnershipId: partnership.id,
          step,
          error: error.message,
          stack: error.stack
        })
      },

      addLog: (level, message, data = {}) => {
        const now = new Date().toISOString()
        const logEntry = {
          timestamp: now,
          level, // 'info', 'warn', 'error', 'debug'
          message,
          data
        }

        set(state => ({
          sessionLogs: [...state.sessionLogs, logEntry]
        }))

        // Also log to console with appropriate level
        const consoleMethod = console[level] || console.log
        consoleMethod(`[GlobalBatch] ${message}`, data)
      },

      completeGlobalBatch: () => {
        const now = new Date().toISOString()
        console.log('🎉 Global batch processing completed!')
        
        set({ 
          isRunning: false, 
          isPaused: false,
          endTime: now 
        })

        const stats = get().getProcessingStats()
        get().addLog('info', 'Global batch processing completed', stats)
      },

      // Selectors and utilities
      getNextPartnership: () => {
        const state = get()
        return state.queue[state.processedCount] || null
      },

      hasMorePartnerships: () => {
        const state = get()
        return state.processedCount < state.totalPartnerships
      },

      getProgress: () => {
        const state = get()
        return {
          current: state.processedCount,
          total: state.totalPartnerships,
          percentage: state.totalPartnerships > 0 
            ? Math.round((state.processedCount / state.totalPartnerships) * 100)
            : 0
        }
      },

      getCurrentPartnershipProgress: () => {
        const progress = get().currentPartnershipProgress
        if (!progress) return { current: 0, total: 3, percentage: 0 }

        const completed = Object.values(progress).filter(status => status === 'completed').length
        return {
          current: completed,
          total: 3,
          percentage: Math.round((completed / 3) * 100)
        }
      },

      getProcessingStats: () => {
        const state = get()
        const duration = state.startTime && state.endTime 
          ? new Date(state.endTime) - new Date(state.startTime)
          : null

        return {
          total: state.totalPartnerships,
          processed: state.processedCount,
          success: state.successCount,
          errors: state.errorCount,
          skipped: state.skippedCount,
          duration: duration ? Math.round(duration / 1000) : null, // seconds
          startTime: state.startTime,
          endTime: state.endTime
        }
      },

      getErrorSummary: () => {
        const errors = get().errors
        return errors.map(error => ({
          partnership: `${error.partnership.company} + ${error.partnership.partner}`,
          error: error.error,
          step: error.step,
          timestamp: error.timestamp
        }))
      },

      getSessionReport: () => {
        const state = get()
        return {
          stats: get().getProcessingStats(),
          errors: get().getErrorSummary(),
          completed: state.completed.map(c => ({
            partnership: `${c.partnership.company} + ${c.partnership.partner}`,
            status: c.status,
            timestamp: c.timestamp
          })),
          logs: state.sessionLogs,
          configuration: {
            delayBetweenPartnerships: state.delayBetweenPartnerships,
            maxRetries: state.maxRetries
          }
        }
      },

      // Configuration
      setDelayBetweenPartnerships: (delay) => {
        set({ delayBetweenPartnerships: delay })
        get().addLog('info', `Delay between partnerships set to ${delay}ms`)
      },

      setMaxRetries: (retries) => {
        set({ maxRetries: retries })
        get().addLog('info', `Max retries set to ${retries}`)
      }
    }),
    {
      name: 'global-batch-store', // Name for devtools
    }
  )
)