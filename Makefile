.PHONY: install compile deploy test start build

# Contracts commands
contracts-install:
	cd contracts && npm install

contracts-compile:
	cd contracts && npm run compile

contracts-test:
	cd contracts && npm test

contracts-deploy:
	cd contracts && npm run deploy

# Frontend commands
frontend-install:
	cd frontend && npm install

frontend-start:
	cd frontend && npm run dev

frontend-test:
	cd frontend && npm run test

frontend-build:
	cd frontend && npm run build

