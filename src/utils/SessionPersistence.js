/**
 * Session Persistence Utility
 * Saves and restores Qookie session state to/from localStorage
 */

const SESSION_STORAGE_KEY = 'qookie_session_state';
const SESSION_VERSION = '2.0';

export class SessionPersistence {
  /**
   * Save current session state to localStorage
   */
  static saveSession(data) {
    try {
      const sessionData = {
        version: SESSION_VERSION,
        timestamp: new Date().toISOString(),
        ...data
      };

      // Save to localStorage
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      
      // Also save individual stores for redundancy
      if (data.caseStudies) {
        Object.entries(data.caseStudies).forEach(([key, value]) => {
          localStorage.setItem(`case-study-${key}`, JSON.stringify(value));
        });
      }
      
      if (data.metadata) {
        Object.entries(data.metadata).forEach(([key, value]) => {
          localStorage.setItem(`metadata-${key}`, JSON.stringify(value));
        });
      }
      
      if (data.references) {
        Object.entries(data.references).forEach(([key, value]) => {
          localStorage.setItem(`references-${key}`, JSON.stringify(value));
        });
      }

      console.log('✅ Session saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      return false;
    }
  }

  /**
   * Load session state from localStorage
   */
  static loadSession() {
    try {
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionJson) {
        console.log('📭 No saved session found');
        return null;
      }

      const sessionData = JSON.parse(sessionJson);
      
      // Check version compatibility
      if (sessionData.version !== SESSION_VERSION) {
        console.warn('⚠️ Session version mismatch, may have compatibility issues');
      }

      console.log('✅ Session loaded from', sessionData.timestamp);
      return sessionData;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      return null;
    }
  }

  /**
   * Clear saved session
   */
  static clearSession() {
    try {
      // Remove main session
      localStorage.removeItem(SESSION_STORAGE_KEY);
      
      // Remove all case studies, metadata, and references
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('case-study-') ||
          key.startsWith('metadata-') ||
          key.startsWith('references-') ||
          key.startsWith('further-reading-')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('🗑️ Session cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
      return false;
    }
  }

  /**
   * Export session as downloadable JSON file
   */
  static exportSession(filename = 'qookie-session-backup.json') {
    try {
      const sessionData = this.loadSession();
      if (!sessionData) {
        console.warn('⚠️ No session to export');
        return false;
      }

      const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('💾 Session exported to', filename);
      return true;
    } catch (error) {
      console.error('❌ Failed to export session:', error);
      return false;
    }
  }

  /**
   * Import session from JSON file
   */
  static async importSession(file) {
    try {
      const text = await file.text();
      const sessionData = JSON.parse(text);
      
      // Validate session structure
      if (!sessionData.version || !sessionData.timestamp) {
        throw new Error('Invalid session file format');
      }

      // Save the imported session
      this.saveSession(sessionData);
      
      console.log('📥 Session imported from', file.name);
      return sessionData;
    } catch (error) {
      console.error('❌ Failed to import session:', error);
      throw error;
    }
  }

  /**
   * Get session metadata without loading full data
   */
  static getSessionInfo() {
    try {
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionJson) return null;

      const sessionData = JSON.parse(sessionJson);
      return {
        version: sessionData.version,
        timestamp: sessionData.timestamp,
        partnershipsCount: sessionData.partnerships?.length || 0,
        caseStudiesCount: Object.keys(sessionData.caseStudies || {}).length,
        batchProgress: sessionData.batchProgress,
        globalBatchProgress: sessionData.globalBatchProgress
      };
    } catch (error) {
      console.error('❌ Failed to get session info:', error);
      return null;
    }
  }

  /**
   * Auto-save handler for periodic saves
   */
  static setupAutoSave(getStateCallback, intervalMs = 30000) {
    let autoSaveInterval = null;

    const startAutoSave = () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
      
      autoSaveInterval = setInterval(() => {
        const state = getStateCallback();
        if (state) {
          this.saveSession(state);
          console.log('💾 Auto-saved session');
        }
      }, intervalMs);
      
      console.log('🔄 Auto-save enabled (every', intervalMs / 1000, 'seconds)');
    };

    const stopAutoSave = () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        console.log('⏹️ Auto-save disabled');
      }
    };

    return { startAutoSave, stopAutoSave };
  }
}

export default SessionPersistence;