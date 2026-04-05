const axios = require('axios');

class OpenLibraryService {
  constructor() {
    this.booksUrl = 'https://openlibrary.org/api/books';
    this.searchUrl = 'https://openlibrary.org/search.json';
  }

  /**
   * Look up book metadata by ISBN.
   * @param {string} isbn - ISBN-10 or ISBN-13 (dashes are stripped)
   * @returns {Object} Structured metadata
   */
  async lookupISBN(isbn) {
    // Clean ISBN — remove dashes, spaces, and common prefixes
    let cleanIsbn = isbn.trim().replace(/[-\s]/g, '');
    cleanIsbn = cleanIsbn.replace(/^ISBN[:\s]*/i, '');

    if (!/^(\d{10}|\d{13}|\d{9}X)$/i.test(cleanIsbn)) {
      throw new Error('Invalid ISBN format. Please enter a valid ISBN-10 or ISBN-13.');
    }

    try {
      const response = await axios.get(this.booksUrl, {
        params: {
          bibkeys: `ISBN:${cleanIsbn}`,
          format: 'json',
          jscmd: 'data',
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'CitationGenerator/1.0 (mailto:contact@citationgen.com)',
        },
      });

      const key = `ISBN:${cleanIsbn}`;
      const book = response.data[key];

      if (!book) {
        throw new Error('ISBN not found. Please check the ISBN and try again.');
      }

      return this._parseBookData(book, cleanIsbn);
    } catch (error) {
      if (error.message && error.message.includes('ISBN not found')) throw error;
      if (error.message && error.message.includes('Invalid ISBN')) throw error;
      throw new Error('Failed to fetch metadata from Open Library. Please try again.');
    }
  }

  /**
   * Search for a book by title/author query and return the top result.
   * @param {string} query - Search query (title, author, or combination)
   * @returns {Object} Structured metadata
   */
  async searchBooks(query) {
    try {
      const response = await axios.get(this.searchUrl, {
        params: {
          q: query,
          limit: 1,
          fields: 'title,author_name,first_publish_year,publisher,isbn,number_of_pages_median,edition_count,key,cover_i',
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'CitationGenerator/1.0 (mailto:contact@citationgen.com)',
        },
      });

      const docs = response.data?.docs;
      if (!docs || docs.length === 0) {
        throw new Error('No books found for your query. Try different keywords.');
      }

      const doc = docs[0];

      // Extract ISBN (prefer ISBN-13)
      let isbn = '';
      if (doc.isbn && doc.isbn.length > 0) {
        isbn = doc.isbn.find((i) => i.length === 13) || doc.isbn[0];
      }

      return {
        authors: doc.author_name ? doc.author_name.join('; ') : '',
        year: doc.first_publish_year ? String(doc.first_publish_year) : '',
        title: doc.title || '',
        source: '',
        doi: '',
        url: doc.key ? `https://openlibrary.org${doc.key}` : '',
        volume: '',
        issue: '',
        pages: doc.number_of_pages_median ? String(doc.number_of_pages_median) : '',
        publisher: doc.publisher ? doc.publisher[0] : '',
        edition: doc.edition_count ? `${doc.edition_count} editions` : '',
        isbn,
        type: 'book',
      };
    } catch (error) {
      if (error.message && error.message.includes('No books found')) throw error;
      throw new Error('Open Library search failed. Please try again.');
    }
  }

  /**
   * Parse book data from the Open Library Books API response.
   */
  _parseBookData(book, isbn) {
    // Authors
    const authors = book.authors
      ? book.authors.map((a) => a.name).join('; ')
      : '';

    // Year
    const year = book.publish_date || '';

    // Publisher
    const publisher = book.publishers
      ? book.publishers.map((p) => p.name).join('; ')
      : '';

    // Pages
    const pages = book.number_of_pages ? String(book.number_of_pages) : '';

    // Subjects (first 3)
    const subjects = book.subjects
      ? book.subjects.slice(0, 3).map((s) => s.name).join(', ')
      : '';

    return {
      authors,
      year,
      title: book.title || '',
      source: '',
      doi: '',
      url: book.url || `https://openlibrary.org/isbn/${isbn}`,
      volume: '',
      issue: '',
      pages,
      publisher,
      edition: '',
      isbn,
      subjects,
      type: 'book',
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
    if (metadata.publisher) parts.push(`Publisher: ${metadata.publisher}`);
    if (metadata.pages) parts.push(`Pages: ${metadata.pages}`);
    if (metadata.isbn) parts.push(`ISBN: ${metadata.isbn}`);
    if (metadata.edition) parts.push(`Edition: ${metadata.edition}`);
    if (metadata.subjects) parts.push(`Subjects: ${metadata.subjects}`);
    if (metadata.url) parts.push(`URL: ${metadata.url}`);
    return parts.join('\n');
  }
}

module.exports = new OpenLibraryService();
