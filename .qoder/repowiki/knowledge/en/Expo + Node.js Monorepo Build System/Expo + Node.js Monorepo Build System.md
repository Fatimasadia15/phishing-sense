---
kind: build_system
name: Expo + Node.js Monorepo Build System
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - app.json
    - server/package.json
    - BUILD_STEPS.md
    - server/.env.example
---

## What system/approach is used

This repository is a **monorepo** composed of two independently built Node.js/JavaScript projects:

1. **Mobile/Web app (root)** — Built with **Expo Router** (React Native + React Web). The build toolchain is Expo CLI, which wraps Metro bundler and React Native tooling. There is no custom Makefile or shell script; all build orchestration lives in `package.json` scripts.
2. **Backend API (`server/`)** — A standalone Express.js application with its own `package.json`, dependencies, and Node.js native test runner.

There is **no containerization** (no Dockerfile, no docker-compose), **no CI/CD pipeline** (no `.github/workflows`), **no Makefile**, and **no release automation**. Versioning is flat: both packages declare `"version": "1.0.0"` independently in their respective `package.json` files, and the Expo app version is mirrored in `app.json` under `expo.version`.

## Key files and packages

- `package.json` (root) — Defines Expo-based scripts: `start`, `android`, `ios`, `web`. Declares Expo ~52, React Native 0.76.5, TypeScript 5.3.3 as devDependency.
- `app.json` — Expo config that also acts as the build manifest for iOS bundle ID (`com.phishingsense.app`), Android package name, web bundler (`metro`), splash screen assets, and plugin configuration (e.g., `expo-speech-recognition` permissions).
- `tsconfig.json` — Root TypeScript configuration shared by the Expo project.
- `server/package.json` — Backend entry point `src/server.js`, scripts `start` (`node src/server.js`), `dev` (`node --watch src/server.js`), and `test` (`node --test __tests__/analyze.test.js`).
- `BUILD_STEPS.md` — Authoritative runbook documenting how to start the backend, frontend, and tests; serves as the de facto build documentation since no formal build docs exist.

## Architecture and conventions

- **Dual-package monorepo**: The root directory holds the Expo app; the backend lives in a sibling `server/` directory with its own `node_modules`, `package.json`, and dependency tree. They are built and deployed independently — there is no workspace/lerna/pnpm monorepo manager coordinating them.
- **Environment-driven builds**: The backend reads secrets from `.env` (template at `server/.env.example`) via `dotenv`; the mobile app uses Expo's runtime config (`expo-constants`) and platform-specific base URLs for the backend (Android emulator `10.0.2.2`, iOS `localhost`).
- **Test execution**: The backend uses Node.js built-in test runner (`node --test`) with zero external testing framework; the mobile app has no test scripts defined in `package.json`.
- **Platform targeting**: The Expo app targets three platforms from one codebase via `expo start --android|--ios|--web`; the backend targets only Node.js on any platform.

## Conventions and constraints

- **No shared build scripts**: Each subproject manages its own lifecycle via its own `package.json` scripts. There is no top-level `build`, `test`, or `lint` script that orchestrates both sides.
- **Version coupling is manual**: The Expo app version string appears in both `package.json` and `app.json`; they must be kept in sync by hand.
- **Backend development mode**: Uses `node --watch` (`npm run dev`) rather than nodemon or a dedicated dev server.
- **Frontend fallback behavior is part of the build contract**: The frontend gracefully falls back to client-side mock analysis when the backend is unreachable, so the app can be built and shipped without a running server.
- **No packaging artifacts**: There are no published npm packages, no Docker images, no Play Store/App Store build pipelines, and no release tags referenced in the build process — this repo is a development workspace, not a distribution pipeline.