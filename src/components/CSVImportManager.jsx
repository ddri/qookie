import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useDarkMode } from '../QuantumCaseStudyProcessor.jsx';

const CSVImportManager = ({ onDataImport, sourceData, onExportData }) => {
  const { darkMode } = useDarkMode();
  const [importStatus, setImportStatus] = useState('idle');
  const [importMessage, setImportMessage] = useState('');

  const parseCSV = (content) => {
    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have at least header and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
        const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
        
        const row = {};
        headers.forEach((header, i) => {
          row[header] = cleanValues[i] || '';
        });
        
        return {
          id: parseInt(row.id) || index + 1,
          company: row.quantum_company || '',
          partner: row.commercial_partner || '',
          status: row.status || '',
          year: row.year || '',
          notes: row.notes || ''
        };
      });
      
      return data.filter(row => row.company && row.partner);
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportStatus('error');
      setImportMessage('Please select a CSV file');
      return;
    }

    setImportStatus('loading');
    setImportMessage('Parsing CSV file...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target.result;
        const parsedData = parseCSV(csvContent);
        
        if (parsedData.length === 0) {
          setImportStatus('error');
          setImportMessage('No valid partnership data found in CSV');
          return;
        }

        onDataImport(parsedData);
        setImportStatus('success');
        setImportMessage(`Successfully imported ${parsedData.length} partnerships`);
      } catch (error) {
        setImportStatus('error');
        setImportMessage(error.message);
      }
    };

    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('Error reading file');
    };

    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!sourceData || sourceData.length === 0) {
      setImportStatus('error');
      setImportMessage('No data to export');
      return;
    }

    const csvHeaders = 'id,quantum_company,commercial_partner,status,year,notes\n';
    const csvRows = sourceData.map(row => 
      `${row.id},"${row.company}","${row.partner}","${row.status || ''}","${row.year || ''}","${row.notes || ''}"`
    ).join('\n');
    
    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum-partnerships.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setImportStatus('success');
    setImportMessage('CSV exported successfully');
  };

  const resetStatus = () => {
    setImportStatus('idle');
    setImportMessage('');
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <FileText className="w-5 h-5" />
        CSV Data Management
      </h2>
      
      <div className="space-y-4">
        {/* Import Section */}
        <div>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Import CSV Data</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Download className="w-4 h-4" />
              Export Current Data
            </button>
          </div>
        </div>

        {/* Status Display */}
        {importStatus !== 'idle' && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            importStatus === 'success' ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-800') :
            importStatus === 'error' ? (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-800') :
            (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-800')
          }`}>
            {importStatus === 'success' && <CheckCircle className="w-5 h-5" />}
            {importStatus === 'error' && <AlertCircle className="w-5 h-5" />}
            {importStatus === 'loading' && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
            
            <span>{importMessage}</span>
            
            {importStatus !== 'loading' && (
              <button
                onClick={resetStatus}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Data Preview */}
        {sourceData && sourceData.length > 0 && (
          <div>
            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Current Data ({sourceData.length} partnerships)</h3>
            <div className={`max-h-40 overflow-y-auto border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0`}>
                  <tr>
                    <th className={`px-3 py-2 text-left ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>ID</th>
                    <th className={`px-3 py-2 text-left ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Quantum Company</th>
                    <th className={`px-3 py-2 text-left ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Commercial Partner</th>
                    <th className={`px-3 py-2 text-left ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Status</th>
                    <th className={`px-3 py-2 text-left ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceData.map(row => (
                    <tr key={row.id} className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.id}</td>
                      <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.company}</td>
                      <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.partner}</td>
                      <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.status || '-'}</td>
                      <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.year || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`text-sm p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
          <h4 className={`font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Expected CSV Format:</h4>
          <code className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>id,quantum_company,commercial_partner,status,year,notes</code>
          <p className="mt-2">
            Upload a CSV file with partnership data or export the current data to CSV format.
            The tool will automatically parse and validate the data structure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CSVImportManager;