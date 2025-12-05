from langflow.custom import Component
from langflow.io import StrInput, DropdownInput, BoolInput, FloatInput
from langflow.template import Output
import os
from anthropic import Anthropic
import json
import logging
from typing import Dict, Any

class QuantumCaseStudyGenerator(Component):
    display_name = "Quantum Case Study Generator"
    description = "Generate comprehensive quantum computing case studies using AI"
    icon = "atom"
    
    inputs = [
        StrInput(
            name="quantum_company", 
            display_name="Quantum Company",
            info="Name of the quantum computing company"
        ),
        StrInput(
            name="commercial_partner", 
            display_name="Commercial Partner",
            info="Name of the commercial/enterprise partner"
        ),
        StrInput(
            name="year",
            display_name="Partnership Year",
            value="2023",
            info="Year of the partnership (optional)"
        ),
        StrInput(
            name="notes",
            display_name="Additional Notes",
            value="",
            info="Any additional context or notes about the partnership"
        ),
        DropdownInput(
            name="ai_provider",
            display_name="AI Provider",
            options=["Claude", "Gemini"],
            value="Claude",
            info="Choose AI provider for case study generation"
        ),
        BoolInput(
            name="include_technical_details",
            display_name="Include Technical Details",
            value=True,
            info="Include technical analysis in the case study"
        ),
        FloatInput(
            name="temperature",
            display_name="AI Temperature",
            value=0.3,
            info="AI creativity level (0.0 = focused, 1.0 = creative)"
        )
    ]
    
    outputs = [
        Output(display_name="Case Study", name="case_study", method="generate_case_study"),
        Output(display_name="Summary", name="summary", method="get_summary")
    ]
    
    def __init__(self):
        super().__init__()
        self.logger = logging.getLogger(__name__)
        self.case_study_data = None
        
        # Initialize AI clients
        self.anthropic_client = None
        if os.getenv('ANTHROPIC_API_KEY'):
            self.anthropic_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    
    def create_research_prompt(self) -> str:
        """Create the research prompt for case study generation"""
        
        base_prompt = f"""
        You are a quantum computing research analyst. Generate a comprehensive case study for the partnership between {self.quantum_company} and {self.commercial_partner}.

        Partnership Details:
        - Quantum Company: {self.quantum_company}
        - Commercial Partner: {self.commercial_partner}
        - Year: {self.year}
        - Additional Context: {self.notes if self.notes else "None provided"}

        Please provide a detailed case study with the following sections:

        1. **Executive Summary**: A brief overview of the partnership and its significance

        2. **Introduction**: Background on both companies and the context of their collaboration

        3. **Challenge**: What business or technical challenge was this partnership designed to address?

        4. **Solution**: How did quantum computing provide a solution? What specific quantum technologies or algorithms were used?

        5. **Implementation**: How was the solution implemented? What were the key technical details?

        6. **Results and Business Impact**: What were the measurable outcomes and business benefits?

        7. **Future Directions**: What are the next steps and potential for expansion?

        {"Include detailed technical analysis of quantum algorithms, hardware requirements, and implementation challenges." if self.include_technical_details else "Focus on business outcomes and practical applications rather than deep technical details."}

        Ensure the case study is factually accurate, well-researched, and professionally written. The tone should be informative and authoritative, suitable for publication in a quantum computing industry report.

        Return the response as a JSON object with the following structure:
        {{
            "title": "Partnership title",
            "summary": "Executive summary paragraph",
            "introduction": "Introduction section",
            "challenge": "Challenge section", 
            "solution": "Solution section",
            "implementation": "Implementation section",
            "results_and_business_impact": "Results section",
            "future_directions": "Future directions section",
            "metadata": {{
                "confidence_score": 0.8,
                "word_count": 1200,
                "research_date": "2024-01-01"
            }}
        }}
        """
        
        return base_prompt
    
    def call_claude_api(self, prompt: str) -> Dict[str, Any]:
        """Call Claude API for case study generation"""
        try:
            if not self.anthropic_client:
                raise ValueError("Anthropic API key not configured")
            
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=4000,
                temperature=self.temperature,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            
            # Try to parse as JSON
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # If not JSON, return as raw text in summary field
                return {
                    "title": f"{self.quantum_company} - {self.commercial_partner} Partnership",
                    "summary": content[:500] + "..." if len(content) > 500 else content,
                    "raw_response": content
                }
                
        except Exception as e:
            self.logger.error(f"Error calling Claude API: {str(e)}")
            raise
    
    def generate_case_study(self) -> Dict[str, Any]:
        """Generate case study using selected AI provider"""
        try:
            if not self.quantum_company or not self.commercial_partner:
                raise ValueError("Both quantum company and commercial partner are required")
            
            prompt = self.create_research_prompt()
            
            if self.ai_provider == "Claude":
                result = self.call_claude_api(prompt)
            else:
                # Gemini implementation would go here
                raise ValueError("Gemini provider not yet implemented in POC")
            
            # Store for summary output
            self.case_study_data = result
            
            self.logger.info(f"Generated case study for {self.quantum_company} - {self.commercial_partner}")
            return result
            
        except Exception as e:
            self.logger.error(f"Error generating case study: {str(e)}")
            return {
                "error": str(e),
                "title": f"Error: {self.quantum_company} - {self.commercial_partner}",
                "summary": f"Failed to generate case study: {str(e)}"
            }
    
    def get_summary(self) -> str:
        """Return just the summary for quick preview"""
        if self.case_study_data and "summary" in self.case_study_data:
            return self.case_study_data["summary"]
        return "No case study generated yet"