# FocusFlow Backend API

This is the backend API for the FocusFlow productivity application. It provides authentication, task management, and productivity tracking features.

## Tech Stack

- Node.js with Express
- TypeScript
- PostgreSQL database
- Prisma ORM
- JWT Authentication
- Docker for development

## Getting Started

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose (for the development database)

### Setup

1. Clone the repository
2. Create a `.env` file in the root directory with the following content:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/focusflow"
JWT_SECRET="your-secret-key-here-change-in-production"
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

3. Install dependencies:

```bash
npm install
```

4. Start the PostgreSQL database with Docker:

```bash
docker-compose up -d
```

5. Run Prisma migrations:

```bash
npm run prisma:migrate
```

6. Start the development server:

```bash
npm run dev
```

The server will be available at http://localhost:4000.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/logout` - Logout a user
- `GET /api/auth/me` - Get current user info

### Settings

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Tasks

- `GET /api/tasks` - Get all tasks for a user
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion
- `PATCH /api/tasks/:id/pomodoro` - Increment completed pomodoros

### Task History

- `GET /api/history` - Get task history with optional filtering
- `POST /api/history` - Log completed pomodoro session

### Reports

- `GET /api/reports/summary` - Get user productivity summary
- `GET /api/reports/focus-time` - Get focus time data for charts

## Development

### Database Migrations

To create a new migration after changing the schema:

```bash
npm run prisma:migrate
```

### Build for Production

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist` directory.

### Run in Production

```bash
npm start
``` 