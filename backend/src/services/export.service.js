const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const PDFDocument = require('pdfkit');

class ExportService {
  /**
   * Export citations as plain text.
   */
  exportAsText(citations, style) {
    const lines = citations.map((c, i) => {
      if (['vancouver', 'ieee'].includes(style)) {
        return `[${i + 1}] ${c.citation}`;
      }
      return c.citation;
    });
    return lines.join('\n\n');
  }

  /**
   * Export as Word document (.docx) — returns a Buffer.
   */
  async exportAsDocx(citations, style) {
    const paragraphs = [];

    paragraphs.push(
      new Paragraph({
        text: 'Bibliography',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    citations.forEach((c, i) => {
      let text = c.citation;
      if (['vancouver', 'ieee'].includes(style)) {
        text = `[${i + 1}] ${c.citation}`;
      }

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              font: 'Times New Roman',
              size: 24, // 12pt
            }),
          ],
          spacing: { after: 200 },
          indent: { left: 720, hanging: 720 }, // hanging indent
        })
      );
    });

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Export as PDF — returns a Buffer.
   */
  async exportAsPdf(citations, style) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 72 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(18).font('Helvetica-Bold').text('Bibliography', { align: 'center' });
      doc.moveDown(1);

      // Citations
      doc.fontSize(12).font('Times-Roman');

      citations.forEach((c, i) => {
        let text = c.citation;
        if (['vancouver', 'ieee'].includes(style)) {
          text = `[${i + 1}] ${c.citation}`;
        }
        doc.text(text, { indent: 36, hangingIndent: 36 });
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  /**
   * Export as BibTeX (.bib).
   */
  exportAsBibtex(citations) {
    return citations
      .map((c, i) => {
        const key = this._generateBibKey(c, i);
        const type = this._mapSourceType(c.sourceType);
        const b = c.breakdown || {};

        const fields = [];
        if (b.authors) fields.push(`  author = {${b.authors}}`);
        if (b.title) fields.push(`  title = {${b.title}}`);
        if (b.year) fields.push(`  year = {${b.year}}`);
        if (b.source) fields.push(`  journal = {${b.source}}`);
        if (b.volume) fields.push(`  volume = {${b.volume}}`);
        if (b.issue) fields.push(`  number = {${b.issue}}`);
        if (b.pages) fields.push(`  pages = {${b.pages}}`);
        if (b.publisher) fields.push(`  publisher = {${b.publisher}}`);
        if (b.doi) fields.push(`  doi = {${b.doi}}`);
        if (b.url) fields.push(`  url = {${b.url}}`);

        return `@${type}{${key},\n${fields.join(',\n')}\n}`;
      })
      .join('\n\n');
  }

  /**
   * Export as RIS format.
   */
  exportAsRis(citations) {
    return citations
      .map((c) => {
        const b = c.breakdown || {};
        const lines = [];

        lines.push(`TY  - ${this._mapSourceTypeRIS(c.sourceType)}`);
        if (b.authors) {
          b.authors.split(';').forEach((a) => {
            lines.push(`AU  - ${a.trim()}`);
          });
        }
        if (b.title) lines.push(`TI  - ${b.title}`);
        if (b.year) lines.push(`PY  - ${b.year}`);
        if (b.source) lines.push(`JO  - ${b.source}`);
        if (b.volume) lines.push(`VL  - ${b.volume}`);
        if (b.issue) lines.push(`IS  - ${b.issue}`);
        if (b.pages) {
          const [sp, ep] = b.pages.split('-');
          if (sp) lines.push(`SP  - ${sp.trim()}`);
          if (ep) lines.push(`EP  - ${ep.trim()}`);
        }
        if (b.publisher) lines.push(`PB  - ${b.publisher}`);
        if (b.doi) lines.push(`DO  - ${b.doi}`);
        if (b.url) lines.push(`UR  - ${b.url}`);
        lines.push('ER  - ');

        return lines.join('\n');
      })
      .join('\n\n');
  }

  // ---------- Helpers ----------

  _generateBibKey(citation, index) {
    const b = citation.breakdown || {};
    const firstAuthor = b.authors
      ? b.authors.split(/[,;]/)[0].trim().split(' ').pop() || 'unknown'
      : 'unknown';
    const year = b.year || 'nd';
    return `${firstAuthor}${year}_${index + 1}`.replace(/\s/g, '');
  }

  _mapSourceType(sourceType) {
    const map = {
      journal: 'article',
      book: 'book',
      'book-chapter': 'incollection',
      website: 'misc',
      thesis: 'phdthesis',
      conference: 'inproceedings',
    };
    return map[sourceType] || 'misc';
  }

  _mapSourceTypeRIS(sourceType) {
    const map = {
      journal: 'JOUR',
      book: 'BOOK',
      'book-chapter': 'CHAP',
      website: 'ELEC',
      thesis: 'THES',
      conference: 'CONF',
    };
    return map[sourceType] || 'GEN';
  }
}

module.exports = new ExportService();
