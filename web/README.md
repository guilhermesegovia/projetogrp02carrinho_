# Dinho's Canal 6 — frontend

This frontend is maintained as plain HTML, CSS, and JavaScript in `public/`. It has no runtime framework, build-time dependencies, or external libraries.

## Edit and publish

- Edit `public/index.html`, `public/app.css`, `public/app.js`, and `public/store.js` directly.
- Run `npm run build:spring` from this directory (or `node scripts/build-spring.mjs`) to publish the static files to `../backend/src/main/resources/static`.
- Open the Spring Boot application at its normal root URL to use the app.

The demo data and login are stored in the browser's local storage. Initial login: `admin@dinhos.com` / `admin123`. This is a local demo only—not secure authentication and not shared across devices.
