#!/bin/bash

# Deployment script for manual deployment or debugging
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
IMAGE_TAG=$(git rev-parse --short HEAD)
REGISTRY="ghcr.io"
IMAGE_PREFIX="yuvraj-rathod-1202/mms"

echo "=========================================="
echo "Deploying MMS to Kubernetes"
echo "Environment: $ENVIRONMENT"
echo "Image Tag: $IMAGE_TAG"
echo "=========================================="

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo "Error: kubectl not found. Please install kubectl."
        exit 1
    fi
}

# Function to check cluster connectivity
check_cluster() {
    echo "Checking cluster connectivity..."
    if ! kubectl cluster-info &> /dev/null; then
        echo "Error: Cannot connect to Kubernetes cluster."
        exit 1
    fi
    echo "✓ Connected to cluster"
}

# Function to update image tags in manifests
update_manifests() {
    echo "Updating image tags in manifests..."
    
    for service in analytics auth_user courses frontend gateway marks notifications policy; do
        manifest_dir="${service}/manifests"
        if [ -d "$manifest_dir" ]; then
            find "$manifest_dir" -name "*-deploy.yaml" -o -name "*deploy.yaml" | while read file; do
                sed -i "s|image: .*/${service}:.*|image: ${REGISTRY}/${IMAGE_PREFIX}-${service}:${IMAGE_TAG}|g" "$file"
            done
        fi
    done
    
    echo "✓ Manifests updated"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo ""
    echo "Deploying infrastructure..."
    
    # Deploy MySQL
    if [ -d "mysql/manifests" ]; then
        echo "- Deploying MySQL..."
        kubectl apply -f mysql/manifests/
        sleep 5
    fi
    
    # Deploy RabbitMQ
    if [ -d "rabbitmq/manifests" ]; then
        echo "- Deploying RabbitMQ..."
        kubectl apply -f rabbitmq/manifests/
        sleep 5
    fi
    
    echo "✓ Infrastructure deployed"
}

# Function to deploy backend services
deploy_backend() {
    echo ""
    echo "Deploying backend services..."
    
    for service in auth_user courses gateway marks analytics policy; do
        if [ -d "${service}/manifests" ]; then
            echo "- Deploying ${service}..."
            kubectl apply -f ${service}/manifests/
        fi
    done
    
    sleep 10
    echo "✓ Backend services deployed"
}

# Function to deploy frontend
deploy_frontend() {
    echo ""
    echo "Deploying frontend..."
    
    if [ -d "frontend/manifests" ]; then
        kubectl apply -f frontend/manifests/
    fi
    
    echo "✓ Frontend deployed"
}

# Function to wait for deployments
wait_for_deployments() {
    echo ""
    echo "Waiting for deployments to be ready..."
    
    deployments=(
        "auth-user"
        "courses"
        "gateway"
        "marks"
        "analytics"
        "policy"
        "notifications"
        "frontend"
    )
    
    for deployment in "${deployments[@]}"; do
        echo "- Waiting for ${deployment}..."
        kubectl rollout status deployment/${deployment} -n default --timeout=300s || echo "Warning: ${deployment} deployment timeout"
    done
    
    echo "✓ All deployments processed"
}

# Function to show deployment status
show_status() {
    echo ""
    echo "=========================================="
    echo "Deployment Status"
    echo "=========================================="
    
    echo ""
    echo "Pods:"
    kubectl get pods -n default
    
    echo ""
    echo "Services:"
    kubectl get services -n default
    
    echo ""
    echo "Ingress:"
    kubectl get ingress -n default 2>/dev/null || echo "No ingress resources found"
    
    echo ""
    echo "=========================================="
    echo "Deployment Complete!"
    echo "=========================================="
}

# Main execution
main() {
    check_kubectl
    check_cluster
    update_manifests
    deploy_infrastructure
    deploy_backend
    deploy_frontend
    wait_for_deployments
    show_status
}

# Run main function
main
