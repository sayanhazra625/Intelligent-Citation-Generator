const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { generateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const Joi = require('joi');
const {
  generateCitation,
  saveCitation,
  getCitations,
  getCitation,
  deleteCitation,
  bulkDeleteCitations,
} = require('../controllers/citation.controller');

// ---------- Validation Schemas ----------

const generateSchema = Joi.object({
  rawInput: Joi.string().min(1).max(5000).required(),
  style: Joi.string().valid('apa', 'mla', 'chicago', 'harvard', 'vancouver', 'ieee').required(),
  sourceType: Joi.string()
    .valid('journal', 'book', 'book-chapter', 'website', 'thesis', 'conference')
    .required(),
});

const saveSchema = Joi.object({
  style: Joi.string().valid('apa', 'mla', 'chicago', 'harvard', 'vancouver', 'ieee').required(),
  sourceType: Joi.string()
    .valid('journal', 'book', 'book-chapter', 'website', 'thesis', 'conference')
    .required(),
  rawInput: Joi.string().required(),
  citation: Joi.string().required(),
  inTextCitation: Joi.string().required(),
  breakdown: Joi.object().optional(),
  notes: Joi.string().allow('').optional(),
});

const bulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required(),
});

const lookupDOISchema = Joi.object({
  doi: Joi.string().min(1).required(),
});

const lookupURLSchema = Joi.object({
  url: Joi.string().uri().required(),
});

const lookupPMIDSchema = Joi.object({
  pmid: Joi.string().min(1).required(),
});

const searchPubMedSchema = Joi.object({
  query: Joi.string().min(2).max(500).required(),
});

const lookupISBNSchema = Joi.object({
  isbn: Joi.string().min(1).required(),
});

const searchBooksSchema = Joi.object({
  query: Joi.string().min(2).max(500).required(),
});

const searchScholarSchema = Joi.object({
  query: Joi.string().min(2).max(500).required(),
});

// ---------- Routes ----------

/**
 * @swagger
 * /api/citations/health:
 *   get:
 *     summary: Citation routes health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Citation routes healthy
 */
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Citation routes healthy' });
});

/**
 * @swagger
 * /api/citations/generate:
 *   post:
 *     summary: Generate a citation using AI (Gemini)
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateCitationRequest'
 *     responses:
 *       200:
 *         description: Citation generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CitationResult'
 *       401:
 *         description: Not authorized
 *       429:
 *         description: Rate limit exceeded (10 requests / 15 min)
 */
router.post('/generate', protect, generateLimiter, validate(generateSchema), generateCitation);

/**
 * @swagger
 * /api/citations/lookup-doi:
 *   post:
 *     summary: Look up metadata from a DOI via CrossRef
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DOILookupRequest'
 *     responses:
 *       200:
 *         description: Metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     metadata:
 *                       $ref: '#/components/schemas/CitationBreakdown'
 *                     formatted:
 *                       type: string
 *       404:
 *         description: DOI not found
 */
router.post('/lookup-doi', protect, validate(lookupDOISchema), async (req, res, next) => {
  try {
    const crossrefService = require('../services/crossref.service');
    const metadata = await crossrefService.lookupDOI(req.body.doi);
    const formatted = crossrefService.formatForInput(metadata);
    res.json({ success: true, data: { metadata, formatted } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/citations/lookup-url:
 *   post:
 *     summary: Scrape metadata from a URL (Open Graph tags)
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/URLLookupRequest'
 *     responses:
 *       200:
 *         description: Metadata scraped successfully
 *       400:
 *         description: URL unreachable
 */
router.post('/lookup-url', protect, validate(lookupURLSchema), async (req, res, next) => {
  try {
    const axios = require('axios');
    const cheerio = require('cheerio');

    const response = await axios.get(req.body.url, {
      timeout: 10000,
      headers: { 'User-Agent': 'CitationGenerator/1.0' },
    });

    const $ = cheerio.load(response.data);

    const metadata = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
      authors: $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content') || '',
      siteName: $('meta[property="og:site_name"]').attr('content') || '',
      publishedDate: $('meta[property="article:published_time"]').attr('content') || $('meta[name="date"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
      url: req.body.url,
    };

    const parts = [];
    if (metadata.title) parts.push(`Title: ${metadata.title}`);
    if (metadata.authors) parts.push(`Author: ${metadata.authors}`);
    if (metadata.siteName) parts.push(`Site: ${metadata.siteName}`);
    if (metadata.publishedDate) parts.push(`Published: ${metadata.publishedDate}`);
    if (metadata.url) parts.push(`URL: ${metadata.url}`);

    res.json({ success: true, data: { metadata, formatted: parts.join('\n') } });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(400).json({ success: false, message: 'Could not reach the provided URL' });
    }
    next(error);
  }
});

// ========== PubMed Lookup Routes ==========

/**
 * @swagger
 * /api/citations/lookup-pmid:
 *   post:
 *     summary: Look up metadata from a PubMed ID (PMID)
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pmid]
 *             properties:
 *               pmid:
 *                 type: string
 *                 example: "33073741"
 *     responses:
 *       200:
 *         description: PubMed metadata retrieved
 *       404:
 *         description: PMID not found
 */
router.post('/lookup-pmid', protect, validate(lookupPMIDSchema), async (req, res, next) => {
  try {
    const pubmedService = require('../services/pubmed.service');
    const metadata = await pubmedService.lookupPMID(req.body.pmid);
    const formatted = pubmedService.formatForInput(metadata);
    res.json({ success: true, data: { metadata, formatted } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/citations/search-pubmed:
 *   post:
 *     summary: Search PubMed by keyword and return the top result
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "CRISPR gene editing 2020"
 *     responses:
 *       200:
 *         description: PubMed search result metadata
 */
router.post('/search-pubmed', protect, validate(searchPubMedSchema), async (req, res, next) => {
  try {
    const pubmedService = require('../services/pubmed.service');
    const metadata = await pubmedService.searchPubMed(req.body.query);
    const formatted = pubmedService.formatForInput(metadata);
    res.json({ success: true, data: { metadata, formatted } });
  } catch (error) {
    next(error);
  }
});

// ========== OpenLibrary Lookup Routes ==========

/**
 * @swagger
 * /api/citations/lookup-isbn:
 *   post:
 *     summary: Look up book metadata by ISBN via Open Library
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isbn]
 *             properties:
 *               isbn:
 *                 type: string
 *                 example: "9780134685991"
 *     responses:
 *       200:
 *         description: Book metadata retrieved
 *       404:
 *         description: ISBN not found
 */
router.post('/lookup-isbn', protect, validate(lookupISBNSchema), async (req, res, next) => {
  try {
    const openLibraryService = require('../services/openlibrary.service');
    const metadata = await openLibraryService.lookupISBN(req.body.isbn);
    const formatted = openLibraryService.formatForInput(metadata);
    res.json({ success: true, data: { metadata, formatted } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/citations/search-books:
 *   post:
 *     summary: Search books by title/author via Open Library
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "Design Patterns Gang of Four"
 *     responses:
 *       200:
 *         description: Book search result metadata
 */
router.post('/search-books', protect, validate(searchBooksSchema), async (req, res, next) => {
  try {
    const openLibraryService = require('../services/openlibrary.service');
    const metadata = await openLibraryService.searchBooks(req.body.query);
    const formatted = openLibraryService.formatForInput(metadata);
    res.json({ success: true, data: { metadata, formatted } });
  } catch (error) {
    next(error);
  }
});

// ========== Google Scholar Search Route ==========

/**
 * @swagger
 * /api/citations/search-scholar:
 *   post:
 *     summary: Search Google Scholar (best-effort scrape)
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "attention is all you need"
 *     responses:
 *       200:
 *         description: Scholar search result metadata (best-effort)
 *       429:
 *         description: Rate limited by Google
 */
router.post('/search-scholar', protect, validate(searchScholarSchema), async (req, res, next) => {
  try {
    const scholarService = require('../services/scholar.service');
    const metadata = await scholarService.searchScholar(req.body.query);
    const formatted = scholarService.formatForInput(metadata);
    res.json({ success: true, data: { metadata, formatted } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/citations:
 *   post:
 *     summary: Save a citation to library
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaveCitationRequest'
 *     responses:
 *       201:
 *         description: Citation saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Citation'
 *   get:
 *     summary: Get all saved citations (paginated, searchable, filterable)
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search across title, authors, raw input
 *       - in: query
 *         name: style
 *         schema:
 *           $ref: '#/components/schemas/CitationStyle'
 *       - in: query
 *         name: sourceType
 *         schema:
 *           $ref: '#/components/schemas/SourceType'
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: ['-createdAt', 'oldest', 'alpha']
 *           default: '-createdAt'
 *     responses:
 *       200:
 *         description: List of citations with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Citation'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.post('/', protect, validate(saveSchema), saveCitation);
router.get('/', protect, getCitations);

/**
 * @swagger
 * /api/citations/{id}:
 *   get:
 *     summary: Get a single citation by ID
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Citation found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Citation'
 *       404:
 *         description: Citation not found
 *   delete:
 *     summary: Delete a citation
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Citation deleted
 *       404:
 *         description: Citation not found
 */
router.get('/:id', protect, getCitation);
router.delete('/:id', protect, deleteCitation);

/**
 * @swagger
 * /api/citations/bulk:
 *   delete:
 *     summary: Bulk delete citations
 *     tags: [Citations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Citations deleted
 */
router.delete('/bulk', protect, validate(bulkDeleteSchema), bulkDeleteCitations);

module.exports = router;
