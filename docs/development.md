# Development Guide

This guide outlines the standards and practices for developing on the Grading Management System.

## Technology Stack

- **Backend**: Python 3.9+, FastAPI, SQLAlchemy/SQLModel, httpx.
- **Frontend**: TypeScript, Next.js 14+ (App Router), Tailwind CSS, Lucide React (Icons).
- **Database**: MySQL 8.0.
- **Messaging**: RabbitMQ.
- **Infrastructure**: Docker, Kubernetes, Helm (optional).

## Coding Standards

### Python (Backend)
- Use type hints for all function parameters and return types.
- Document complex logic with docstrings (Google or NumPy style).
- Use `Pydantic` for request validation and response serialization.
- Keep routes thin; move business logic to service layers or utility modules.

### TypeScript / React (Frontend)
- Use **functional components** and hooks.
- Strict typing: Avoid `any` at all costs. Use interfaces/types for props and state.
- Components should be modular and located in `components/`.
- Use Tailwind CSS for styling to ensure consistency.
- Implement responsive design (Mobile-first approach).

## Testing Protocol

### Backend Testing
We use `pytest` for backend testing.
- **Unit Tests**: Test individual functions and logic in isolation.
- **Integration Tests**: Test the interaction between routes and the database.
- **Mocking**: Use `unittest.mock` or `pytest-mock` to mock external service calls.

To run tests for a specific service:
```bash
cd service_name
pytest
```

### Frontend Testing
We use `Jest` and `React Testing Library`.
- Test component rendering, user interactions, and hook logic.
- Mock API calls using `msw` or manual mocks in `__tests__`.

Run frontend tests:
```bash
cd frontend
npm test
```

## Environment Variables

Always use environment variables for sensitive information (API keys, database credentials).
- Never commit `.env` files to version control.
- Add new variables to `.env.example` when introducing them.
- In Kubernetes, use **Secrets** and **ConfigMaps** to manage environment variables.
