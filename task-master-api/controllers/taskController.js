const mongoose = require('mongoose');
const Task = require('../models/Task');

const ALLOWED_STATUSES = ['pending', 'in-progress', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];

/**
 * @desc    Create a new task for the authenticated user
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, estimatedHours } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid task title.',
      });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed values: ${ALLOWED_STATUSES.join(', ')}.`,
      });
    }

    if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority '${priority}'. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}.`,
      });
    }

    let parsedHours = 0;
    if (estimatedHours !== undefined && estimatedHours !== '') {
      parsedHours = Number(estimatedHours);
      if (isNaN(parsedHours) || parsedHours < 0) {
        return res.status(400).json({
          success: false,
          message: 'Estimated hours must be a non-negative number.',
        });
      }
    }

    let parsedDueDate = null;
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format.',
        });
      }
      parsedDueDate = d;
    }

    const task = await Task.create({
      user: req.userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: parsedDueDate,
      estimatedHours: parsedHours,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task,
    });
  } catch (error) {
    console.error(`[CreateTask Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating task.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all tasks belonging to the authenticated user
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res) => {
  try {
    const { status, priority, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    // Filter strictly by the authenticated user's ID
    const query = { user: req.userId };

    if (status && ALLOWED_STATUSES.includes(status)) {
      query.status = status;
    }

    if (priority && ALLOWED_PRIORITIES.includes(priority)) {
      query.priority = priority;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(query).sort(sort).skip(skip).limit(limitNum),
      Task.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      tasks,
    });
  } catch (error) {
    console.error(`[GetTasks Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving tasks.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get a single task by ID (only if owned by authenticated user)
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.',
      });
    }

    // Query task scoped to user to prevent IDOR vulnerabilities
    const task = await Task.findOne({ _id: id, user: req.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(`[GetTaskById Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving task.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update an existing task (only if owned by authenticated user)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.',
      });
    }

    const { title, description, status, priority, dueDate, estimatedHours } = req.body;

    // Validate enum values if provided
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed values: ${ALLOWED_STATUSES.join(', ')}.`,
      });
    }

    if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority '${priority}'. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}.`,
      });
    }

    // Build update object with whitelisted fields
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        updateData.dueDate = null;
      } else {
        const d = new Date(dueDate);
        if (isNaN(d.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due date format.',
          });
        }
        updateData.dueDate = d;
      }
    }

    if (estimatedHours !== undefined) {
      const parsedHours = Number(estimatedHours);
      if (isNaN(parsedHours) || parsedHours < 0) {
        return res.status(400).json({
          success: false,
          message: 'Estimated hours must be a non-negative number.',
        });
      }
      updateData.estimatedHours = parsedHours;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update (title, description, status, priority, dueDate, estimatedHours).',
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task,
    });
  } catch (error) {
    console.error(`[UpdateTask Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error updating task.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete a task by ID (only if owned by authenticated user)
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format.',
      });
    }

    const task = await Task.findOneAndDelete({ _id: id, user: req.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
      deletedTaskId: id,
    });
  } catch (error) {
    console.error(`[DeleteTask Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting task.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};

