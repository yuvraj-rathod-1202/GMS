# Setup Guide

This guide will help you get the Grading Management System (GMS) up and running on your local machine.

## Prerequisites

Ensure you have the following installed:
- **Docker** & **Docker Compose**
- **Kubernetes** (e.g., [Minikube](https://minikube.sigs.k8s.io/docs/start/))
- **kubectl**
- **Node.js** (v18+) & **npm**
- **Python** (3.9+)
- **Git**

## Kubernetes Deployment

For a full system deployment using Kubernetes:

### 1. Start Minikube
```bash
minikube start
minikube tunnel # Required for LoadBalancer services
```

### 2. Deploy All Services
Use the provided deployment scripts:

```bash
# To build and deploy everything
./scripts/initial_setup.sh
```

### 3. Access the Application

Once the deployments are ready, you can access the system. The frontend and backend are consolidated under a single ingress for ease of access without host configuration.

#### Get the Service IP
If you are using Minikube, the external IP will be available via the tunnel:

```bash
# In a separate terminal
minikube tunnel
```

Then, find the external IP of the ingress (look for `frontend-ingress` or `gateway-ingress`):
```bash
kubectl get ingress
```

Access the application in your browser using the IP address: `http://<EXTERNAL-IP>/`.

#### Backend API Access
The backend services are accessible via the `/api` prefix on the same IP:
- **Frontend URL**: `http://<EXTERNAL-IP>/`
- **Backend API URL**: `http://<EXTERNAL-IP>/api`

If this does not work then try to access the frontend on `http://localhost/` and the backend on `http://localhost/api`.

The system is configured to route all requests starting with `/api` to the Gateway service, which then handles internal microservice routing.

## Running Tests

To run the full test suite across all microservices:

```bash
python run_tests.py all
```

For frontend specific tests:
```bash
cd frontend
npm test
```
