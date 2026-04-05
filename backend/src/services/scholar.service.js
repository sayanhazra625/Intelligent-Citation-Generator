const axios = require('axios');
const cheerio = require('cheerio');

class ScholarService {
  constructor() {
    this.baseUrl = 'https://scholar.google.com/scholar';
    this._lastRequestTime = 0;
    this._minRequestInterval = 5000; // 5 seconds between requests
  }

  /**
   * Search Google Scholar by query and scrape the top result.
   * Best-effort — may fail if Google blocks the request.
   *
   * @param {string} query - Search query (e.g. "attention is all you need")
   * @returns {Object} Structured metadata (partial — Scholar doesn't expose all fields)
   */
  async searchScholar(query) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this._lastRequestTime;
    if (timeSinceLastRequest < this._minRequestInterval) {
      const waitTime = this._minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this._lastRequestTime = Date.now();

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: query,
          num: 3,
          hl: 'en',
        },
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
        maxRedirects: 3,
      });

      // Check for CAPTCHA / block page
      if (
        response.data.includes('unusual traffic') ||
        response.data.includes('captcha') ||
        response.data.includes('CAPTCHA')
      ) {
        throw new Error(
          'Google Scholar is temporarily blocking requests. Please try again later or enter the citation details manually.'
        );
      }

      return this._parseScholarHtml(response.data);
    } catch (error) {
      if (error.message && error.message.includes('Google Scholar is temporarily')) {
        throw error;
      }
      if (error.response && error.response.status === 429) {
        throw new Error(
          'Google Scholar rate limit reached. Please wait a moment and try again.'
        );
      }
      throw new Error(
        'Google Scholar search failed. This is a best-effort feature — try entering details manually or use PubMed/DOI lookup instead.'
      );
    }
  }

  /**
   * Parse Google Scholar search results HTML.
   */
  _parseScholarHtml(html) {
    const $ = cheerio.load(html);

    const results = [];

    $('div.gs_r.gs_or.gs_scl').each((i, el) => {
      if (i >= 1) return; // Only take the top result

      const titleEl = $(el).find('h3.gs_rt a');
      const title = titleEl.text().trim();
      const link = titleEl.attr('href') || '';

      // Author/source line (e.g. "J Smith, A Jones - Nature, 2020 - nature.com")
      const infoLine = $(el).find('div.gs_a').text().trim();
      const parsed = this._parseInfoLine(infoLine);

      // Snippet
      const snippet = $(el).find('div.gs_rs').text().trim();

      // Cited by count
      const citedByText = $(el).find('div.gs_fl a').filter((_, a) => {
        return $(a).text().includes('Cited by');
      }).text();
      const citedByMatch = citedByText.match(/Cited by (\d+)/);
      const citedBy = citedByMatch ? parseInt(citedByMatch[1], 10) : 0;

      // PDF link
      const pdfLink = $(el).find('div.gs_or_ggsm a').attr('href') || '';

      results.push({
        title,
        link,
        ...parsed,
        snippet: snippet.substring(0, 250),
        citedBy,
        pdfLink,
      });
    });

    if (results.length === 0) {
      throw new Error('No Google Scholar results found for your query.');
    }

    const top = results[0];

    return {
      authors: top.authors || '',
      year: top.year || '',
      title: top.title || '',
      source: top.source || '',
      doi: '',
      url: top.link || '',
      volume: '',
      issue: '',
      pages: '',
      publisher: top.publisherDomain || '',
      edition: '',
      citedBy: top.citedBy,
      pdfLink: top.pdfLink,
      type: 'journal-article',
    };
  }

  /**
   * Parse the Google Scholar info line (authors - source, year - domain).
   * Example: "V Mnih, K Kavukcuoglu, D Silver… - Nature, 2015 - nature.com"
   */
  _parseInfoLine(line) {
    if (!line) return {};

    const parts = line.split(' - ');

    let authors = '';
    let source = '';
    let year = '';
    let publisherDomain = '';

    if (parts.length >= 1) {
      // First part is authors (may contain "…")
      authors = parts[0].trim().replace(/…/g, 'et al.');
    }

    if (parts.length >= 2) {
      // Second part typically contains "Journal, Year"
      const sourceYear = parts[1].trim();
      const yearMatch = sourceYear.match(/,?\s*(\d{4})\s*$/);
      if (yearMatch) {
        year = yearMatch[1];
        source = sourceYear.replace(yearMatch[0], '').trim();
      } else {
        source = sourceYear;
      }
    }

    if (parts.length >= 3) {
      // Third part is typically the domain
      publisherDomain = parts[2].trim();
    }

    return { authors, source, year, publisherDomain };
  }

  /**
   * Format metadata into a human-readable string for the textarea.
   */
  formatForInput(metadata) {
    const parts = [];
    if (metadata.authors) parts.push(`Authors: ${metadata.authors}`);
    if (metadata.year) parts.push(`Year: ${metadata.year}`);
    if (metadata.title) parts.push(`Title: ${metadata.title}`);
    if (metadata.source) parts.push(`Source: ${metadata.source}`);
    if (metadata.url) parts.push(`URL: ${metadata.url}`);
    if (metadata.citedBy) parts.push(`Cited by: ${metadata.citedBy}`);
    if (metadata.pdfLink) parts.push(`PDF: ${metadata.pdfLink}`);
    return parts.join('\n');
  }
}

module.exports = new ScholarService();
