const Citation = require('../models/Citation');
const exportService = require('../services/export.service');

// ==================== EXPORT BIBLIOGRAPHY ====================
const exportBibliography = async (req, res, next) => {
  try {
    const { citationIds, style, format, sort } = req.body;

    // Fetch citations
    let citations;
    if (citationIds && citationIds.length > 0) {
      citations = await Citation.find({
        _id: { $in: citationIds },
        userId: req.user._id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide citation IDs to export',
      });
    }

    if (citations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No citations found',
      });
    }

    // Sort citations
    if (sort === 'alpha') {
      citations.sort((a, b) => {
        const titleA = (a.breakdown?.title || a.citation || '').toLowerCase();
        const titleB = (b.breakdown?.title || b.citation || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
    }
    // Default: order of appearance (no additional sorting needed)

    // Export based on format
    const effectiveStyle = style || citations[0]?.style || 'apa';

    switch (format) {
      case 'txt': {
        const text = exportService.exportAsText(citations, effectiveStyle);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename=bibliography.txt');
        return res.send(text);
      }

      case 'docx': {
        const buffer = await exportService.exportAsDocx(citations, effectiveStyle);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=bibliography.docx');
        return res.send(buffer);
      }

      case 'pdf': {
        const pdfBuffer = await exportService.exportAsPdf(citations, effectiveStyle);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=bibliography.pdf');
        return res.send(pdfBuffer);
      }

      case 'bib': {
        const bibtex = exportService.exportAsBibtex(citations);
        res.setHeader('Content-Type', 'application/x-bibtex');
        res.setHeader('Content-Disposition', 'attachment; filename=bibliography.bib');
        return res.send(bibtex);
      }

      case 'ris': {
        const ris = exportService.exportAsRis(citations);
        res.setHeader('Content-Type', 'application/x-research-info-systems');
        res.setHeader('Content-Disposition', 'attachment; filename=bibliography.ris');
        return res.send(ris);
      }

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export format. Supported: txt, docx, pdf, bib, ris',
        });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { exportBibliography };
