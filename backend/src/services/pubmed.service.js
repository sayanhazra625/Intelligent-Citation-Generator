const axios = require('axios');
const cheerio = require('cheerio');

class PubMedService {
  constructor() {
    this.baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  }

  /**
   * Fetch article metadata by PubMed ID (PMID).
   * @param {string} pmid - The PubMed ID (e.g. "33073741")
   * @returns {Object} Structured metadata
   */
  async lookupPMID(pmid) {
    const cleanPmid = pmid.trim().replace(/^PMID:\s*/i, '');

    if (!/^\d+$/.test(cleanPmid)) {
      throw new Error('Invalid PMID format. A PMID should be a numeric identifier.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/efetch.fcgi`, {
        params: {
          db: 'pubmed',
          id: cleanPmid,
          retmode: 'xml',
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'CitationGenerator/1.0 (mailto:contact@citationgen.com)',
        },
      });

      return this._parseArticleXml(response.data, cleanPmid);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('PMID not found. Please check the ID and try again.');
      }
      if (error.message && error.message.includes('Invalid PMID')) throw error;
      throw new Error('Failed to fetch metadata from PubMed. Please try again.');
    }
  }

  /**
   * Search PubMed by query and return metadata for the top result.
   * @param {string} query - Search query (e.g. "CRISPR gene editing 2020")
   * @returns {Object} Structured metadata of the top result
   */
  async searchPubMed(query) {
    try {
      // Step 1: Search for PMIDs
      const searchResponse = await axios.get(`${this.baseUrl}/esearch.fcgi`, {
        params: {
          db: 'pubmed',
          term: query,
          retmax: 1,
          retmode: 'json',
          sort: 'relevance',
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'CitationGenerator/1.0 (mailto:contact@citationgen.com)',
        },
      });

      const idList = searchResponse.data?.esearchresult?.idlist;
      if (!idList || idList.length === 0) {
        throw new Error('No PubMed results found for your query. Try different keywords.');
      }

      // Step 2: Fetch details for the top result
      return await this.lookupPMID(idList[0]);
    } catch (error) {
      if (error.message && error.message.includes('No PubMed results')) throw error;
      throw new Error('PubMed search failed. Please try again.');
    }
  }

  /**
   * Parse PubMed XML response into structured metadata.
   */
  _parseArticleXml(xml, pmid) {
    const $ = cheerio.load(xml, { xmlMode: true });

    const article = $('PubmedArticle').first();
    if (!article.length) {
      throw new Error('PMID not found or returned no article data.');
    }

    // Authors
    const authorList = [];
    article.find('AuthorList Author').each((_, el) => {
      const lastName = $(el).find('LastName').text();
      const foreName = $(el).find('ForeName').text();
      const collectiveName = $(el).find('CollectiveName').text();
      if (lastName && foreName) {
        authorList.push(`${lastName}, ${foreName}`);
      } else if (collectiveName) {
        authorList.push(collectiveName);
      }
    });

    // Year
    const pubDate = article.find('PubDate');
    let year = pubDate.find('Year').text();
    if (!year) {
      const medlineDate = pubDate.find('MedlineDate').text();
      if (medlineDate) year = medlineDate.match(/\d{4}/)?.[0] || '';
    }

    // Title
    const title = article.find('ArticleTitle').first().text().replace(/\.$/, '');

    // Journal
    const journal = article.find('Journal Title').text() || 
                    article.find('MedlineJournalInfo MedlineTA').text() || '';

    // Volume, Issue, Pages
    const volume = article.find('JournalIssue Volume').text() || '';
    const issue = article.find('JournalIssue Issue').text() || '';
    const pages = article.find('MedlinePgn').text() || '';

    // DOI
    let doi = '';
    article.find('ArticleIdList ArticleId').each((_, el) => {
      if ($(el).attr('IdType') === 'doi') {
        doi = $(el).text();
      }
    });

    // PMID (from response)
    let responsePmid = pmid;
    article.find('ArticleIdList ArticleId').each((_, el) => {
      if ($(el).attr('IdType') === 'pubmed') {
        responsePmid = $(el).text();
      }
    });

    // Abstract (first 200 chars as preview)
    const abstract = article.find('AbstractText').first().text() || '';

    return {
      authors: authorList.join('; '),
      year,
      title,
      source: journal,
      doi,
      url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${responsePmid}/`,
      volume,
      issue,
      pages,
      publisher: '',
      edition: '',
      pmid: responsePmid,
      type: 'journal-article',
    };
  }

  /**
   * Format metadata into a human-readable string for the textarea.
   */
  formatForInput(metadata) {
    const parts = [];
    if (metadata.authors) parts.push(`Authors: ${metadata.authors}`);
    if (metadata.year) parts.push(`Year: ${metadata.year}`);
    if (metadata.title) parts.push(`Title: ${metadata.title}`);
    if (metadata.source) parts.push(`Journal: ${metadata.source}`);
    if (metadata.volume) parts.push(`Volume: ${metadata.volume}`);
    if (metadata.issue) parts.push(`Issue: ${metadata.issue}`);
    if (metadata.pages) parts.push(`Pages: ${metadata.pages}`);
    if (metadata.doi) parts.push(`DOI: ${metadata.doi}`);
    if (metadata.pmid) parts.push(`PMID: ${metadata.pmid}`);
    return parts.join('\n');
  }
}

module.exports = new PubMedService();
