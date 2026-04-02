# Deployment

## Docker

### Build image

```bash
make docker-build
# or: IMAGE_TAG=1.2.0 make docker-build
```

### Run locally

```bash
make docker-run
# By default, this maps host port 3000 to the container's current HTTP port 3000
# MCP endpoint: http://localhost:3000/mcp
# Health: http://localhost:3000/health
```

### docker-compose (recommended for local/staging)

```bash
make compose-up     # build + start in background
make compose-down   # stop
```

### Push to registry

```bash
make docker-push REGISTRY=your.registry.io
# Pushes: your.registry.io/workflow-os-mcp:1.0.0
```

---

## Kubernetes

### Prerequisites

- `kubectl` configured for your cluster
- Docker image pushed to a registry accessible from the cluster
- Update `k8s/deployment.yaml` → `image:` to point to your registry image

### Apply all manifests

```bash
make k8s-apply
```

This creates (in order):
1. `workflow-os` namespace
2. `workflow-os-mcp-config` ConfigMap
3. `workflow-os-mcp` Deployment (2 replicas)
4. `workflow-os-mcp` ClusterIP Service (port 80 → 3000)

### Useful commands

```bash
make k8s-status      # kubectl get all -n workflow-os
make k8s-logs        # tail pod logs
make k8s-restart     # rolling restart (zero-downtime)
make k8s-delete      # tear down all resources
```

### Update image after a new build

```bash
# Push new image
make docker-push REGISTRY=your.registry.io IMAGE_TAG=1.1.0

# Update deployment.yaml image tag, then apply
make k8s-apply

# Or trigger a rolling restart if image tag hasn't changed (uses :latest)
make k8s-restart
```

### Resource sizing

Defaults in `k8s/deployment.yaml`:

| Resource | Request | Limit |
|---|---|---|
| CPU | 100m | 500m |
| Memory | 128Mi | 256Mi |

Adjust per your cluster capacity. The server is stateless — scale replicas freely.

---

## Environment Variables

All env vars are set in `k8s/configmap.yaml` for Kubernetes or in `docker-compose.yml` for Compose.

| Variable | Default | Description |
|---|---|---|
| `MCP_TRANSPORT` | `http` | Always `http` in Docker/K8s |
| `MCP_PORT` | defaults to `3000` | Current container HTTP port |
| `WORKFLOW_ROOT` | bundled `workflows/` | Override to mount external files |
| `NODE_ENV` | `production` | Node environment |

---

## Health Check Endpoints

| Path | Method | Description |
|---|---|---|
| `/health` | GET | Returns `{"status":"ok"}` — used by K8s liveness + readiness probes |
| `/mcp` | POST | MCP JSON-RPC messages |
| `/mcp` | GET | MCP SSE stream |
| `/mcp` | DELETE | Session teardown (no-op in stateless mode) |

### Manual health check

```bash
# If you keep the current local Docker/K8s port mapping, use:
curl http://localhost:3000/health
# {"status":"ok","service":"workflow-os-mcp","transport":"http"}
```
