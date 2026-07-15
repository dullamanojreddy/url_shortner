# Deployment Guide

## Local Development (Docker Compose)

```bash
# 1. Clone
git clone https://github.com/yourname/distributed-url-shortener.git
cd distributed-url-shortener

# 2. Configure
cp .env.example .env
# Edit: set strong JWT_SECRET, POSTGRES_PASSWORD, ADMIN_JWT_SECRET

# 3. Start all services
docker-compose up --build

# 4. View logs
docker-compose logs -f redirect-service

# 5. Scale redirect service
docker-compose up --scale redirect-service=3
```

## Production: Kubernetes

See the `k8s/` directory for all manifests.

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl create secret generic url-shortener-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=REDIS_URL="redis://..." \
  --from-literal=JWT_SECRET="..." \
  --from-literal=ADMIN_JWT_SECRET="..." \
  -n url-shortener

# Deploy
kubectl apply -f k8s/

# Check rollout
kubectl rollout status deployment/redirect-service -n url-shortener

# Scale
kubectl scale deployment redirect-service --replicas=5 -n url-shortener
```

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. **On push to any branch**: lint + typecheck all services
2. **On push to main**: build Docker images, push to registry, deploy to staging
3. **On tag (v*)**: deploy to production

## Environment Variables

See `.env.example` for all required vars. Never commit `.env` to git.

## Health Checks

All services expose `GET /healthz` returning `{"status":"ok","service":"<name>"}`.

Kubernetes liveness probes use this endpoint with:
- `initialDelaySeconds: 15`
- `periodSeconds: 10`
- `failureThreshold: 3`
