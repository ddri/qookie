import React, { useState, useRef } from 'react';
import { Save, Upload, Download, Trash2, Info, Clock, Database, AlertCircle } from 'lucide-react';

const SessionManager = ({ 
  sessionPersistence, 
  darkMode,
  isProcessing = false 
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const fileInputRef = useRef(null);

  const handleShowInfo = () => {
    const info = sessionPersistence.getSessionInfo();
    setSessionInfo(info);
    setShowInfo(true);
  };

  const handleSave = () => {
    const success = sessionPersistence.saveSession();
    if (success) {
      alert('✅ Session saved successfully!');
    } else {
      alert('❌ Failed to save session. Please try again.');
    }
  };

  const handleLoad = () => {
    const confirmed = window.confirm(
      'Loading a saved session will replace your current work. Continue?'
    );
    
    if (confirmed) {
      const data = sessionPersistence.loadSession();
      if (data) {
        alert(`✅ Session loaded from ${new Date(data.timestamp).toLocaleString()}`);
        window.location.reload();
      } else {
        alert('📭 No saved session found.');
      }
    }
  };

  const handleExport = () => {
    sessionPersistence.exportSession();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      sessionPersistence.importSession(file);
    }
  };

  const handleClear = () => {
    sessionPersistence.clearSession();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`session-manager ${darkMode ? 'dark' : ''}`}>
      {/* Session Controls */}
      <div className="flex items-center gap-2">
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Save current session"
        >
          <Save size={16} />
        </button>

        {/* Load Button */}
        <button
          onClick={handleLoad}
          disabled={isProcessing}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Load saved session"
        >
          <Upload size={16} />
        </button>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Export session to file"
        >
          <Download size={16} />
        </button>

        {/* Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Import session from file"
        >
          <Database size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />

        {/* Info Button */}
        <button
          onClick={handleShowInfo}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Session information"
        >
          <Info size={16} />
        </button>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          disabled={isProcessing}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-red-900 hover:bg-red-800 text-red-300' 
              : 'bg-red-100 hover:bg-red-200 text-red-700'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Clear all saved data"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Session Info Modal */}
      {showInfo && sessionInfo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowInfo(false)}
        >
          <div 
            className={`rounded-lg p-6 max-w-md w-full mx-4 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info size={20} />
                Session Information
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="text-sm">
                  Last saved: {formatTimestamp(sessionInfo.timestamp)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Database size={16} className="text-gray-500" />
                <span className="text-sm">
                  Version: {sessionInfo.version || 'Unknown'}
                </span>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Partnerships:</span>
                    <span className="ml-2 font-medium">{sessionInfo.partnershipsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Case Studies:</span>
                    <span className="ml-2 font-medium">{sessionInfo.caseStudiesCount || 0}</span>
                  </div>
                </div>
              </div>

              {sessionInfo.globalBatchProgress?.isRunning && (
                <div className={`p-3 rounded-lg border ${
                  darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-yellow-500" />
                    <span className="text-sm">
                      Batch processing was interrupted at {sessionInfo.globalBatchProgress.processedCount}/{sessionInfo.globalBatchProgress.totalPartnerships}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfo(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save indicator */}
      <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Auto-save enabled (every 30 seconds)
        </span>
      </div>
    </div>
  );
};

export default SessionManager;