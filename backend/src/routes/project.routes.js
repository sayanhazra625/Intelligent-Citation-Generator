const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const Joi = require('joi');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addCitationToProject,
  removeCitationFromProject,
  shareProject,
  viewSharedProject,
} = require('../controllers/project.controller');

// ---------- Validation Schemas ----------

const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).allow('').optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(1000).allow('').optional(),
}).min(1);

const addCitationSchema = Joi.object({
  citationId: Joi.string().required(),
});

// ---------- Routes ----------

/**
 * @swagger
 * /api/projects/health:
 *   get:
 *     summary: Project routes health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Project routes healthy
 */
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Project routes healthy' });
});

/**
 * @swagger
 * /api/projects/shared/{token}:
 *   get:
 *     summary: View a shared project (public, no auth required)
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shared project with citations
 *       404:
 *         description: Project not found or link expired
 */
router.get('/shared/:token', viewSharedProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all user projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects with citation counts
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
 *                     $ref: '#/components/schemas/Project'
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project created
 */
router.get('/', protect, getProjects);
router.post('/', protect, validate(createProjectSchema), createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project with all its citations
 *     tags: [Projects]
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
 *         description: Project with populated citations
 *       404:
 *         description: Project not found
 *   put:
 *     summary: Update project name or description
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
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
 *         description: Project deleted
 *       404:
 *         description: Project not found
 */
router.get('/:id', protect, getProject);
router.put('/:id', protect, validate(updateProjectSchema), updateProject);
router.delete('/:id', protect, deleteProject);

/**
 * @swagger
 * /api/projects/{id}/citations:
 *   post:
 *     summary: Add a citation to a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCitationToProjectRequest'
 *     responses:
 *       200:
 *         description: Citation added to project
 *       400:
 *         description: Citation already in project
 *       404:
 *         description: Project or citation not found
 */
router.post('/:id/citations', protect, validate(addCitationSchema), addCitationToProject);

/**
 * @swagger
 * /api/projects/{id}/citations/{citationId}:
 *   delete:
 *     summary: Remove a citation from a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: citationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Citation removed from project
 *       404:
 *         description: Project not found
 */
router.delete('/:id/citations/:citationId', protect, removeCitationFromProject);

/**
 * @swagger
 * /api/projects/{id}/share:
 *   post:
 *     summary: Generate a public share link for a project
 *     tags: [Projects]
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
 *         description: Share link generated
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
 *                     shareUrl:
 *                       type: string
 *                     shareToken:
 *                       type: string
 *       404:
 *         description: Project not found
 */
router.post('/:id/share', protect, shareProject);

module.exports = router;
