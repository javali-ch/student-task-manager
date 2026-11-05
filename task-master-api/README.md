# Task Master API

A complete, production-ready full-stack RESTful Task Management API built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and containerized with **Docker & Docker Compose**.

---

## Features

- **User Authentication**: Secure user registration and login using **bcryptjs** password hashing and **JSON Web Tokens (JWT)**.
- **Protected Endpoints**: Custom Bearer token authorization middleware verifying JWT tokens and attaching `req.userId`.
- **Task CRUD Operations**: Complete Create, Read, Update, and Delete operations strictly isolated per authenticated user (prevents IDOR vulnerabilities).
- **Advanced Filtering & Pagination**: Filter tasks by `status` and `priority`, search in title/description, sort, and paginate results.
- **Production-Ready Architecture**: Clean separation of concerns with controllers, models, routes, middleware, and configuration.
- **Containerized**: Multi-stage Dockerfile and Docker Compose orchestration with persistent MongoDB storage and automated health checks.

---

## Folder Structure

```text
task-master-api/
├── package.json
├── server.js
├── config/
│   └── db.js
├── models/
│   ├── User.js
│   └── Task.js
├── controllers/
│   ├── authController.js
│   └── taskController.js
├── routes/
│   ├── authMiddleware.js
│   ├── authRoutes.js
│   └── taskRoutes.js
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── .dockerignore
```

---

## Quick Start with Docker Compose (Recommended)

Run the full stack (API + MongoDB) with a single command:

```bash
# Navigate to the project directory
cd task-master-api

# Build and start services in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop all services
docker compose down
```

The API will be available at `http://localhost:5000` and MongoDB at `localhost:27017`.

---

## Local Development (Without Docker)

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB Atlas URI

### Installation & Run

```bash
cd task-master-api

# 1. Install dependencies
npm install

# 2. Configure environment variables (.env is pre-configured, or copy .env.example)
# cp .env.example .env

# 3. Start development server with nodemon
npm run dev

# Or start standard production server
npm start
```

---

## API Endpoints Reference

### 1. Root & Health Check
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | API root info & version |
| `GET` | `/health` | Public | Server uptime and health check |

---

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Access | Body Parameters | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `name`, `email`, `password` | Register a new user & receive JWT token |
| `POST` | `/api/auth/login` | Public | `email`, `password` | Login with credentials & receive JWT token |
| `GET` | `/api/auth/me` | Private | *None* (Bearer Token) | Get current authenticated user profile |

#### Register Request Example:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com", "password": "securepassword123"}'
```

#### Login Request Example:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "securepassword123"}'
```

---

### 3. Task Management (`/api/tasks`)
All task routes require the `Authorization: Bearer <TOKEN>` header.

| Method | Endpoint | Access | Description | Query / Body Params |
|---|---|---|---|---|
| `POST` | `/api/tasks` | Private | Create a new task | Body: `title` (required), `description`, `status`, `priority` |
| `GET` | `/api/tasks` | Private | List all tasks of logged-in user | Query: `status`, `priority`, `search`, `page`, `limit`, `sort` |
| `GET` | `/api/tasks/:id` | Private | Get single task by ID | Path param: `:id` |
| `PUT` | `/api/tasks/:id` | Private | Update task by ID | Body: `title`, `description`, `status`, `priority` |
| `DELETE` | `/api/tasks/:id` | Private | Delete task by ID | Path param: `:id` |

#### Create Task Example:
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "title": "Complete Task Manager API",
    "description": "Ensure Docker Compose and tests run cleanly",
    "status": "in-progress",
    "priority": "high"
  }'
```

#### List Tasks (with filtering and sorting):
```bash
curl -X GET "http://localhost:5000/api/tasks?status=in-progress&priority=high" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Update Task Example:
```bash
curl -X PUT http://localhost:5000/api/tasks/<TASK_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "status": "completed"
  }'
```

#### Delete Task Example:
```bash
curl -X DELETE http://localhost:5000/api/tasks/<TASK_ID> \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## Allowed Values & Schemas

### Task Schema:
- `user`: Mongoose ObjectId referencing `User` model (auto-assigned from JWT).
- `title`: String, required, max length 200 characters.
- `description`: String, optional, max length 2000 characters.
- `status`: String enum: `'pending'`, `'in-progress'`, `'completed'` (Default: `'pending'`).
- `priority`: String enum: `'low'`, `'medium'`, `'high'` (Default: `'medium'`).
- `timestamps`: `createdAt`, `updatedAt` (automatically generated).

### User Schema:
- `name`: String, required.
- `email`: String, required, unique, validated email format.
- `password`: String, required, hashed with bcrypt (min 6 characters).
- `timestamps`: `createdAt`, `updatedAt`.

