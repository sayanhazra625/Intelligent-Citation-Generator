/**
 * Citation.js Service — Deterministic citation formatting engine.
 *
 * Uses Citation.js (powered by citeproc-js under the hood) for
 * style-compliant formatting of structured metadata.
 *
 * Supports: APA, MLA, Chicago, Harvard, Vancouver, IEEE
 * Exports:  BibTeX, RIS, CSL-JSON
 */

const { Cite, plugins } = require('@citation-js/core');

// Load plugins
require('@citation-js/plugin-csl');
require('@citation-js/plugin-bibtex');
require('@citation-js/plugin-ris');
require('@citation-js/plugin-doi');
require('@citation-js/plugin-pubmed');

class CitationJsService {
  constructor() {
    this._stylesLoaded = false;
    this._styleTemplateCache = {};
  }

  /**
   * Load additional CSL styles from the GitHub CSL repository.
   * Called lazily on first use.
   */
  async _ensureStyles() {
    if (this._stylesLoaded) return;

    const config = plugins.config.get('@csl');

    // Map our style keys to CSL template names
    // 'apa' and 'vancouver' are built-in to @citation-js/plugin-csl
    const stylesToFetch = {
      mla: 'modern-language-association',
      chicago: 'chicago-fullnote-bibliography',
      harvard: 'harvard-cite-them-right',
      ieee: 'ieee',
    };

    for (const [key, cslName] of Object.entries(stylesToFetch)) {
      try {
        if (!config.templates.has(key)) {
          const url = `https://raw.githubusercontent.com/citation-style-language/styles/master/${cslName}.csl`;
          const template = await Cite.util.fetchFile(url);
          config.templates.add(key, template);
          console.log(`[CitationJS] Loaded style: ${key}`);
        }
      } catch (err) {
        console.warn(`[CitationJS] Failed to load style '${key}': ${err.message}`);
      }
    }

    this._stylesLoaded = true;
  }

  /**
   * Convert our app's metadata breakdown to CSL-JSON format.
   * CSL-JSON is the standard format that citeproc-js understands.
   *
   * @param {Object} metadata - The breakdown object from our services
   * @param {string} sourceType - journal, book, website, etc.
   * @returns {Object} CSL-JSON item
   */
  metadataToCslJson(metadata, sourceType = 'journal') {
    const cslTypeMap = {
      journal: 'article-journal',
      book: 'book',
      'book-chapter': 'chapter',
      website: 'webpage',
      thesis: 'thesis',
      conference: 'paper-conference',
    };

    const item = {
      type: cslTypeMap[sourceType] || 'article-journal',
    };

    // Title
    if (metadata.title) {
      item.title = metadata.title;
    }

    // Authors — parse "LastName, FirstName; LastName2, FirstName2" format
    if (metadata.authors) {
      item.author = this._parseAuthors(metadata.authors);
    }

    // Year / Date
    if (metadata.year) {
      const year = parseInt(metadata.year, 10);
      if (!isNaN(year)) {
        item.issued = { 'date-parts': [[year]] };
      }
    }

    // Journal / Container
    if (metadata.source) {
      item['container-title'] = metadata.source;
    }

    // Volume, Issue, Pages
    if (metadata.volume) item.volume = metadata.volume;
    if (metadata.issue) item.issue = metadata.issue;
    if (metadata.pages) item.page = metadata.pages;

    // Publisher
    if (metadata.publisher) item.publisher = metadata.publisher;

    // DOI
    if (metadata.doi) item.DOI = metadata.doi;

    // URL
    if (metadata.url) item.URL = metadata.url;

    // ISBN
    if (metadata.isbn) item.ISBN = metadata.isbn;

    // Edition
    if (metadata.edition) item.edition = metadata.edition;

    // Generate a unique ID
    item.id = this._generateItemId(metadata);

    return item;
  }

  /**
   * Format structured metadata into a citation using Citation.js.
   *
   * @param {Object} metadata - The breakdown/metadata object
   * @param {string} style - apa, mla, chicago, harvard, vancouver, ieee
   * @param {string} sourceType - journal, book, website, etc.
   * @returns {Object} { citation, inTextCitation, bibtex, ris, cslJson }
   */
  async formatCitation(metadata, style = 'apa', sourceType = 'journal') {
    await this._ensureStyles();

    // Convert to CSL-JSON
    const cslItem = this.metadataToCslJson(metadata, sourceType);

    // Create Cite instance
    const cite = new Cite(cslItem);

    // Format bibliography (full reference)
    const citation = cite
      .format('bibliography', {
        format: 'text',
        template: style,
        lang: 'en-US',
      })
      .trim();

    // Format in-text citation
    let inTextCitation = '';
    try {
      inTextCitation = cite
        .format('citation', {
          format: 'text',
          template: style,
          lang: 'en-US',
        })
        .trim();
    } catch {
      // Some styles may not support in-text citation format
      // Fall back to constructing it manually
      inTextCitation = this._buildInTextFallback(metadata, style);
    }

    // Export as BibTeX
    let bibtex = '';
    try {
      bibtex = cite.format('bibtex').trim();
    } catch {
      bibtex = '';
    }

    // Export as RIS
    let ris = '';
    try {
      ris = cite.format('ris').trim();
    } catch {
      ris = '';
    }

    // Get CSL-JSON
    const cslJson = cite.format('data', { format: 'object' });

    return {
      citation,
      inTextCitation: inTextCitation || this._buildInTextFallback(metadata, style),
      bibtex,
      ris,
      cslJson,
    };
  }

  /**
   * Format from a DOI directly using Citation.js's built-in DOI resolution.
   */
  async formatFromDOI(doi, style = 'apa') {
    await this._ensureStyles();

    const cleanDoi = doi.trim()
      .replace(/^https?:\/\/doi\.org\//i, '')
      .replace(/^doi:/i, '');

    const cite = await Cite.async(cleanDoi);

    const citation = cite
      .format('bibliography', { format: 'text', template: style, lang: 'en-US' })
      .trim();

    let inTextCitation = '';
    try {
      inTextCitation = cite
        .format('citation', { format: 'text', template: style, lang: 'en-US' })
        .trim();
    } catch {
      inTextCitation = '';
    }

    const bibtex = cite.format('bibtex').trim();
    const ris = cite.format('ris').trim();
    const cslJson = cite.format('data', { format: 'object' });

    // Extract breakdown from CSL-JSON for our app
    const item = cslJson[0] || {};
    const breakdown = {
      authors: item.author
        ? item.author.map((a) => `${a.family || ''}, ${a.given || ''}`).join('; ')
        : '',
      year: item.issued?.['date-parts']?.[0]?.[0]?.toString() || '',
      title: item.title || '',
      source: item['container-title'] || '',
      doi: item.DOI || '',
      url: item.URL || '',
      volume: item.volume || '',
      issue: item.issue || '',
      pages: item.page || '',
      publisher: item.publisher || '',
      edition: item.edition || '',
    };

    return {
      citation,
      inTextCitation,
      breakdown,
      bibtex,
      ris,
      cslJson,
    };
  }

  /**
   * Batch format multiple citations (for export).
   */
  async formatBatch(items, style = 'apa') {
    await this._ensureStyles();

    const cslItems = items.map((item) =>
      this.metadataToCslJson(item.breakdown || item.metadata || {}, item.sourceType)
    );

    const cite = new Cite(cslItems);

    return {
      bibliography: cite
        .format('bibliography', { format: 'text', template: style, lang: 'en-US' })
        .trim(),
      bibtex: cite.format('bibtex').trim(),
      ris: cite.format('ris').trim(),
      cslJson: cite.format('data', { format: 'object' }),
    };
  }

  // ==================== Helpers ====================

  /**
   * Parse author string "LastName, FirstName; LastName2, FirstName2" to CSL-JSON author array.
   */
  _parseAuthors(authorStr) {
    if (!authorStr) return [];

    return authorStr
      .split(/;\s*/)
      .filter(Boolean)
      .map((author) => {
        const trimmed = author.trim();

        // Check for "LastName, FirstName" format
        if (trimmed.includes(',')) {
          const [family, ...givenParts] = trimmed.split(',');
          return {
            family: family.trim(),
            given: givenParts.join(',').trim(),
          };
        }

        // Check for "FirstName LastName" format
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          return {
            family: parts[parts.length - 1],
            given: parts.slice(0, -1).join(' '),
          };
        }

        // Single name
        return { family: trimmed };
      });
  }

  /**
   * Build a fallback in-text citation when Citation.js can't generate one.
   */
  _buildInTextFallback(metadata, style) {
    const firstAuthor = metadata.authors
      ? metadata.authors.split(/[;,]/)[0].trim()
      : 'Unknown';
    const year = metadata.year || 'n.d.';

    switch (style) {
      case 'apa':
      case 'harvard':
        return `(${firstAuthor}, ${year})`;
      case 'mla':
        return `(${firstAuthor} ${metadata.pages || ''})`.trim().replace(/\s+\)/, ')');
      case 'chicago':
        return `${firstAuthor}, "${metadata.title || ''}"`;
      case 'vancouver':
      case 'ieee':
        return `[1]`;
      default:
        return `(${firstAuthor}, ${year})`;
    }
  }

  /**
   * Generate a unique item ID from metadata.
   */
  _generateItemId(metadata) {
    const firstAuthor = metadata.authors
      ? metadata.authors.split(/[;,]/)[0].trim().replace(/\s+/g, '')
      : 'unknown';
    const year = metadata.year || 'nd';
    return `${firstAuthor}${year}`;
  }
}

module.exports = new CitationJsService();
