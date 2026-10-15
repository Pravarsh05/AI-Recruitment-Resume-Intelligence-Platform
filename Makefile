.PHONY: help build up down test migrate seed lint clean

help:
	@echo "Available commands:"
	@echo "  make up          - Start all Docker containers"
	@echo "  make down        - Stop all Docker containers"
	@echo "  make migrate     - Run Django database migrations"
	@echo "  make seed        - Seed skill taxonomy and demo data"
	@echo "  make test        - Run backend test suite"
	@echo "  make lint        - Run linting and formatting check"

up:
	docker compose up -d

down:
	docker compose down

migrate:
	docker compose exec api python manage.py migrate

seed:
	docker compose exec api python manage.py seed_skills
	docker compose exec api python manage.py seed_demo_data

test:
	docker compose exec api python manage.py test tests

lint:
	ruff check backend
