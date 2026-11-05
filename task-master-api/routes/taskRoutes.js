const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const authMiddleware = require('./authMiddleware');

// Protect all task endpoints with authentication middleware
router.use(authMiddleware);

// Task collection routes: list tasks and create a new task
router.route('/')
  .get(getTasks)
  .post(createTask);

// Single task entity routes: read, update, and delete
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;

