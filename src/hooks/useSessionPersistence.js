import { useEffect, useCallback, useRef } from 'react';
import SessionPersistence from '../utils/SessionPersistence';
import { useCaseStudyStore, useMetadataStore, useReferencesStore, useGlobalBatchStore } from '../stores';

/**
 * Custom hook for managing session persistence
 */
export const useSessionPersistence = (partnerships, settings, darkMode) => {
  const autoSaveRef = useRef(null);
  
  // Store references
  const caseStudyStore = useCaseStudyStore();
  const metadataStore = useMetadataStore();
  const referencesStore = useReferencesStore();
  const globalBatchStore = useGlobalBatchStore();

  /**
   * Collect current state from all stores
   */
  const getCurrentState = useCallback(() => {
    // Get all case studies
    const caseStudies = {};
    const metadata = {};
    const references = {};
    const furtherReading = {};

    // Collect data for each partnership
    if (partnerships) {
      partnerships.forEach(partnership => {
        const id = partnership.id;
        
        // Get case study
        const caseStudy = caseStudyStore.getCaseStudy(id);
        if (caseStudy) {
          caseStudies[id] = caseStudy;
        }

        // Get metadata
        const meta = metadataStore.getMetadata(id);
        if (meta) {
          metadata[id] = meta;
        }

        // Get references
        const refs = referencesStore.getReferences(id);
        if (refs) {
          references[id] = refs;
        }

        // Get further reading
        const reading = referencesStore.furtherReading[id];
        if (reading) {
          furtherReading[id] = reading;
        }
      });
    }

    // Get batch processing state
    const globalBatchState = {
      isRunning: globalBatchStore.isRunning,
      isPaused: globalBatchStore.isPaused,
      processedCount: globalBatchStore.processedCount,
      totalPartnerships: globalBatchStore.totalPartnerships,
      successCount: globalBatchStore.successCount,
      errorCount: globalBatchStore.errorCount,
      currentPartnershipIndex: globalBatchStore.currentPartnershipIndex,
      queue: globalBatchStore.queue,
      completed: globalBatchStore.completed,
      errors: globalBatchStore.errors
    };

    return {
      partnerships,
      caseStudies,
      metadata,
      references,
      furtherReading,
      settings,
      darkMode,
      globalBatchProgress: globalBatchState,
      lastSaved: new Date().toISOString()
    };
  }, [partnerships, settings, darkMode, caseStudyStore, metadataStore, referencesStore, globalBatchStore]);

  /**
   * Save current session
   */
  const saveSession = useCallback(() => {
    const state = getCurrentState();
    const success = SessionPersistence.saveSession(state);
    
    if (success) {
      console.log('💾 Session saved with', Object.keys(state.caseStudies || {}).length, 'case studies');
    }
    
    return success;
  }, [getCurrentState]);

  /**
   * Load saved session
   */
  const loadSession = useCallback(() => {
    const sessionData = SessionPersistence.loadSession();
    
    if (!sessionData) {
      console.log('No saved session to load');
      return null;
    }

    // Restore case studies
    if (sessionData.caseStudies) {
      Object.entries(sessionData.caseStudies).forEach(([id, caseStudy]) => {
        caseStudyStore.setCaseStudy(id, caseStudy);
      });
      console.log('📚 Restored', Object.keys(sessionData.caseStudies).length, 'case studies');
    }

    // Restore metadata
    if (sessionData.metadata) {
      Object.entries(sessionData.metadata).forEach(([id, metadata]) => {
        metadataStore.setMetadata(id, metadata);
      });
      console.log('🏷️ Restored', Object.keys(sessionData.metadata).length, 'metadata entries');
    }

    // Restore references
    if (sessionData.references) {
      Object.entries(sessionData.references).forEach(([id, refs]) => {
        referencesStore.setReferences(id, refs);
      });
      console.log('📚 Restored', Object.keys(sessionData.references).length, 'reference sets');
    }

    // Restore further reading
    if (sessionData.furtherReading) {
      Object.entries(sessionData.furtherReading).forEach(([id, reading]) => {
        referencesStore.setFurtherReading(id, reading);
      });
    }

    // Restore global batch state if it was running
    if (sessionData.globalBatchProgress && sessionData.globalBatchProgress.isRunning) {
      console.log('🔄 Batch processing was interrupted - ready to resume');
      // Note: We don't automatically resume, but show a notification to the user
    }

    return sessionData;
  }, [caseStudyStore, metadataStore, referencesStore]);

  /**
   * Clear session
   */
  const clearSession = useCallback(() => {
    const confirmed = window.confirm('Are you sure you want to clear all saved data? This cannot be undone.');
    
    if (confirmed) {
      SessionPersistence.clearSession();
      
      // Clear store states
      caseStudyStore.caseStudies = {};
      caseStudyStore.loading = {};
      caseStudyStore.errors = {};
      
      metadataStore.metadata = {};
      metadataStore.analyzing = {};
      metadataStore.errors = {};
      
      referencesStore.references = {};
      referencesStore.furtherReading = {};
      referencesStore.collecting = {};
      referencesStore.errors = {};
      
      console.log('🗑️ All session data cleared');
      window.location.reload(); // Refresh to reset UI
    }
  }, [caseStudyStore, metadataStore, referencesStore]);

  /**
   * Export session to file
   */
  const exportSession = useCallback(() => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `qookie-session-${timestamp}.json`;
    SessionPersistence.exportSession(filename);
  }, []);

  /**
   * Import session from file
   */
  const importSession = useCallback(async (file) => {
    try {
      const sessionData = await SessionPersistence.importSession(file);
      // Reload the page to apply imported data
      window.location.reload();
      return sessionData;
    } catch (error) {
      console.error('Failed to import session:', error);
      alert('Failed to import session file. Please check the file format.');
      return null;
    }
  }, []);

  /**
   * Setup auto-save on mount
   */
  useEffect(() => {
    // Setup auto-save every 30 seconds
    const { startAutoSave, stopAutoSave } = SessionPersistence.setupAutoSave(getCurrentState, 30000);
    autoSaveRef.current = { startAutoSave, stopAutoSave };
    
    // Start auto-save
    startAutoSave();

    // Save on page unload
    const handleBeforeUnload = () => {
      saveSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      stopAutoSave();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [getCurrentState, saveSession]);

  /**
   * Get session info
   */
  const getSessionInfo = useCallback(() => {
    return SessionPersistence.getSessionInfo();
  }, []);

  return {
    saveSession,
    loadSession,
    clearSession,
    exportSession,
    importSession,
    getSessionInfo,
    hasSession: () => SessionPersistence.getSessionInfo() !== null
  };
};

export default useSessionPersistence;