
# Trading Bot Makefile

.PHONY: help build up down logs backup deploy-do deploy-railway setup-monitoring

help: ## Show this help message
	@echo "Trading Bot Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the Docker containers
	docker-compose build

up: ## Start the trading bot
	docker-compose up -d

down: ## Stop the trading bot
	docker-compose down

logs: ## Show container logs
	docker-compose logs -f

status: ## Show container status
	docker-compose ps

restart: ## Restart the trading bot
	docker-compose restart

backup: ## Create a backup
	./scripts/backup.sh

deploy-do: ## Deploy to DigitalOcean
	./scripts/deploy-digitalocean.sh

deploy-railway: ## Deploy to Railway
	./scripts/deploy-railway.sh

setup-monitoring: ## Setup monitoring infrastructure
	./scripts/monitoring-setup.sh

clean: ## Clean up containers and images
	docker-compose down -v
	docker system prune -f

update: ## Update and restart the bot
	git pull
	docker-compose build
	docker-compose up -d

health: ## Check bot health
	curl -f http://localhost:3000/health || echo "Bot is not responding"

env-check: ## Check environment configuration
	@echo "Checking environment files..."
	@test -f .env.production && echo "✅ .env.production exists" || echo "❌ .env.production missing"
	@test -f .env.staging && echo "✅ .env.staging exists" || echo "❌ .env.staging missing"

install-deps: ## Install system dependencies
	@echo "Installing dependencies..."
	@which docker > /dev/null || (echo "Installing Docker..." && curl -fsSL https://get.docker.com | sh)
	@which docker-compose > /dev/null || (echo "Installing Docker Compose..." && pip install docker-compose)
