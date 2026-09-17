# ==========================================
# Docker Compose Commands
# ==========================================

.PHONY: up down start stop restart logs ps build pull clean db-shell

# Start all services in detached mode
up:
	docker compose up -d

# Start all services with logs
up-logs:
	docker compose up

# Stop and remove all containers
down:
	docker compose down

# Stop and remove all containers, volumes and images
down-clean:
	docker compose down -v --rmi all

# Start existing containers
start:
	docker compose start

# Stop running containers
stop:
	docker compose stop

# Restart all services
restart:
	docker compose restart

# View logs of all services
logs:
	docker compose logs -f

# View logs of database service
logs-db:
	docker compose logs -f database

# List running containers
ps:
	docker compose ps

# Build or rebuild services
build:
	docker compose build

# Build without cache
build-no-cache:
	docker compose build --no-cache

# Pull latest images
pull:
	docker compose pull

# Remove stopped containers
clean:
	docker compose rm -f

# Access database shell
db-shell:
	docker compose exec database psql -U $${DB_USER:-postgres} -d $${DB_NAME:-commerce_db}

# Create API Docker Image
create-image:
	docker build -t ecommerce-nest-api:latest .

# Run API Docker Image with .env file
run-image-envs:
	docker run -p 3000:3000 --env-file .env ecommerce-nest-api

# Generates a temporary token for AWS and passes it to docker for authentication in ECR
docker-aws-ecr-login:
	aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin

# Connects to AWS EC2 instance by ssh
connect-aws-cli-ec2:
	ssh -i ecommerce-nest-ec2.pem ec2-user@ec2-54-164-73-2.compute-1.amazonaws.com

# ==========================================
# Database Commands
# ==========================================

.PHONY: db-up db-down db-restart db-logs

# Start only database
db-up:
	docker compose up -d database

# Stop database
db-down:
	docker compose stop database

# Restart database
db-restart:
	docker compose restart database

# View database logs
db-logs:
	docker compose logs -f database

# ==========================================
# Prisma Commands
# ==========================================

.PHONY: prisma-generate prisma-migrate prisma-studio prisma-push prisma-seed

# Generate Prisma client
prisma-generate:
	pnpm prisma generate

# Run migrations
prisma-migrate:
	pnpm prisma migrate dev

# Open Prisma Studio
prisma-studio:
	pnpm prisma studio

# Push schema changes (without migration)
prisma-push:
	pnpm prisma db push

# Seed database
prisma-seed:
	pnpm prisma db seed

# Reset database
prisma-reset:
	pnpm prisma migrate reset

# ==========================================
# Development Commands
# ==========================================

.PHONY: dev dev-setup install

# Install dependencies
install:
	pnpm install

# Start development server
dev:
	pnpm run start:dev

# Full development setup (database + migrations + dev server)
dev-setup: up prisma-migrate dev

# ==========================================
# Help
# ==========================================

.PHONY: help

help:
	@echo "Docker Compose Commands:"
	@echo "  make up              - Start all services in detached mode"
	@echo "  make up-logs         - Start all services with logs"
	@echo "  make down            - Stop and remove all containers"
	@echo "  make down-clean      - Stop and remove containers, volumes and images"
	@echo "  make start           - Start existing containers"
	@echo "  make stop            - Stop running containers"
	@echo "  make restart         - Restart all services"
	@echo "  make logs            - View logs of all services"
	@echo "  make logs-db         - View logs of database service"
	@echo "  make ps              - List running containers"
	@echo "  make build           - Build or rebuild services"
	@echo "  make build-no-cache  - Build without cache"
	@echo "  make pull            - Pull latest images"
	@echo "  make clean           - Remove stopped containers"
	@echo "  make db-shell        - Access database shell"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-up           - Start only database"
	@echo "  make db-down         - Stop database"
	@echo "  make db-restart      - Restart database"
	@echo "  make db-logs         - View database logs"
	@echo ""
	@echo "Prisma Commands:"
	@echo "  make prisma-generate - Generate Prisma client"
	@echo "  make prisma-migrate  - Run migrations"
	@echo "  make prisma-studio   - Open Prisma Studio"
	@echo "  make prisma-push     - Push schema changes"
	@echo "  make prisma-seed     - Seed database"
	@echo "  make prisma-reset    - Reset database"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install         - Install dependencies"
	@echo "  make dev             - Start development server"
	@echo "  make dev-setup       - Full setup (db + migrations + server)"
