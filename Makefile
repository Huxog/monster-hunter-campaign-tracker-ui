.PHONY: dev build preview lint format type-check test test-run test-ui

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

format:
	npm run format

type-check:
	npx tsc --noEmit

test:
	npx vitest

test-run:
	npx vitest run

test-ui:
	npx vitest --ui
