import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public')); // Serve static files for test page

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Web search endpoint for finding real references
app.post('/api/search', async (req, res) => {
  try {
    const { query, type } = req.body; // type: 'academic' or 'business'
    
    const serperApiKey = process.env.SERPER_API_KEY;
    if (!serperApiKey) {
      return res.status(500).json({ error: 'Serper API key not configured' });
    }

    const searchUrl = type === 'academic' 
      ? 'https://google.serper.dev/scholar'  // Google Scholar for academic papers
      : 'https://google.serper.dev/search';  // Regular search for business content

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: type === 'academic' ? 10 : 15, // More results for business content
        ...(type === 'academic' && { gl: 'us', hl: 'en' })
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    res.json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search request failed: ' + error.message });
  }
});

// References collection endpoint
app.post('/api/references', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { academicData, businessData, caseStudy, model } = req.body;
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // Create references prompt
    const prompt = `Here is a case study about a quantum computing partnership:

${JSON.stringify(caseStudy, null, 2)}

Here are search results for relevant scientific papers and further reading:

Academic Papers: ${JSON.stringify(academicData.organic || [], null, 2)}
Business Coverage: ${JSON.stringify(businessData.organic || [], null, 2)}

Find the relevant scientific papers and further reading based on this case study content. Return only JSON:

{
  "references": [
    {
      "title": "paper title",
      "authors": ["authors"],
      "journal": "journal",
      "year": "year",
      "url": "real url",
      "citation": "formatted citation"
    }
  ],
  "further_reading": [
    {
      "title": "article title",
      "source": "source",
      "url": "real url",
      "type": "news|blog_post|press_release",
      "date": "date",
      "description": "description"
    }
  ],
  "collection_notes": "notes"
}`;

    const selectedModel = model || 'claude-3-5-sonnet-20241022';
    console.log(`Collecting references using model: ${selectedModel}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error: `API call failed: ${response.status} ${response.statusText}` });
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    console.log(`References collection completed in ${responseTime}ms`);

    // Parse JSON response
    let referencesData;
    try {
      const responseText = data.content[0].text.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      referencesData = JSON.parse(jsonText);
      console.log('Successfully parsed references JSON');
    } catch (parseError) {
      console.warn('Failed to parse references response as JSON:', parseError.message);
      referencesData = {
        references: [],
        further_reading: [],
        collection_notes: 'Failed to parse references response',
        raw_response: data.content[0].text
      };
    }

    res.json({ 
      references: referencesData,
      metadata: {
        responseTime,
        timestamp: new Date().toISOString(),
        tokenCount: data.usage?.total_tokens || 'unknown'
      }
    });

  } catch (error) {
    console.error('References collection error:', error);
    res.status(500).json({ error: 'References collection failed: ' + error.message });
  }
});

// Research endpoint for partnerships
app.post('/api/research', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { company, partner, year, notes, model } = req.body;
    
    if (!company || !partner) {
      return res.status(400).json({ error: 'Company and partner are required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // Create research prompt
    const prompt = `Research and create a comprehensive case study about the quantum computing partnership between "${company}" and "${partner}".

IMPORTANT: You must respond with ONLY valid JSON. No markdown, no explanations, no text before or after the JSON.

Return this exact JSON structure:

{
  "title": "Partnership title",
  "summary": "2-3 sentence executive summary",
  "introduction": "Detailed introduction (200+ words)",
  "challenge": "What challenge did this partnership address? (200+ words)",
  "solution": "What quantum solution was developed? (200+ words)", 
  "implementation": "How was it implemented? (200+ words)",
  "results_and_business_impact": "What were the results and business impact? (200+ words)",
  "future_directions": "What are the future plans? (150+ words)",
  "metadata": {
    "algorithms": ["list", "of", "quantum", "algorithms"],
    "industries": ["list", "of", "industries"],
    "personas": ["list", "of", "target", "personas"],
    "confidence_score": 0.85
  }
}

Additional context:
- Year: ${year || 'Unknown'}
- Notes: ${notes || 'None'}

Focus on factual information and realistic quantum computing applications. Respond with ONLY the JSON object.`;

    const selectedModel = model || 'claude-3-5-sonnet-20241022';
    console.log(`Starting research for ${company} + ${partner} using model: ${selectedModel}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error: `API call failed: ${response.status} ${response.statusText}` });
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    console.log(`Research completed in ${responseTime}ms`);

    // Parse JSON response with improved error handling
    let caseStudy;
    try {
      const responseText = data.content[0].text.trim();
      
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      
      caseStudy = JSON.parse(jsonText);
      console.log('Successfully parsed JSON response');
      
    } catch (parseError) {
      console.warn('Failed to parse response as JSON:', parseError.message);
      console.log('Raw response:', data.content[0].text.substring(0, 500) + '...');
      
      caseStudy = {
        title: `${company} and ${partner}: Quantum Computing Partnership`,
        raw_response: data.content[0].text,
        error: 'Failed to parse structured response - check raw response below'
      };
    }

    res.json({ 
      caseStudy,
      metadata: {
        responseTime,
        timestamp: new Date().toISOString(),
        tokenCount: data.usage?.total_tokens || 'unknown'
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Analysis endpoint for case study analysis
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { company, partner, year, notes, caseStudy, model } = req.body;
    
    if (!company || !partner || !caseStudy) {
      return res.status(400).json({ error: 'Company, partner, and case study are required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    const selectedModel = model || 'claude-3-5-sonnet-20241022';
    console.log(`Starting analysis for ${company} + ${partner} using model: ${selectedModel}`);

    // Build the analysis prompt
    const prompt = `You are analyzing a quantum computing case study. Your task is to match the case study content against provided reference lists and return ONLY a JSON object with the analysis results.

CASE STUDY TO ANALYZE:
${JSON.stringify(caseStudy, null, 2)}

${notes || ''}

INSTRUCTIONS:
- Read the case study content carefully
- Identify relevant algorithms, industries, and personas
- Return ONLY valid JSON in this exact format:

{
  "title": "Analysis Results",
  "summary": "Analysis of quantum computing case study categorization",
  "metadata": {
    "algorithms": ["algorithm1", "algorithm2"],
    "industries": ["industry1", "industry2"],
    "personas": ["persona1", "persona2"],
    "confidence_score": 0.85,
    "analysis_notes": "Brief explanation of the analysis"
  }
}

Focus on factual information and realistic categorization. Respond with ONLY the JSON object.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error: `API call failed: ${response.status} ${response.statusText}` });
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    console.log(`Analysis completed in ${responseTime}ms`);

    // Parse JSON response with improved error handling
    let analysisResult;
    try {
      const responseText = data.content[0].text.trim();
      
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse analysis response:', parseError);
      analysisResult = {
        title: "Analysis Results",
        summary: "Failed to parse analysis response",
        metadata: {
          error: 'Failed to parse analysis response',
          raw_response: data.content[0].text,
          algorithms: [],
          industries: [],
          personas: [],
          confidence_score: 0,
          analysis_notes: `Parse error: ${parseError.message}`
        }
      };
    }

    res.json({ 
      caseStudy: analysisResult,
      metadata: {
        responseTime,
        timestamp: new Date().toISOString(),
        tokenCount: data.usage?.total_tokens || 'unknown'
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
});

app.listen(port, () => {
  console.log(`Research API server running at http://localhost:${port}`);
  console.log(`Test page available at http://localhost:${port}/test.html`);
});