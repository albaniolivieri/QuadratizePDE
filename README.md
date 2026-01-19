# QuadratizePDE

A web application for quadratizing PDEs (Partial Differential Equations) using the QuPDE library.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Python + FastAPI
- **PDE Library**: QuPDE
- **Orchestration**: Docker Compose

## Quick Start

1. Make sure you have Docker and Docker Compose installed

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Development

### Backend
- Located in `./backend`
- FastAPI application with hot-reload enabled
- Includes QuPDE library for PDE quadratization

### Frontend
- Located in `./frontend`
- React + TypeScript with Vite
- Hot-reload enabled for development

## Project Structure

```
QuadratizePDE/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /quadratize` - Quadratize a PDE (coming soon)

## License

MIT
