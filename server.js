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

// Research endpoint for partnerships
app.post('/api/research', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { company, partner, year, status, notes } = req.body;
    
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
- Status: ${status || 'Unknown'}
- Notes: ${notes || 'None'}

Focus on factual information and realistic quantum computing applications. Respond with ONLY the JSON object.`;

    console.log(`Starting research for ${company} + ${partner}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
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

app.listen(port, () => {
  console.log(`Research API server running at http://localhost:${port}`);
  console.log(`Test page available at http://localhost:${port}/test.html`);
});