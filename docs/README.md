# GMS - Grading Management System

Welcome to the GMS documentation! This system is a microservices-based Grading Management System designed to handle courses, marks, analytics, and policies with a modern frontend.

## Documentation Sections

- [**System Architecture**](./architecture.md): Understand how the system is built, the technologies used, and how services communicate.
- [**Setup Guide**](./setup.md): Instructions on how to set up the project locally and deploy it to a Kubernetes cluster.
- [**Folder Structure**](./folder_structure.md): A detailed look at the project's organization and what each directory contains.
- [**Development Guide**](./development.md): Coding standards, testing protocols, and best practices for developing on GMS.
- [**Contribution Guide**](./contribution.md): How to contribute to the project, branching strategies, and PR processes.

## Quick Start

If you just want to get the system up and running on Kubernetes:

```bash
# Ensure your Kubernetes cluster (e.g., Minikube) is running
./deploy-k8s.sh
```

For more detailed setup instructions, see the [Setup Guide](./setup.md).

## Core Services

| Service | Description |
| --- | --- |
| **Gateway** | The entry point for all API requests, handling routing and initial validation. |
| **Auth User** | Manages user authentication, profiles, and roles. |
| **Courses** | Handles course creation, enrollment, and management. |
| **Marks** | Manages student marks and grading. |
| **Analytics** | Provides insights and data visualization for marks and performance. |
| **Policy** | Manages grading policies and rules. |
| **Frontend** | Modern Next.js application for users and administrators. |
