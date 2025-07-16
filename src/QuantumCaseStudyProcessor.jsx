// Add this function to parse CSV
const parseCSV = (content) => {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = lines.slice(1).map((line, index) => {
    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
    
    const row = {};
    headers.forEach((header, i) => {
      row[header] = cleanValues[i] || '';
    });
    
    return {
      id: parseInt(row.id) || index,
      company: row.quantum_company || '',
      partner: row.commercial_partner || '',
      // Map any additional fields you need
    };
  });
  
  return data.filter(row => row.company && row.partner);
};

// Add to your useEffect to load CSV on mount
useEffect(() => {
  // Try to load CSV file
  fetch('/data/quantum-partnerships.csv')
    .then(response => response.text())
    .then(csvContent => {
      const parsedData = parseCSV(csvContent);
      setSourceData(parsedData);
      console.log(`Loaded ${parsedData.length} partnerships from CSV`);
    })
    .catch(error => {
      console.log('CSV not found, using default data');
      // Fall back to your hardcoded data
      setSourceData(initSourceData);
    });
    
  // ... rest of your initialization
}, []);