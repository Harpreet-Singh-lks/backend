const Chapter = require('../models/Chapter');
const { invalidateChapterCache } = require('../middleware/cache');

// Get all chapters with filtering and pagination
const getChapters = async (req, res) => {
  try {
    const {
      class: className,
      unit,
      status,
      subject,
      weakChapters,
      difficulty,
      search,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    const filters = {};
    if (className) filters.class = className;
    if (unit) filters.unit = parseInt(unit);
    if (status) filters.status = status;
    if (subject) filters.subject = subject;
    if (difficulty) filters.difficulty = difficulty;
    if (weakChapters !== undefined) {
      filters.weakChapters = weakChapters === 'true';
    }
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [chapters, totalChapters] = await Promise.all([
      Chapter.find(filters)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Chapter.countDocuments(filters)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalChapters / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      status: 'success',
      data: {
        chapters,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalChapters,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        },
        filters: {
          class: className,
          unit,
          status,
          subject,
          weakChapters,
          difficulty,
          search
        }
      }
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chapters'
    });
  }
};

// Get single chapter by ID
const getChapterById = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id)
      .populate('createdBy', 'name email role');

    if (!chapter) {
      return res.status(404).json({
        status: 'error',
        message: 'Chapter not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        chapter
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid chapter ID'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chapter'
    });
  }
};

// Create single chapter
const createChapter = async (req, res) => {
  try {
    const chapterData = {
      ...req.body,
      createdBy: req.user.id
    };

    const chapter = new Chapter(chapterData);
    await chapter.save();

    await chapter.populate('createdBy', 'name email');

    // Invalidate cache
    invalidateChapterCache();

    res.status(201).json({
      status: 'success',
      message: 'Chapter created successfully',
      data: {
        chapter
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create chapter'
    });
  }
};

// Bulk upload chapters from JSON file
const uploadChapters = async (req, res) => {
  try {
    const chaptersData = req.chaptersData;
    const userId = req.user.id;
    
    const results = {
      successful: [],
      failed: []
    };

    // Process each chapter
    for (let i = 0; i < chaptersData.length; i++) {
      try {
        const chapterData = {
          ...chaptersData[i],
          createdBy: userId
        };

        const chapter = new Chapter(chapterData);
        await chapter.save();
        
        results.successful.push({
          index: i,
          id: chapter._id,
          title: chapter.title
        });
      } catch (error) {
        results.failed.push({
          index: i,
          data: chaptersData[i],
          error: error.message
        });
      }
    }

    // Invalidate cache if any chapters were added
    if (results.successful.length > 0) {
      invalidateChapterCache();
    }

    const statusCode = results.failed.length > 0 ? 207 : 201; // 207 Multi-Status

    res.status(statusCode).json({
      status: results.failed.length > 0 ? 'partial_success' : 'success',
      message: `Upload completed. ${results.successful.length} chapters added, ${results.failed.length} failed.`,
      data: {
        summary: {
          total: chaptersData.length,
          successful: results.successful.length,
          failed: results.failed.length
        },
        successful: results.successful,
        failed: results.failed
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Chapter upload failed',
      error: error.message
    });
  }
};

// Update chapter
const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.createdBy;
    delete updates.createdAt;

    const chapter = await Chapter.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!chapter) {
      return res.status(404).json({
        status: 'error',
        message: 'Chapter not found'
      });
    }

    // Invalidate cache
    invalidateChapterCache();

    res.json({
      status: 'success',
      message: 'Chapter updated successfully',
      data: {
        chapter
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid chapter ID'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update chapter'
    });
  }
};

// Delete chapter
const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findByIdAndDelete(id);

    if (!chapter) {
      return res.status(404).json({
        status: 'error',
        message: 'Chapter not found'
      });
    }

    // Invalidate cache
    invalidateChapterCache();

    res.json({
      status: 'success',
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid chapter ID'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to delete chapter'
    });
  }
};

module.exports = {
  getChapters,
  getChapterById,
  createChapter,
  uploadChapters,
  updateChapter,
  deleteChapter
};