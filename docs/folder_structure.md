# Folder Structure

The GMS project is organized as a monorepo containing multiple microservices, infrastructure configurations, and a frontend application.

## Root Directory

```text
GMS/
├── analytics/          # Analytics microservice
├── auth_user/          # Authentication & User microservice
├── courses/            # Courses management microservice
├── frontend/           # Next.js frontend application
├── gateway/            # API Gateway service
├── marks/              # Marks & Assessments microservice
├── mysql/              # MySQL initialization & manifests
├── policy/             # Policy & Grading rules microservice
├── rabbitmq/           # RabbitMQ configurations & manifests
├── docs/               # Project documentation (You are here)
├── scripts/            # Helper scripts
├── .github/            # CI/CD workflows
├── deploy.sh           # Main deployment script
├── deploy-k8s.sh       # Kubernetes specific deployment script
└── run_tests.py        # Master test runner script
```

## Typical Microservice Structure

Most backend services (e.g., `marks`, `courses`, `policy`) follow this pattern:

```text
service_name/
├── models/             # Database models and Pydantic schemas
├── routes/             # FastAPI route definitions
├── utils/              # Helper functions and shared logic
├── tests/              # Unit and integration tests
├── manifests/          # Kubernetes deployment YAMLs
├── Dockerfile          # Container definition
├── requirements.txt    # Python dependencies
└── server.py           # Application entry point
```

## Frontend Structure

The frontend is a modern Next.js application using the App Router.

```text
frontend/
├── app/                # Next.js App Router (pages and layouts)
├── components/         # Reusable React components
├── hooks/              # Custom React hooks
├── lib/                # Shared utilities and configurations
├── public/             # Static assets (images, icons)
├── services/           # API client services
├── __tests__/          # Frontend test suite
├── manifests/          # K8s manifests for frontend deployment
└── tailwind.config.ts  # Tailwind CSS configuration
```

## Infrastructure Structure

- **`mysql/`**: Contains `init.sql` for setting up the initial database schema and `manifests/` for K8s deployment.
- **`rabbitmq/`**: Contains manifests for setting up the message broker.
