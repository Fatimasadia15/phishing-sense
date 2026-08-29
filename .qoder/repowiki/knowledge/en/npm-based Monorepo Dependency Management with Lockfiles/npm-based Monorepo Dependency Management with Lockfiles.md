---
kind: dependency_management
name: npm-based Monorepo Dependency Management with Lockfiles
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - server/package.json
---

## System/Approach

The Phishing Sense monorepo uses **npm** as its package manager across two independent Node.js projects: a top-level Expo/React Native mobile app and a `server/` Express backend. Each project maintains its own `package.json`, and only the root project ships a `package-lock.json` lockfile — the server subproject does not have one committed.

## Key Files

- `package.json` (root) — declares all Expo, React Native, i18next, and related dependencies for the mobile app; marks the project `private: true`.
- `package-lock.json` (root) — npm v3 lockfile pinning exact transitive resolutions for the mobile app.
- `server/package.json` — declares runtime-only dependencies (`express`, `cors`, `dotenv`, `express-rate-limit`, `helmet`) with no devDependencies and no lockfile.
- `tsconfig.json` (root) — TypeScript configuration used by the mobile app build; no equivalent in `server/`.

## Architecture and Conventions

- **Separate per-project manifests**: The repo is not a single npm workspace. The mobile app and backend are independent npm packages with their own dependency graphs. There is no `pnpm-workspace.yaml`, `lerna.json`, or `yarn workspaces` config — each directory is installed independently.
- **Version ranges vs pinned versions**: The root `package.json` mixes caret (`^`) ranges (e.g. `expo ~52.0.0`, `i18next ^23.16.8`, `typescript ^5.3.3`) with tilde (`~`) ranges for Expo ecosystem packages (e.g. `expo-router ~4.0.0`, `react-native-gesture-handler ~2.20.2`) and exact pins for some native bridges (e.g. `@react-native-async-storage/async-storage 1.23.1`, `react-native-safe-area-context 4.12.0`). The server `package.json` uses caret ranges for all dependencies (`^2.8.5`, `^16.4.7`, `^4.21.2`, `^7.5.0`, `^8.0.0`).
- **Lockfile usage is asymmetric**: Only the root app commits `package-lock.json`; the server relies on npm's default resolution without a committed lockfile, meaning installs can resolve to different patch/minor versions over time unless an explicit registry or `.npmrc` pins them.
- **No vendoring**: There is no `vendor/`, `node_modules/` committed, and no private npm registry configured via `.npmrc`. All dependencies are resolved from the public npm registry.
- **Private scope**: Both `package.json` files set `"private": true`, indicating these packages are not intended to be published to the npm registry.

## Conventions and Constraints

- **Expo-managed core**: The mobile app pins `expo ~52.0.0` alongside matching `expo-*` scoped packages (`expo-router ~4.0.0`, `expo-constants ~17.0.3`, `expo-font ~13.0.1`, etc.), following Expo's convention of keeping the SDK version aligned with its companion packages.
- **React/React Native version alignment**: `react`, `react-dom`, and `react-native` are pinned to compatible 18.x / 0.76.x versions, and `react-native-web ~0.19.13` is included for web builds.
- **Server runtime-only deps**: The backend has no devDependencies listed; testing is done via Node's built-in `--test` runner invoked through the `test` script against `__tests__/analyze.test.js`, so test code lives in the same package rather than being pulled from a separate dev dependency.
- **No shared dependency hoisting**: Because there is no workspace configuration, duplicate dependencies between the root app and `server/` (e.g. if both needed `dotenv` or `express`) would be installed twice under separate `node_modules` trees.
- **No private registry or auth**: No `.npmrc`, `NPM_TOKEN`, `NPM_CONFIG_USERCONFIG`, or `registry` overrides were found in the repository, so all packages are fetched from the default public npm registry.