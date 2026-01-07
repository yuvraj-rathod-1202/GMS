#!/bin/bash
set -e

cd auth_user

docker build -t yrrathod/mms_auth:latest .
docker push yrrathod/mms_auth:latest

kubectl delete -f ./manifests || true
kubectl apply -f ./manifests

cd ../courses

docker build -t yrrathod/mms_courses:latest .
docker push yrrathod/mms_courses:latest

kubectl delete -f ./manifests || true
kubectl apply -f ./manifests

cd ../gateway

docker build -t yrrathod/mms_gateway:latest .
docker push yrrathod/mms_gateway:latest

kubectl delete -f ./manifests || true
kubectl apply -f ./manifests

cd ../marks

docker build -t yrrathod/mms_marks:latest .
docker push yrrathod/mms_marks:latest

kubectl delete -f ./manifests || true
kubectl apply -f ./manifests

# cd ../analytics

# docker build -t yrrathod/mms_analytics:latest .
# docker push yrrathod/mms_analytics:latest

# kubectl delete -f ./manifests || true
# kubectl apply -f ./manifests

# cd ../policy

# docker build -t yrrathod/mms_policy:latest .
# docker push yrrathod/mms_policy:latest

# kubectl delete -f ./manifests || true
# kubectl apply -f ./manifests

# cd ../rabbitmq

# kubectl delete -f ./manifests || true
# kubectl apply -f ./manifests