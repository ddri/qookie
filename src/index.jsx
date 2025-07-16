import React from 'react';
import ReactDOM from 'react-dom/client';
import QuantumCaseStudyProcessor from './QuantumCaseStudyProcessor.jsx';

// Mock the Claude API for local development
if (!window.claude) {
  window.claude = {
    complete: async (prompt) => {
      console.log('Claude API called with prompt:', prompt.substring(0, 100) + '...');
      
      // Return mock responses for development
      if (prompt.includes('create a detailed case study')) {
        return JSON.stringify({
          introduction: "This case study examines a quantum computing partnership.",
          challenge: "The main challenge was computational complexity.",
          implementation: "The implementation involved quantum algorithms.",
          result_and_business_impact: "Results showed significant improvements.",
          future_directions: "Future work will expand on these findings."
        });
      }
      
      if (prompt.includes('Analyze this quantum computing case study')) {
        return JSON.stringify({
          algorithms: ["Quantum Optimization", "QAOA"],
          industries: ["Aerospace", "Defense"],
          personas: ["Business Decision-Maker", "Quantum Solutions Provider"]
        });
      }
      
      if (prompt.includes('search for and provide')) {
        return JSON.stringify({
          found: true,
          title: "Mock Partnership Case Study",
          year: "2023",
          content: "This is a mock case study for development purposes.",
          scientificReferences: [],
          companyResources: []
        });
      }
      
      return "Mock response";
    }
  };
  console.warn('Running in development mode with mock Claude API');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QuantumCaseStudyProcessor />
  </React.StrictMode>
);
