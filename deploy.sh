#!/bin/bash
set -e

print_blue()   { echo -e "\e[44;97m $1 \e[0m"; }
print_yellow() { echo -e "\e[43;30m $1 \e[0m"; }

print_blue "Starting deployment process..."

# print_yellow "RabbitMQ Deployment"

# cd rabbitmq

# kubectl delete -f ./manifests || true
# kubectl apply -f ./manifests

print_yellow "Auth Service Deployment"

cd auth_user

docker build -t yrrathod/mms_auth:latest .
docker push yrrathod/mms_auth:latest
kubectl rollout restart deployment auth

print_yellow "Courses Service Deployment"

cd ../courses

docker build -t yrrathod/mms_courses:latest .
docker push yrrathod/mms_courses:latest
kubectl rollout restart deployment courses

print_yellow "Gateway Service Deployment"

cd ../gateway

docker build -t yrrathod/mms_gateway:latest .
docker push yrrathod/mms_gateway:latest
kubectl rollout restart deployment gateway

print_yellow "Marks Service Deployment"

cd ../marks

docker build -t yrrathod/mms_marks:latest .
docker push yrrathod/mms_marks:latest
kubectl rollout restart deployment marks

print_yellow "Analytics Service Deployment"

cd ../analytics

docker build -t yrrathod/mms_analytics:latest .
docker push yrrathod/mms_analytics:latest
kubectl rollout restart deployment analytics

print_yellow "Policy Service Deployment"

cd ../policy

docker build -t yrrathod/mms_policy:latest .
docker push yrrathod/mms_policy:latest
kubectl rollout restart deployment policy

print_yellow "Frontend Deployment"

cd ../frontend

docker build -t yrrathod/mms_frontend:latest .
docker push yrrathod/mms_frontend:latest
kubectl rollout restart deployment frontend

print_yellow "Deployment process completed."