import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE = '/api';

export default function App() {
  // Authentication State
  const [token, setToken] = useState(() => localStorage.getItem('tm_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // View Mode: 'list' or 'kanban'
  const [viewMode, setViewMode] = useState('list');

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'in-progress' | 'completed'

  // Drag and Drop State for Kanban
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeDropZone, setActiveDropZone] = useState(null);

  // New Task Form State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
  });
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    setToken('');
    setUser(null);
    setTasks([]);
  }, []);

  // Fetch tasks for authenticated user
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setTaskLoading(true);
    setTaskError('');

    try {
      const response = await fetch(`${API_BASE}/tasks?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(data.message || 'Failed to load tasks');
      }

      setTasks(data.tasks || []);
    } catch (err) {
      setTaskError(err.message);
    } finally {
      setTaskLoading(false);
    }
  }, [token, handleLogout]);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, fetchTasks]);

  // Handle Login / Registration
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
    const payload = authMode === 'register'
      ? { name: authForm.name, email: authForm.email, password: authForm.password }
      : { email: authForm.email, password: authForm.password };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('tm_token', data.token);
      localStorage.setItem('tm_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setIsSubmittingTask(true);
    setTaskError('');

    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null,
          estimatedHours: newTask.estimatedHours !== '' ? Number(newTask.estimatedHours) : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create task');
      }

      setTasks((prev) => [data.task, ...prev]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        estimatedHours: '',
      });
    } catch (err) {
      setTaskError(err.message);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Update task status directly
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task');
      }

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? data.task : t))
      );
    } catch (err) {
      setTaskError(err.message);
    }
  };

  // Cycle status in List View: pending -> in-progress -> completed -> pending
  const handleCycleStatus = (task) => {
    const nextStatusMap = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending',
    };
    const nextStatus = nextStatusMap[task.status] || 'pending';
    handleUpdateStatus(task._id, nextStatus);
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete task');
      }

      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      setTaskError(err.message);
    }
  };

  // Drag and Drop Handlers for Kanban Board
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropZone !== columnStatus) {
      setActiveDropZone(columnStatus);
    }
  };

  const handleDragLeave = () => {
    setActiveDropZone(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setActiveDropZone(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleUpdateStatus(taskId, targetStatus);
      setDraggedTaskId(null);
    }
  };

  // Productivity Analytics (dynamically calculated from tasks)
  const analytics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    const urgentPending = tasks.filter(
      (t) => t.priority === 'high' && t.status !== 'completed'
    ).length;

    return {
      total,
      completed,
      inProgress,
      pending,
      rate,
      urgentPending,
    };
  }, [tasks]);

  // Helper: check if a task is overdue
  const isTaskOverdue = (task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const due = new Date(task.dueDate);
    // Compare against the end of the due date day (local time)
    due.setHours(23, 59, 59, 999);
    return due.getTime() < Date.now();
  };

  // Helper: format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper: Next status button label for list view
  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Start →';
      case 'in-progress':
        return 'Done ✓';
      case 'completed':
        return 'Reopen ↺';
      default:
        return 'Next';
    }
  };

  // Filter tasks for List View
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  // Tasks grouped for Kanban Board
  const kanbanColumns = [
    {
      id: 'pending',
      title: 'Pending',
      tasks: tasks.filter((t) => t.status === 'pending'),
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: tasks.filter((t) => t.status === 'in-progress'),
    },
    {
      id: 'completed',
      title: 'Completed',
      tasks: tasks.filter((t) => t.status === 'completed'),
    },
  ];

  // If unauthenticated, show Clean Auth Card
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Task Master</h1>
            <p className="auth-subtitle">
              {authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
              }}
            >
              Register
            </button>
          </div>

          {authError && <div className="alert alert-error">{authError}</div>}

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={authLoading}
            >
              {authLoading
                ? 'Processing...'
                : authMode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated View
  return (
    <div>
      {/* Top Header */}
      <header className="app-header">
        <div className="header-inner">
          <span className="logo-text">Task Master</span>
          <div className="user-nav">
            <span className="user-name">
              {user?.name || user?.email || 'Logged In'}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-container">
        {taskError && (
          <div className="alert alert-error">
            {taskError}
            <button
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
              onClick={() => setTaskError('')}
            >
              ×
            </button>
          </div>
        )}

        {/* Feature 3: Productivity Analytics Summary Header */}
        <section className="analytics-grid" aria-label="Productivity Analytics Summary">
          <div className="stat-card">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{analytics.total}</span>
            <span className="stat-meta">{analytics.pending} pending, {analytics.inProgress} active</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{analytics.completed}</span>
            <span className="stat-meta">Delivered to date</span>
          </div>

          <div className="stat-card highlight-rate">
            <span className="stat-label">Completion Rate</span>
            <span className="stat-value">{analytics.rate}%</span>
            <span className="stat-meta">
              {analytics.total > 0 ? `${analytics.completed} of ${analytics.total} done` : 'No tasks created'}
            </span>
          </div>

          <div className={`stat-card ${analytics.urgentPending > 0 ? 'highlight-urgent' : ''}`}>
            <span className="stat-label">High-Priority Pending</span>
            <span className="stat-value">{analytics.urgentPending}</span>
            <span className="stat-meta">
              {analytics.urgentPending > 0 ? 'Requires immediate focus' : 'All critical tasks done'}
            </span>
          </div>
        </section>

        {/* Feature 1: Add New Task Card with Due Date & Time Tracking */}
        <section className="card">
          <h2 className="card-title">Add New Task</h2>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                type="text"
                className="form-input"
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  className="form-select"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-due-date">Due Date</label>
                <input
                  id="task-due-date"
                  type="date"
                  className="form-input"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-est-hours">Est. Hours</label>
                <input
                  id="task-est-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 2.5"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">Description (Optional)</label>
              <textarea
                id="task-desc"
                className="form-textarea"
                placeholder="Add any extra notes or requirements..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmittingTask || !newTask.title.trim()}
            >
              {isSubmittingTask ? 'Adding...' : 'Add Task'}
            </button>
          </form>
        </section>

        {/* Feature 2: Dual View Modes Bar (List View vs. Kanban Board) */}
        <div className="view-mode-bar">
          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰ List View
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              ☷ Kanban Board
            </button>
          </div>

          {/* List View Status Filters (only active in List View) */}
          {viewMode === 'list' && (
            <div className="filter-group">
              {['all', 'pending', 'in-progress', 'completed'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all'
                    ? 'All'
                    : status === 'in-progress'
                    ? 'In Progress'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Mode 1: List View */}
        {viewMode === 'list' ? (
          <section className="card">
            <div className="task-list-header">
              <h2 className="card-title" style={{ margin: 0 }}>
                Tasks ({filteredTasks.length})
              </h2>
            </div>

            {taskLoading ? (
              <div className="empty-state">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                {filterStatus === 'all'
                  ? 'No tasks yet. Create one above to get started!'
                  : `No tasks found with status '${filterStatus}'.`}
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  const formattedDue = formatDueDate(task.dueDate);

                  return (
                    <div
                      key={task._id}
                      className={`task-item status-${task.status}`}
                    >
                      <div className="task-details">
                        <div className="task-header-row">
                          <span className={`badge badge-status-${task.status}`}>
                            {task.status.replace('-', ' ')}
                          </span>
                          <span className={`badge badge-priority-${task.priority}`}>
                            {task.priority}
                          </span>
                          {overdue && (
                            <span className="badge badge-overdue">
                              ⚠ Overdue
                            </span>
                          )}
                          <span className="task-title">{task.title}</span>
                        </div>

                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}

                        {/* Meta information: Due date & estimated time */}
                        {(formattedDue || task.estimatedHours > 0) && (
                          <div className="task-meta-row">
                            {formattedDue && (
                              <span className="task-meta-item">
                                📅 Due: {formattedDue}
                              </span>
                            )}
                            {task.estimatedHours > 0 && (
                              <span className="task-meta-item">
                                ⏱ Est: {task.estimatedHours}h
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title="Click to cycle status"
                          onClick={() => handleCycleStatus(task)}
                        >
                          {getNextStatusLabel(task.status)}
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          title="Delete task"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* View Mode 2: Kanban Board */
          <div className="kanban-board">
            {kanbanColumns.map((col) => (
              <div
                key={col.id}
                className={`kanban-column ${activeDropZone === col.id ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="kanban-column-header">
                  <span className="kanban-column-title">
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                          col.id === 'pending'
                            ? '#9CA3AF'
                            : col.id === 'in-progress'
                            ? '#1976D2'
                            : '#2E7D32',
                      }}
                    />
                    {col.title}
                  </span>
                  <span className="kanban-count-pill">{col.tasks.length}</span>
                </div>

                <div className="kanban-cards-wrapper">
                  {col.tasks.length === 0 ? (
                    <div className="kanban-empty-state">
                      Drag tasks here or change status
                    </div>
                  ) : (
                    col.tasks.map((task) => {
                      const overdue = isTaskOverdue(task);
                      const formattedDue = formatDueDate(task.dueDate);

                      return (
                        <div
                          key={task._id}
                          className={`kanban-card status-${task.status}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task._id)}
                        >
                          <div className="task-header-row">
                            <span className={`badge badge-priority-${task.priority}`}>
                              {task.priority}
                            </span>
                            {overdue && (
                              <span className="badge badge-overdue">
                                ⚠ Overdue
                              </span>
                            )}
                          </div>

                          <h3 className="kanban-card-title">{task.title}</h3>

                          {task.description && (
                            <p className="kanban-card-desc">{task.description}</p>
                          )}

                          {(formattedDue || task.estimatedHours > 0) && (
                            <div className="task-meta-row" style={{ marginTop: '4px' }}>
                              {formattedDue && (
                                <span className="task-meta-item">
                                  📅 {formattedDue}
                                </span>
                              )}
                              {task.estimatedHours > 0 && (
                                <span className="task-meta-item">
                                  ⏱ {task.estimatedHours}h
                                </span>
                              )}
                            </div>
                          )}

                          <div className="kanban-card-footer">
                            <div className="kanban-move-actions">
                              {col.id === 'pending' && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  title="Move to In-Progress"
                                  onClick={() => handleUpdateStatus(task._id, 'in-progress')}
                                >
                                  Start →
                                </button>
                              )}

                              {col.id === 'in-progress' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    title="Move back to Pending"
                                    onClick={() => handleUpdateStatus(task._id, 'pending')}
                                  >
                                    ← Back
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    title="Mark as Completed"
                                    onClick={() => handleUpdateStatus(task._id, 'completed')}
                                  >
                                    Done ✓
                                  </button>
                                </>
                              )}

                              {col.id === 'completed' && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  title="Reopen task"
                                  onClick={() => handleUpdateStatus(task._id, 'pending')}
                                >
                                  ↺ Reopen
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              title="Delete task"
                              onClick={() => handleDeleteTask(task._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
