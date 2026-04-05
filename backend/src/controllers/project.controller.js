const Project = require('../models/Project');
const Citation = require('../models/Citation');

// ==================== CREATE PROJECT ====================
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      userId: req.user._id,
      name,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Project created',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET ALL PROJECTS ====================
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    // Add citation count to each project
    const projectsWithCount = projects.map((p) => ({
      ...p,
      citationCount: p.citationIds ? p.citationIds.length : 0,
    }));

    res.json({
      success: true,
      data: projectsWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET SINGLE PROJECT WITH CITATIONS ====================
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('citationIds');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE PROJECT ====================
const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, description },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      message: 'Project updated',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE PROJECT ====================
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Remove project reference from citations
    await Citation.updateMany(
      { projectIds: project._id },
      { $pull: { projectIds: project._id } }
    );

    res.json({
      success: true,
      message: 'Project deleted',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADD CITATION TO PROJECT ====================
const addCitationToProject = async (req, res, next) => {
  try {
    const { citationId } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check citation exists and belongs to user
    const citation = await Citation.findOne({
      _id: citationId,
      userId: req.user._id,
    });

    if (!citation) {
      return res.status(404).json({
        success: false,
        message: 'Citation not found',
      });
    }

    // Avoid duplicates
    if (project.citationIds.includes(citationId)) {
      return res.status(400).json({
        success: false,
        message: 'Citation already in this project',
      });
    }

    project.citationIds.push(citationId);
    await project.save();

    // Also add project reference to citation
    if (!citation.projectIds.includes(project._id)) {
      citation.projectIds.push(project._id);
      await citation.save();
    }

    res.json({
      success: true,
      message: 'Citation added to project',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== REMOVE CITATION FROM PROJECT ====================
const removeCitationFromProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    project.citationIds = project.citationIds.filter(
      (id) => id.toString() !== req.params.citationId
    );
    await project.save();

    // Remove project reference from citation
    await Citation.findByIdAndUpdate(req.params.citationId, {
      $pull: { projectIds: project._id },
    });

    res.json({
      success: true,
      message: 'Citation removed from project',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GENERATE SHARE LINK ====================
const shareProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const token = project.generateShareToken();
    await project.save();

    const shareUrl = `${process.env.FRONTEND_URL}/projects/shared/${token}`;

    res.json({
      success: true,
      message: 'Share link generated',
      data: { shareUrl, shareToken: token },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VIEW SHARED PROJECT (public) ====================
const viewSharedProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      shareToken: req.params.token,
      isPublic: true,
    }).populate('citationIds');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Shared project not found or link has expired',
      });
    }

    res.json({
      success: true,
      data: {
        name: project.name,
        description: project.description,
        citations: project.citationIds,
        citationCount: project.citationIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addCitationToProject,
  removeCitationFromProject,
  shareProject,
  viewSharedProject,
};
