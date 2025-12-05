import React from 'react';
import { AlertCircle, CheckCircle, Clock, Pause, Play, Square, TrendingUp, Users, Zap } from 'lucide-react';

const BatchProcessingUI = ({ 
  globalBatchStore,
  darkMode,
  onPause,
  onResume,
  onStop,
  settings
}) => {
  const {
    isRunning,
    isPaused,
    totalPartnerships,
    currentPartnershipIndex,
    processedCount,
    successCount,
    errorCount,
    skippedCount,
    currentPartnership,
    currentPartnershipProgress,
    startTime,
    sessionLogs
  } = globalBatchStore;

  // Calculate progress percentage
  const progressPercentage = totalPartnerships > 0 
    ? Math.round((processedCount / totalPartnerships) * 100) 
    : 0;

  // Calculate estimated time remaining
  const calculateETA = () => {
    if (!startTime || processedCount === 0) return 'Calculating...';
    
    const elapsed = Date.now() - new Date(startTime).getTime();
    const avgTimePerPartnership = elapsed / processedCount;
    const remaining = totalPartnerships - processedCount;
    const estimatedRemaining = avgTimePerPartnership * remaining;
    
    const minutes = Math.floor(estimatedRemaining / 60000);
    const seconds = Math.floor((estimatedRemaining % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `~${hours}h ${mins}m`;
    }
    return `~${minutes}m ${seconds}s`;
  };

  // Calculate processing rate
  const calculateRate = () => {
    if (!startTime || processedCount === 0) return '0';
    
    const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000; // in seconds
    const rate = (processedCount / elapsed) * 60; // per minute
    return rate.toFixed(1);
  };

  // Get step status icon
  const getStepIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={14} className="text-green-500" />;
    if (status === 'in_progress') return <Clock size={14} className="text-yellow-500 animate-pulse" />;
    if (status === 'error') return <AlertCircle size={14} className="text-red-500" />;
    return <div className="w-3.5 h-3.5 rounded-full bg-gray-400" />;
  };

  if (!isRunning) return null;

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 mb-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            {isRunning && !isPaused && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Batch Processing Active
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isPaused ? '⏸️ Paused' : '🚀 Running'} • Model: {settings?.selectedModel || 'Default'}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={onResume}
              className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
              title="Resume processing"
            >
              <Play size={16} />
            </button>
          ) : (
            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
              title="Pause processing"
            >
              <Pause size={16} />
            </button>
          )}
          <button
            onClick={onStop}
            className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="Stop processing"
          >
            <Square size={16} />
          </button>
        </div>
      </div>

      {/* Main Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Partnership {currentPartnershipIndex + 1} of {totalPartnerships}
          </span>
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>Success</span>
            <CheckCircle size={14} className="text-green-500" />
          </div>
          <p className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {successCount}
          </p>
        </div>

        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>Errors</span>
            <AlertCircle size={14} className="text-red-500" />
          </div>
          <p className={`text-lg font-semibold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            {errorCount}
          </p>
        </div>

        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>Rate</span>
            <TrendingUp size={14} className="text-blue-500" />
          </div>
          <p className={`text-lg font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {calculateRate()}/min
          </p>
        </div>

        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>ETA</span>
            <Clock size={14} className="text-purple-500" />
          </div>
          <p className={`text-lg font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            {calculateETA()}
          </p>
        </div>
      </div>

      {/* Current Partnership Details */}
      {currentPartnership && (
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} p-3`}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Processing: {currentPartnership.company || currentPartnership.quantum_company} + {currentPartnership.partner || currentPartnership.commercial_partner}
            </span>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getStepIcon(currentPartnershipProgress?.caseStudy)}
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Case Study
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStepIcon(currentPartnershipProgress?.metadata)}
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Analysis
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStepIcon(currentPartnershipProgress?.references)}
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                References
              </span>
            </div>
          </div>

          {/* Detailed Progress for Current Step */}
          {currentPartnershipProgress?.currentStep && (
            <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                {currentPartnershipProgress.currentStep === 'caseStudy' && '📝 Generating comprehensive case study...'}
                {currentPartnershipProgress.currentStep === 'metadata' && '🔍 Analyzing algorithms and industries...'}
                {currentPartnershipProgress.currentStep === 'references' && '📚 Collecting academic references...'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Errors (if any) */}
      {errorCount > 0 && sessionLogs && (
        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            Recent Errors:
          </p>
          <div className="space-y-1">
            {sessionLogs
              .filter(log => log.type === 'error')
              .slice(-3)
              .map((log, index) => (
                <p key={index} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • {log.message?.substring(0, 100)}...
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessingUI;