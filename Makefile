.PHONY: help install build build-watch typecheck lint lint-fix format test test-watch test-coverage clean \
        docker-build docker-run docker-stop docker-push compose-up compose-down \
        k8s-apply k8s-delete k8s-status k8s-logs k8s-restart

IMAGE_NAME  ?= workflow-os-mcp
IMAGE_TAG   ?= 1.0.0
REGISTRY    ?= ""
FULL_IMAGE  := $(if $(REGISTRY),$(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG),$(IMAGE_NAME):$(IMAGE_TAG))
K8S_NS      := workflow-os
PORT        ?= 3000

# ─── Help ─────────────────────────────────────────────────────────────────────
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} \
	     /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ─── Development ──────────────────────────────────────────────────────────────
install: ## Install dependencies
	pnpm install

build: ## Compile TypeScript to dist/
	pnpm run build

build-watch: ## Compile TypeScript in watch mode
	pnpm run build:watch

typecheck: ## Run TypeScript type checking (no emit)
	pnpm run typecheck

lint: ## Run ESLint
	pnpm run lint

lint-fix: ## Run ESLint with auto-fix
	pnpm run lint-fix

format: ## Format source files with Prettier
	pnpm run format

test: ## Run all tests
	pnpm run test

test-watch: ## Run tests in watch mode
	pnpm run test:watch

test-coverage: ## Run tests with coverage report
	pnpm run test:coverage

clean: ## Remove dist/ and coverage/
	pnpm run clean
	rm -rf coverage

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-build: build ## Build Docker image (runs TS build first)
	docker build -t $(FULL_IMAGE) .

docker-run: ## Run Docker container locally (HTTP mode, port $(PORT))
	docker run --rm -p $(PORT):3000 \
	  -e MCP_TRANSPORT=http \
	  -e MCP_PORT=3000 \
	  --name workflow-os-mcp \
	  $(FULL_IMAGE)

docker-stop: ## Stop the running Docker container
	docker stop workflow-os-mcp || true

docker-push: ## Push Docker image to registry
	@if [ -z "$(REGISTRY)" ]; then echo "Error: REGISTRY is not set. Run: make docker-push REGISTRY=your.registry.io"; exit 1; fi
	docker push $(FULL_IMAGE)

compose-up: ## Start with docker-compose
	docker compose up --build -d

compose-down: ## Stop docker-compose
	docker compose down

# ─── Kubernetes ───────────────────────────────────────────────────────────────
k8s-apply: ## Apply all K8s manifests
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/deployment.yaml
	kubectl apply -f k8s/service.yaml

k8s-delete: ## Delete all K8s resources
	kubectl delete -f k8s/ --ignore-not-found

k8s-status: ## Show status of K8s deployment
	kubectl get all -n $(K8S_NS)

k8s-logs: ## Tail logs from K8s deployment
	kubectl logs -n $(K8S_NS) -l app.kubernetes.io/name=workflow-os-mcp -f

k8s-restart: ## Restart K8s deployment (rolling restart)
	kubectl rollout restart deployment/workflow-os-mcp -n $(K8S_NS)
