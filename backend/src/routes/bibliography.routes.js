const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const Joi = require('joi');
const { exportBibliography } = require('../controllers/bibliography.controller');

// ---------- Validation Schema ----------

const exportSchema = Joi.object({
  citationIds: Joi.array().items(Joi.string()).min(1).required(),
  style: Joi.string().valid('apa', 'mla', 'chicago', 'harvard', 'vancouver', 'ieee').optional(),
  format: Joi.string().valid('txt', 'docx', 'pdf', 'bib', 'ris').required(),
  sort: Joi.string().valid('alpha', 'appearance').optional(),
});

// ---------- Routes ----------

/**
 * @swagger
 * /api/bibliography/health:
 *   get:
 *     summary: Bibliography routes health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Bibliography routes healthy
 */
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Bibliography routes healthy' });
});

/**
 * @swagger
 * /api/bibliography/export:
 *   post:
 *     summary: Export bibliography in various formats
 *     description: Export selected citations as TXT, DOCX, PDF, BibTeX, or RIS file
 *     tags: [Bibliography]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExportBibliographyRequest'
 *     responses:
 *       200:
 *         description: File download (Content-Type varies by format)
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *           application/x-bibtex:
 *             schema:
 *               type: string
 *           application/x-research-info-systems:
 *             schema:
 *               type: string
 *       400:
 *         description: No citation IDs provided or invalid format
 *       404:
 *         description: No citations found
 */
router.post('/export', protect, validate(exportSchema), exportBibliography);

module.exports = router;
