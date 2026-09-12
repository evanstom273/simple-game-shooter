# Simple Game Shooter

A small arcade shooter built with React, TypeScript, Vite, and an HTML Canvas game loop. Menus and HUD use plain CSS. Scores, run history, and settings stay in IndexedDB through Dexie, and sound effects use the Web Audio API.

## Run it locally

```sh
npm install
npm run dev
```

`npm run build` type-checks the app and creates the production bundle in `dist/`. `npm run preview` serves that bundle locally. The PWA service worker is generated for production builds; local development uses Vite's normal dev server.

## Controls

- Desktop: steer with WASD or the arrow keys; firing is automatic.
- Touch: drag across the playfield to steer; firing is automatic.
- The game requests landscape orientation on small touchscreen devices when the browser allows it. Foldable and larger touch displays remain free to rotate; the layout adapts to either orientation.

## GitHub Pages

The GitHub Actions workflow builds and deploys `dist/` to GitHub Pages on pushes to `main`. Install the site from a supported browser to play it as a PWA. The app shell is cached for offline launches; local run data remains in the browser's IndexedDB.
