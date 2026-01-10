# ADR 006 — Project Persistence & Database

Date: 2025-01-XX  
Status: Accepted

## Context

We need to:
1. Store projects persistently on the backend so users can save and load their graphs
2. Associate projects with users (projects belong to users)
3. Allow users to switch between multiple projects
4. Provide a foundation for future multi-user features (sharing, collaboration)
5. Support migration from SQLite (POC) to PostgreSQL (production) without code changes

Current architecture:
- WebSocket sessions store graph state in memory only (`apps/backend/src/api/session.py`)
- Sessions are destroyed on disconnect (graph state is lost)
- No persistent storage for projects
- No user association

## Decision

Implement persistent storage using **SQLAlchemy ORM** with **SQLite for POC**, migrating to **PostgreSQL for production**:
- **SQLAlchemy**: Database abstraction layer that allows switching databases without code changes
- **SQLite**: File-based database for POC (no separate process required, easy development)
- **PostgreSQL**: Production-ready database (switch by changing `DATABASE_URL`)
- **Alembic**: Database migrations for schema versioning

### Database Models

**Users Table**:
- `id`: UUID (primary key)
- `email`: String (unique)
- `username`: String (unique)
- `created_at`: DateTime
- `projects`: Relationship to Project (one-to-many)

**Projects Table**:
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to User)
- `name`: String
- `description`: Text (optional)
- `dsl_data`: Text (JSON string of GraphDSL)
- `created_at`: DateTime
- `updated_at`: DateTime
- `owner`: Relationship to User (many-to-one)

### Architecture Layers

```
apps/backend/
  src/
    db/
      database.py          # Database connection (SQLAlchemy engine, session factory)
      models.py            # SQLAlchemy models (User, Project)
      migrations/          # Alembic migrations
    api/
      projects.py          # REST API for project CRUD
      session.py           # Updated: add project_id to Session
      websocket.py         # Updated: add load_project, save_project commands
    main.py                # Updated: initialize DB on startup
```

### Separation: Sessions vs Projects

**Sessions** (existing, in-memory):
- Temporary storage for WebSocket connections
- One session = one WebSocket connection
- Graph state stored in memory
- Destroyed on disconnect
- Used for real-time editing and simulation

**Projects** (new, persistent):
- Permanent storage in database
- Belong to users
- Persist between sessions
- Can be loaded into a session for editing

**Relationship**:
- Session can load a project from DB (`load_project` command)
- Session can save its state to a project (`save_project` command)
- Session maintains optional `project_id` to track which project it's working with

### REST API for Projects

**`/api/projects`** endpoints:
- `GET /api/projects/`: List all projects for current user
- `GET /api/projects/{project_id}`: Get project by ID
- `POST /api/projects/`: Create new project
- `PUT /api/projects/{project_id}`: Update existing project
- `DELETE /api/projects/{project_id}`: Delete project

**Authentication** (POC stub):
- Temporarily: `get_current_user()` returns test user
- Future: JWT or session-based authentication

### WebSocket Integration

**New WebSocket commands**:
- `load_project`: Load project from DB into current session
  - Payload: `{ project_id: string }`
  - Response: `{ type: "project_loaded", payload: { project_id, graph } }`
- `save_project`: Save current session state to project
  - Payload: `{ project_id?: string, name?: string }` (if project_id missing, creates new)
  - Response: `{ type: "project_saved", payload: { project_id } }`

### Database Initialization

- SQLite file created automatically on first connection (`apps/backend/ygrecon.db`)
- Tables created via Alembic migrations (not `Base.metadata.create_all()` in production)
- `init_db()` in `main.py` for first-time setup (before migrations)

### Migrations

- Use Alembic for schema versioning
- Migrations stored in `apps/backend/src/db/migrations/versions/`
- `alembic upgrade head` applies all pending migrations
- Schema changes require new migration file

## Alternatives Considered

1) **In-memory only (current state)**
   - Pros: Simple, no database setup
   - Cons: No persistence, lost on disconnect, no multi-project support

2) **JSON files on filesystem**
   - Pros: Simple, human-readable
   - Cons: Hard to query, no relationships, file system limitations, no concurrent access

3) **MongoDB/NoSQL**
   - Pros: Flexible schema, easy to store JSON
   - Cons: Less mature ecosystem for Python/FastAPI, harder to enforce relationships

4) **Direct PostgreSQL from start**
   - Pros: Production-ready immediately
   - Cons: Requires separate database server for development, more setup complexity

## Consequences

### Positive
- Projects persist between sessions
- Users can have multiple projects
- Easy to add features like sharing, collaboration, version history
- Database abstraction allows switching to PostgreSQL with config change only
- Alembic migrations ensure schema consistency across environments

### Negative
- Additional dependency (SQLAlchemy, Alembic)
- Need to handle database migrations in deployment
- SQLite file needs backup strategy (production should use PostgreSQL)

### Migration Path

**From current state (no persistence)**:
1. Add database models and infrastructure
2. Keep sessions as-is (in-memory)
3. Add REST API for project CRUD
4. Add WebSocket commands to load/save projects
5. Frontend can work with in-memory sessions (no change)
6. Frontend adds project management UI (separate iteration)

**From SQLite to PostgreSQL**:
1. Install PostgreSQL driver (`psycopg2` or `asyncpg`)
2. Set `DATABASE_URL` environment variable to PostgreSQL connection string
3. Run Alembic migrations on PostgreSQL database
4. No code changes required (SQLAlchemy abstraction)

### Future Enhancements

- User authentication (JWT or session-based)
- Project sharing between users
- Version history / audit log
- Project templates
- Import/export from filesystem (already exists, can be integrated with projects)
