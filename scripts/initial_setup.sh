#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_USERNAME="your_docker_hub_username"

cd $PROJECT_ROOT

print_blue()   { echo -e "\e[44;97m $1 \e[0m"; }
print_yellow() { echo -e "\e[43;30m $1 \e[0m"; }

print_blue "Starting deployment process..."

print_yellow "MySQL Deployment"

cd $PROJECT_ROOT/mysql

kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "RabbitMQ Deployment"

cd $PROJECT_ROOT/rabbitmq

kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "Auth Service Deployment"

cd $PROJECT_ROOT/auth_user

docker build -t $DOCKER_USERNAME/mms_auth:latest .
docker push $DOCKER_USERNAME/mms_auth:latest
kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "Courses Service Deployment"

cd $PROJECT_ROOT/courses

docker build -t $DOCKER_USERNAME/mms_courses:latest .
docker push $DOCKER_USERNAME/mms_courses:latest
kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "Gateway Service Deployment"

cd $PROJECT_ROOT/gateway

docker build -t $DOCKER_USERNAME/mms_gateway:latest .
docker push $DOCKER_USERNAME/mms_gateway:latest
kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "Marks Service Deployment"

cd $PROJECT_ROOT/marks

docker build -t $DOCKER_USERNAME/mms_marks:latest .
docker push $DOCKER_USERNAME/mms_marks:latest
kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "Analytics Service Deployment"

cd $PROJECT_ROOT/analytics

docker build -t $DOCKER_USERNAME/mms_analytics:latest .
docker push $DOCKER_USERNAME/mms_analytics:latest
kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "Policy Service Deployment"

cd $PROJECT_ROOT/policy

docker build -t $DOCKER_USERNAME/mms_policy:latest .
docker push $DOCKER_USERNAME/mms_policy:latest
kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "Frontend Deployment"

cd $PROJECT_ROOT/frontend
    
docker build -t $DOCKER_USERNAME/mms_frontend:latest .
docker push $DOCKER_USERNAME/mms_frontend:latest
kubectl delete -f ./manifests/
kubectl apply -f ./manifests/

print_yellow "Deployment process completed."