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

    const selectedModel = model || 'claude-sonnet-4-20250514';
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

    const selectedModel = model || 'claude-sonnet-4-20250514';
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

// Analysis endpoint - dedicated to case study analysis only
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { caseStudy, analysisPrompt, model } = req.body;
    
    if (!caseStudy || !analysisPrompt) {
      return res.status(400).json({ error: 'Case study and analysis prompt are required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    const selectedModel = model || 'claude-sonnet-4-20250514';
    console.log(`Starting case study analysis using model: ${selectedModel}`);

    // Use the complete analysis prompt from frontend (contains reference lists)
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
        messages: [{ role: 'user', content: analysisPrompt }]
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

    // Parse JSON response and extract analysis metadata
    let analysisResult;
    try {
      const responseText = data.content[0].text.trim();
      
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const fullResult = JSON.parse(jsonMatch[0]);
        // Extract metadata from the structured response
        if (fullResult.metadata) {
          analysisResult = fullResult.metadata;
        } else {
          analysisResult = fullResult;
        }
      } else {
        analysisResult = JSON.parse(responseText);
      }
      
      // Ensure required fields exist
      if (!analysisResult.algorithms) analysisResult.algorithms = [];
      if (!analysisResult.industries) analysisResult.industries = [];
      if (!analysisResult.personas) analysisResult.personas = [];
      if (!analysisResult.confidence_score) analysisResult.confidence_score = 0;
      if (!analysisResult.analysis_notes) analysisResult.analysis_notes = '';
      
    } catch (parseError) {
      console.error('Failed to parse analysis response:', parseError);
      console.error('Response text was:', data.content[0].text);
      analysisResult = {
        error: 'Failed to parse analysis response',
        raw_response: data.content[0].text,
        algorithms: [],
        industries: [],
        personas: [],
        confidence_score: 0,
        analysis_notes: `Parse error: ${parseError.message}`
      };
    }

    res.json({ 
      analysis: analysisResult,
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

// GitHub backup endpoint
app.post('/api/github/push', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { partnership, caseStudy, filename } = req.body;
    
    if (!partnership || !caseStudy || !filename) {
      return res.status(400).json({ error: 'Partnership, case study, and filename are required' });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPO_OWNER;
    const repoName = process.env.GITHUB_REPO_NAME;

    if (!githubToken || !repoOwner || !repoName) {
      return res.status(500).json({ 
        error: 'GitHub configuration not complete. Please set GITHUB_TOKEN, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME in .env file' 
      });
    }

    // Generate markdown content (same logic as frontend export)
    const generateMarkdown = (caseStudy) => {
      return `# ${caseStudy.title}

## Summary
${caseStudy.summary}

## Introduction
${caseStudy.introduction}

## Challenge
${caseStudy.challenge}

## Solution
${caseStudy.solution}

## Implementation
${caseStudy.implementation}

## Results and Business Impact
${caseStudy.results_and_business_impact}

## Future Directions
${caseStudy.future_directions}

## Technical Details
${caseStudy.technical_details}

## Metadata
- **Company**: ${caseStudy.metadata?.company}
- **Partner**: ${caseStudy.metadata?.partner}
- **Year**: ${caseStudy.metadata?.year}
- **Algorithms**: ${caseStudy.algorithms?.join(', ')}
- **Industries**: ${caseStudy.industries?.join(', ')}
- **Personas**: ${caseStudy.personas?.join(', ')}

## Scientific References
${caseStudy.scientific_references?.map(ref => `- ${ref}`).join('\n') || 'No references available'}

## Business Case Studies and Coverage
${caseStudy.business_references?.map(ref => `- ${ref}`).join('\n') || 'No business references available'}

${caseStudy.advancedMetadata ? `
## Advanced Analysis
- **Algorithms**: ${caseStudy.advancedMetadata.algorithms?.join(', ') || 'None specified'}
- **Industries**: ${caseStudy.advancedMetadata.industries?.join(', ') || 'None specified'}
- **Target Personas**: ${caseStudy.advancedMetadata.personas?.join(', ') || 'None specified'}
- **Confidence Score**: ${caseStudy.advancedMetadata.confidence_score || '0.8'}
- **Analysis Notes**: ${caseStudy.advancedMetadata.analysis_notes || ''}
- **Analyzed**: ${caseStudy.advancedMetadata._analyzedAt ? new Date(caseStudy.advancedMetadata._analyzedAt).toLocaleString() : 'Not analyzed'}
` : ''}

---
*Generated on ${new Date().toLocaleString()}*
`;
    };

    const markdownContent = generateMarkdown(caseStudy);
    const jsonContent = JSON.stringify(caseStudy, null, 2);
    
    // Create both markdown and JSON files
    const baseFilename = filename.replace(/\.(md|json)$/, '');
    const markdownFilename = `exports/${baseFilename}.md`;
    const jsonFilename = `exports/${baseFilename}.json`;

    console.log(`Pushing to GitHub: ${repoOwner}/${repoName}`);

    // Push markdown file
    const markdownResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${markdownFilename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'qookie'
      },
      body: JSON.stringify({
        message: `Add case study: ${partnership.company} + ${partnership.partner}`,
        content: Buffer.from(markdownContent).toString('base64'),
        branch: 'main'
      })
    });

    if (!markdownResponse.ok) {
      const error = await markdownResponse.text();
      console.error('GitHub API error (markdown):', error);
      throw new Error(`Failed to push markdown file: ${markdownResponse.status}`);
    }

    // Push JSON file
    const jsonResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${jsonFilename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'qookie'
      },
      body: JSON.stringify({
        message: `Add case study data: ${partnership.company} + ${partnership.partner}`,
        content: Buffer.from(jsonContent).toString('base64'),
        branch: 'main'
      })
    });

    if (!jsonResponse.ok) {
      const error = await jsonResponse.text();
      console.error('GitHub API error (JSON):', error);
      throw new Error(`Failed to push JSON file: ${jsonResponse.status}`);
    }

    const markdownResult = await markdownResponse.json();
    const jsonResult = await jsonResponse.json();
    const responseTime = Date.now() - startTime;

    console.log(`GitHub push completed in ${responseTime}ms`);

    res.json({
      success: true,
      files: [
        { type: 'markdown', url: markdownResult.content.html_url },
        { type: 'json', url: jsonResult.content.html_url }
      ],
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: 'GitHub push failed: ' + error.message });
  }
});

// Session backup endpoint
app.post('/api/github/backup-session', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { sessionData } = req.body;
    
    if (!sessionData) {
      return res.status(400).json({ error: 'Session data is required' });
    }

    const backupGithubToken = process.env.BACKUP_GITHUB_TOKEN;
    const backupRepoOwner = process.env.BACKUP_GITHUB_REPO_OWNER;
    const backupRepoName = process.env.BACKUP_GITHUB_REPO_NAME;

    if (!backupGithubToken || !backupRepoOwner || !backupRepoName) {
      return res.status(500).json({ 
        error: 'Backup GitHub configuration not complete. Please set BACKUP_GITHUB_TOKEN, BACKUP_GITHUB_REPO_OWNER, and BACKUP_GITHUB_REPO_NAME in .env file' 
      });
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backups/session-backup-${timestamp}.json`;

    // Prepare backup data with metadata
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      sessionData: sessionData,
      metadata: {
        userAgent: req.headers['user-agent'],
        backupSize: JSON.stringify(sessionData).length,
        itemCount: {
          caseStudies: sessionData.caseStudies ? Object.keys(sessionData.caseStudies).length : 0,
          researchHistory: sessionData.researchHistory ? sessionData.researchHistory.length : 0,
          preferences: sessionData.preferences ? Object.keys(sessionData.preferences).length : 0
        }
      }
    };

    const backupContent = JSON.stringify(backupData, null, 2);

    console.log(`Creating session backup: ${backupRepoOwner}/${backupRepoName}`);
    console.log(`Backup size: ${backupContent.length} characters`);

    // Push backup to GitHub
    const response = await fetch(`https://api.github.com/repos/${backupRepoOwner}/${backupRepoName}/contents/${backupFilename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${backupGithubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'qookie'
      },
      body: JSON.stringify({
        message: `Session backup - ${new Date().toLocaleString()}`,
        content: Buffer.from(backupContent).toString('base64'),
        branch: 'main'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error (backup):', error);
      throw new Error(`Failed to create backup: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    const responseTime = Date.now() - startTime;

    console.log(`Session backup completed in ${responseTime}ms`);

    res.json({
      success: true,
      backup: {
        filename: backupFilename,
        url: result.content.html_url,
        size: backupContent.length,
        timestamp: backupData.timestamp
      },
      metadata: backupData.metadata,
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session backup error:', error);
    res.status(500).json({ error: 'Session backup failed: ' + error.message });
  }
});

// Session restore endpoint
app.post('/api/github/restore-session', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { backupFilename } = req.body;
    
    if (!backupFilename) {
      return res.status(400).json({ error: 'Backup filename is required' });
    }

    const backupGithubToken = process.env.BACKUP_GITHUB_TOKEN;
    const backupRepoOwner = process.env.BACKUP_GITHUB_REPO_OWNER;
    const backupRepoName = process.env.BACKUP_GITHUB_REPO_NAME;

    if (!backupGithubToken || !backupRepoOwner || !backupRepoName) {
      return res.status(500).json({ 
        error: 'Backup GitHub configuration not complete. Please set BACKUP_GITHUB_TOKEN, BACKUP_GITHUB_REPO_OWNER, and BACKUP_GITHUB_REPO_NAME in .env file' 
      });
    }

    console.log(`Restoring session from: ${backupRepoOwner}/${backupRepoName}/${backupFilename}`);

    // Fetch backup file from GitHub
    const response = await fetch(`https://api.github.com/repos/${backupRepoOwner}/${backupRepoName}/contents/${backupFilename}`, {
      headers: {
        'Authorization': `token ${backupGithubToken}`,
        'User-Agent': 'qookie'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error (restore):', error);
      throw new Error(`Failed to fetch backup: ${response.status} - ${response.statusText}`);
    }

    const fileData = await response.json();
    const backupContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    
    let backupData;
    try {
      backupData = JSON.parse(backupContent);
    } catch (parseError) {
      throw new Error('Invalid backup file format');
    }

    // Validate backup data structure
    if (!backupData.sessionData || !backupData.timestamp) {
      throw new Error('Invalid backup data structure');
    }

    const responseTime = Date.now() - startTime;

    console.log(`Session restore completed in ${responseTime}ms`);

    res.json({
      success: true,
      sessionData: backupData.sessionData,
      backupInfo: {
        timestamp: backupData.timestamp,
        version: backupData.version,
        metadata: backupData.metadata
      },
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session restore error:', error);
    res.status(500).json({ error: 'Session restore failed: ' + error.message });
  }
});

// List available backups endpoint
app.get('/api/github/list-backups', async (req, res) => {
  try {
    const backupGithubToken = process.env.BACKUP_GITHUB_TOKEN;
    const backupRepoOwner = process.env.BACKUP_GITHUB_REPO_OWNER;
    const backupRepoName = process.env.BACKUP_GITHUB_REPO_NAME;

    if (!backupGithubToken || !backupRepoOwner || !backupRepoName) {
      return res.status(500).json({ 
        error: 'Backup GitHub configuration not complete' 
      });
    }

    console.log(`Listing backups from: ${backupRepoOwner}/${backupRepoName}/backups`);

    // List files in backups directory
    const response = await fetch(`https://api.github.com/repos/${backupRepoOwner}/${backupRepoName}/contents/backups`, {
      headers: {
        'Authorization': `token ${backupGithubToken}`,
        'User-Agent': 'qookie'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No backups directory exists yet
        return res.json({ backups: [] });
      }
      throw new Error(`Failed to list backups: ${response.status}`);
    }

    const files = await response.json();
    const backups = files
      .filter(file => file.name.startsWith('session-backup-') && file.name.endsWith('.json'))
      .map(file => ({
        filename: file.path,
        name: file.name,
        url: file.html_url,
        size: file.size,
        lastModified: file.name.match(/session-backup-(.+)\.json/)?.[1]?.replace(/-/g, ':') || 'unknown'
      }))
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified)); // Most recent first

    res.json({ backups });

  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: 'Failed to list backups: ' + error.message });
  }
});

app.listen(port, () => {
  console.log(`Research API server running at http://localhost:${port}`);
  console.log(`Test page available at http://localhost:${port}/test.html`);
});