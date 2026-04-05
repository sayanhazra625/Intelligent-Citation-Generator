const axios = require('axios');

class CrossRefService {
  constructor() {
    this.baseUrl = 'https://api.crossref.org/works';
  }

  /**
   * Fetch metadata for a DOI from CrossRef API.
   * @param {string} doi - The DOI to look up (e.g. "10.1234/example")
   * @returns {Object} Structured metadata
   */
  async lookupDOI(doi) {
    // Clean DOI — remove common prefixes
    let cleanDoi = doi.trim();
    if (cleanDoi.startsWith('https://doi.org/')) {
      cleanDoi = cleanDoi.replace('https://doi.org/', '');
    } else if (cleanDoi.startsWith('http://doi.org/')) {
      cleanDoi = cleanDoi.replace('http://doi.org/', '');
    } else if (cleanDoi.startsWith('doi:')) {
      cleanDoi = cleanDoi.replace('doi:', '');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${encodeURIComponent(cleanDoi)}`, {
        headers: {
          'User-Agent': 'CitationGenerator/1.0 (mailto:contact@citationgen.com)',
        },
        timeout: 10000,
      });

      const item = response.data.message;

      // Extract authors
      let authors = '';
      if (item.author && item.author.length > 0) {
        authors = item.author
          .map((a) => {
            if (a.given && a.family) return `${a.family}, ${a.given}`;
            if (a.name) return a.name;
            return a.family || '';
          })
          .filter(Boolean)
          .join('; ');
      }

      // Extract year
      let year = '';
      if (item.published && item.published['date-parts'] && item.published['date-parts'][0]) {
        year = String(item.published['date-parts'][0][0]);
      } else if (item['published-print'] && item['published-print']['date-parts']) {
        year = String(item['published-print']['date-parts'][0][0]);
      } else if (item['published-online'] && item['published-online']['date-parts']) {
        year = String(item['published-online']['date-parts'][0][0]);
      }

      // Extract title
      const title = item.title && item.title.length > 0 ? item.title[0] : '';

      // Extract journal / container
      const source =
        item['container-title'] && item['container-title'].length > 0
          ? item['container-title'][0]
          : '';

      // Extract volume, issue, pages
      const volume = item.volume || '';
      const issue = item.issue || '';
      const pages = item.page || '';
      const publisher = item.publisher || '';
      const doi_url = item.DOI ? `https://doi.org/${item.DOI}` : '';

      return {
        authors,
        year,
        title,
        source,
        doi: item.DOI || cleanDoi,
        url: doi_url,
        volume,
        issue,
        pages,
        publisher,
        edition: '',
        type: item.type || 'journal-article',
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('DOI not found. Please check the DOI and try again.');
      }
      throw new Error('Failed to fetch metadata from CrossRef. Please try again.');
    }
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
    if (metadata.volume) parts.push(`Volume: ${metadata.volume}`);
    if (metadata.issue) parts.push(`Issue: ${metadata.issue}`);
    if (metadata.pages) parts.push(`Pages: ${metadata.pages}`);
    if (metadata.publisher) parts.push(`Publisher: ${metadata.publisher}`);
    if (metadata.doi) parts.push(`DOI: ${metadata.doi}`);
    return parts.join('\n');
  }
}

module.exports = new CrossRefService();
