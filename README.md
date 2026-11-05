[Screen Recording 2026-11-05 205329.zip](https://github.com/user-attachments/files/34433148/Screen.Recording.2026-11-05.205329.zip)


# Task Master — Full-Stack Project & Task Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A production-ready, full-stack Task Management platform built with a high-performance **Node.js & Express REST API**, a **MongoDB (Mongoose)** database layer, and a minimal, responsive **React (Vite)** frontend. Containerized end-to-end using **Docker and Docker Compose**.

---

## 📽️ Demo Video & Walkthrough

<!-- ========================================================================= -->
<!-- 💡 DRAG AND DROP YOUR DEMO VIDEO BELOW THIS LINE IN GITHUB WEB EDITOR:   -->
<!-- GitHub will automatically upload it and convert it into a playable video. -->
<!-- Alternatively, place your video file (e.g. demo.mp4) in this repo and use:-->
<!-- <video src="./demo.mp4" controls width="100%"></video>                    -->
<!-- ========================================================================= -->

> ### 🎥 Watch Live Demo
> 
> *Drag and drop your video file right here (e.g., .mp4, .mov, or .webm)*
> 
> <!-- DRAG_AND_DROP_VIDEO_HERE -->

---

## 🌟 Key Features

### 1. 📊 Productivity Analytics Summary Header
- **Live Performance Dashboard**: Real-time KPI widget tracking:
  - **Total Tasks**: Overall workload distribution (pending vs. in-progress).
  - **Completed Tasks**: Delivered items to date.
  - **Completion Rate (%)**: Dynamically computed progress ratio.
  - **High-Priority Pending**: Automated alert counter for urgent uncompleted tasks.

### 2. 📅 Due Dates, Time Tracking & Overdue Detection
- **Time Estimation**: Log planned effort in hours (`estimatedHours`) per task.
- **Calendar Due Dates**: Set exact completion deadlines (`dueDate`).
- **Smart Overdue Badges**: Automatically detects and flags expired tasks with a high-visibility `⚠ Overdue` badge when deadlines pass.

### 3. 🔀 Dual View Modes (List View vs. 3-Column Kanban Board)
- **Interactive Kanban Board**: 3-column workflow (**Pending** $\rightarrow$ **In Progress** $\rightarrow$ **Completed**) with per-column task counters.
  - **Native Drag-and-Drop**: Built using lightweight HTML5 Drag-and-Drop with visual drop-zone highlights.
  - **Quick Action Controls**: Move tasks forward and backward with dedicated buttons (`Start →`, `← Back`, `Done ✓`, `↺ Reopen`).
- **Filtered List View**: Clean chronological list with real-time status filters (`All`, `Pending`, `In Progress`, `Completed`).

### 4. 🔒 Enterprise Security & Clean Data Isolation
- **Stateless JWT Authentication**: Secure login and registration with token expiration handling.
- **Password Hashing**: Strong `bcryptjs` salt rounds (10).
- **Anti-IDOR Protection**: Every read, update, and delete query is strictly scoped to the authenticated user's ID (`user: req.userId`).
- **Protected Routes**: Custom Express bearer-token middleware with clear 401 error reporting.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Native CSS3 (Minimal Light-Blue Theme), HTML5 Drag & Drop API |
| **Backend** | Node.js, Express.js, REST Architecture |
| **Database** | MongoDB 6.0, Mongoose ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **DevOps & Containers** | Docker (Multi-stage Alpine), Docker Compose |

---

## 📁 Repository Structure

```text
taskmanager/
├── README.md                          # Main project documentation
│
├── task-master-api/                   # Express.js REST API & MongoDB Backend
│   ├── config/
│   │   └── db.js                      # Mongoose database connection & event handling
│   ├── controllers/
│   │   ├── authController.js          # User registration, login, and profile
│   │   └── taskController.js          # Task CRUD, filters, metrics, and security
│   ├── models/
│   │   ├── Task.js                    # Task schema (title, status, priority, dueDate, etc.)
│   │   └── User.js                    # User schema (name, unique email, hashed password)
│   ├── routes/
│   │   ├── authMiddleware.js          # JWT Bearer token authentication middleware
│   │   ├── authRoutes.js              # /api/auth endpoints
│   │   └── taskRoutes.js              # /api/tasks endpoints
│   ├── server.js                      # Server entry point, CORS, middlewares, error handlers
│   ├── package.json                   # Backend dependencies & scripts
│   ├── .env                           # Local environment configuration
│   ├── .env.example                   # Environment template
│   ├── Dockerfile                     # Multi-stage production Docker image
│   ├── docker-compose.yml             # Orchestration for API + MongoDB services
│   └── .dockerignore                  # Docker build exclusion rules
│
└── client/                            # React + Vite Frontend
    ├── src/
    │   ├── App.jsx                    # Core app: Auth state, Analytics, Kanban, List View
    │   ├── main.jsx                   # React root mount
    │   └── index.css                  # Custom minimal light-blue/white design system
    ├── index.html                     # HTML5 template
    ├── vite.config.js                 # Vite config (Port 3000 + /api proxy to Backend)
    └── package.json                   # Frontend dependencies & scripts
```

---

## 🚀 Quick Start Guide

### Option 1: Run with Docker Compose (Recommended)

Run both the API and an isolated MongoDB database with a single command:

```bash
# 1. Navigate to the backend directory
cd task-master-api

# 2. Build and launch services in detached mode
docker compose up -d --build

# 3. Check running status and health checks
docker compose ps

# 4. View real-time logs
docker compose logs -f
```

- **API Endpoint:** `http://localhost:5000`
- **MongoDB:** `localhost:27017`
- **Stop Containers:** `docker compose down`

---

### Option 2: Run Locally (Without Docker)

#### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally at `mongodb://localhost:27017` (or MongoDB Atlas connection string)

#### 1. Start the Backend API
```bash
cd task-master-api

# Install dependencies
npm install

# Start server in development mode (with nodemon)
npm run dev
# Server will run at http://localhost:5000
```

#### 2. Start the Frontend Client
```bash
# Open a new terminal window
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Application will launch at http://localhost:3000
```

---

