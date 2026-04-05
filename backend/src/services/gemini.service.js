const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.model = null;
    this._cachedKey = null;
  }

  _getModel() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key is not configured');
    }

    // Re-create model if API key has changed
    if (this.model && this._cachedKey === apiKey) {
      return this.model;
    }

    console.log('[GeminiService] Initializing model with current API key...');
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this._cachedKey = apiKey;
    return this.model;
  }

  /**
   * Build a structured prompt for citation generation.
   */
  _buildPrompt(rawInput, style, sourceType) {
    const styleNames = {
      apa: 'APA 7th Edition',
      mla: 'MLA 9th Edition',
      chicago: 'Chicago 17th Edition (Notes-Bibliography)',
      harvard: 'Harvard Referencing',
      vancouver: 'Vancouver',
      ieee: 'IEEE',
    };

    const sourceTypeNames = {
      journal: 'Journal Article',
      book: 'Book',
      'book-chapter': 'Book Chapter',
      website: 'Website / Webpage',
      thesis: 'Thesis / Dissertation',
      conference: 'Conference Paper',
    };

    return `You are an expert academic citation generator. Generate a properly formatted citation from the following information.

CITATION STYLE: ${styleNames[style] || style}
SOURCE TYPE: ${sourceTypeNames[sourceType] || sourceType}

RAW SOURCE INFORMATION:
${rawInput}

INSTRUCTIONS:
1. Parse the raw input carefully. It may be a DOI, a URL, a raw reference string, or scattered metadata.
2. Identify as many citation fields as possible: authors, year, title, source/journal, volume, issue, pages, publisher, DOI, URL, edition, etc.
3. If information is missing or ambiguous, make reasonable assumptions but FLAG them in the notes.
4. Format the citation EXACTLY according to ${styleNames[style] || style} rules.
5. Generate both the full reference citation AND the in-text/footnote citation.

RESPOND WITH ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "citation": "The full formatted reference citation",
  "inTextCitation": "The in-text or footnote citation",
  "breakdown": {
    "authors": "Author names as identified",
    "year": "Publication year",
    "title": "Title of the work",
    "source": "Journal name, website, publisher, etc.",
    "doi": "DOI if found",
    "url": "URL if found",
    "volume": "Volume number if applicable",
    "issue": "Issue number if applicable",
    "pages": "Page range if applicable",
    "publisher": "Publisher name if applicable",
    "edition": "Edition if applicable"
  },
  "notes": "Any assumptions made, missing information flagged, or formatting notes"
}`;
  }

  /**
   * Generate a citation using Gemini AI.
   * @returns {Object} Parsed citation data
   */
  async generateCitation(rawInput, style, sourceType) {
    const model = this._getModel();
    const prompt = this._buildPrompt(rawInput, style, sourceType);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean out markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate required fields
    if (!parsed.citation || !parsed.inTextCitation) {
      throw new Error('AI response missing required citation fields');
    }

    return {
      citation: parsed.citation,
      inTextCitation: parsed.inTextCitation,
      breakdown: {
        authors: parsed.breakdown?.authors || '',
        year: parsed.breakdown?.year || '',
        title: parsed.breakdown?.title || '',
        source: parsed.breakdown?.source || '',
        doi: parsed.breakdown?.doi || '',
        url: parsed.breakdown?.url || '',
        volume: parsed.breakdown?.volume || '',
        issue: parsed.breakdown?.issue || '',
        pages: parsed.breakdown?.pages || '',
        publisher: parsed.breakdown?.publisher || '',
        edition: parsed.breakdown?.edition || '',
      },
      notes: parsed.notes || '',
    };
  }
}

module.exports = new GeminiService();
