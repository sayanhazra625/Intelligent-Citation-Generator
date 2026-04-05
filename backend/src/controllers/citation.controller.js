const Citation = require('../models/Citation');
const groqService = require('../services/groq.service');
const geminiService = require('../services/gemini.service');
const citationJsService = require('../services/citationjs.service');

/**
 * Detect if rawInput contains structured metadata fields (from auto-fetch).
 * If so, parse them into a metadata object for Citation.js.
 */
function parseStructuredInput(rawInput) {
  const lines = rawInput.split('\n');
  const metadata = {};
  let isStructured = false;

  // Map of field labels to metadata keys
  const fieldMap = {
    authors: 'authors',
    author: 'authors',
    year: 'year',
    title: 'title',
    journal: 'source',
    source: 'source',
    volume: 'volume',
    issue: 'issue',
    pages: 'pages',
    publisher: 'publisher',
    doi: 'doi',
    url: 'url',
    isbn: 'isbn',
    pmid: 'pmid',
    edition: 'edition',
    site: 'source',
    published: 'year',
    subjects: 'subjects',
    pdf: 'pdfLink',
    'cited by': 'citedBy',
  };

  for (const line of lines) {
    const match = line.match(/^([A-Za-z\s]+):\s*(.+)$/);
    if (match) {
      const label = match[1].trim().toLowerCase();
      const value = match[2].trim();
      const key = fieldMap[label];
      if (key) {
        metadata[key] = value;
        isStructured = true;
      }
    }
  }

  // Also try to extract year from a "Published: 2023-01-15T..." date string
  if (metadata.year && metadata.year.match(/^\d{4}-/)) {
    metadata.year = metadata.year.substring(0, 4);
  }

  return { isStructured, metadata };
}

// ==================== GENERATE CITATION ====================
const generateCitation = async (req, res, next) => {
  try {
    const { rawInput, style, sourceType } = req.body;

    let citationData;
    let provider = 'ai';

    // Step 1: Try to detect structured input (from auto-fetch) and use Citation.js
    const { isStructured, metadata } = parseStructuredInput(rawInput);

    if (isStructured && metadata.title) {
      try {
        console.log('[CitationController] Structured input detected — using Citation.js engine');
        const result = await citationJsService.formatCitation(metadata, style, sourceType);

        citationData = {
          citation: result.citation,
          inTextCitation: result.inTextCitation,
          breakdown: metadata,
          notes: 'Formatted using Citation.js (CSL engine) for style-compliant output.',
          bibtex: result.bibtex,
          ris: result.ris,
        };
        provider = 'citation-js';
      } catch (cjsError) {
        console.warn('[CitationController] Citation.js failed, falling back to AI:', cjsError.message);
        // Fall through to AI
      }
    }

    // Step 2: If Citation.js didn't produce a result, try AI providers
    if (!citationData) {
      try {
        citationData = await groqService.generateCitation(rawInput, style, sourceType);
        provider = 'groq';
      } catch (groqError) {
        console.warn('[CitationController] Groq failed, trying Gemini fallback:', groqError.message);
        provider = 'gemini';
        try {
          citationData = await geminiService.generateCitation(rawInput, style, sourceType);
        } catch (geminiError) {
          console.error('[CitationController] All providers failed.');
          console.error('  Citation.js: structured input not detected or failed');
          console.error('  Groq error:', groqError.message);
          console.error('  Gemini error:', geminiError.message);
          throw new Error(
            'Citation generation failed. All providers are unavailable. ' +
            'Please check your GROQ_API_KEY or GEMINI_API_KEY in the backend .env file.'
          );
        }
      }
    }

    res.json({
      success: true,
      data: {
        style,
        sourceType,
        rawInput,
        provider,
        ...citationData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SAVE CITATION ====================
const saveCitation = async (req, res, next) => {
  try {
    const { style, sourceType, rawInput, citation, inTextCitation, breakdown, notes } = req.body;

    const newCitation = await Citation.create({
      userId: req.user._id,
      style,
      sourceType,
      rawInput,
      citation,
      inTextCitation,
      breakdown: breakdown || {},
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Citation saved to library',
      data: newCitation,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET ALL CITATIONS (paginated, searchable, filterable) ====================
const getCitations = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      style,
      sourceType,
      sort = '-createdAt',
    } = req.query;

    const query = { userId: req.user._id };

    // Filter by style
    if (style) query.style = style;

    // Filter by source type
    if (sourceType) query.sourceType = sourceType;

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    const sortOptions = {};
    if (sort === 'oldest') {
      sortOptions.createdAt = 1;
    } else if (sort === 'alpha') {
      sortOptions['breakdown.title'] = 1;
    } else {
      sortOptions.createdAt = -1; // default: newest first
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [citations, total] = await Promise.all([
      Citation.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)),
      Citation.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: citations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET SINGLE CITATION ====================
const getCitation = async (req, res, next) => {
  try {
    const citation = await Citation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!citation) {
      return res.status(404).json({
        success: false,
        message: 'Citation not found',
      });
    }

    res.json({
      success: true,
      data: citation,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE CITATION ====================
const deleteCitation = async (req, res, next) => {
  try {
    const citation = await Citation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!citation) {
      return res.status(404).json({
        success: false,
        message: 'Citation not found',
      });
    }

    res.json({
      success: true,
      message: 'Citation deleted',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== BULK DELETE CITATIONS ====================
const bulkDeleteCitations = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of citation IDs to delete',
      });
    }

    const result = await Citation.deleteMany({
      _id: { $in: ids },
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: `${result.deletedCount} citation(s) deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateCitation,
  saveCitation,
  getCitations,
  getCitation,
  deleteCitation,
  bulkDeleteCitations,
};
