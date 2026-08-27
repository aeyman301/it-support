# Sandbox Builder

A cross-platform (iOS/Android) sandbox building game, built with React Native (Expo) and a lightweight real-time co-op server.

## What's here

- **`app/`** — the mobile game (Expo + TypeScript). Players build on a grid using a block palette, save/load worlds locally, export/import worlds as JSON to share with others, and can connect to a co-op server to build the same world live with other players.
- **`server/`** — a small Node.js + Socket.IO server that syncs block placements and player positions between everyone in the same room, for the co-op mode.

## Core features (MVP)

- **Sandbox building**: pick a block from the palette and tap the grid to place it; erase mode to remove; walk mode to move your avatar around the world.
- **Saved worlds (local persistence)**: worlds are saved on-device via AsyncStorage, listed on the home screen, and can be re-opened or deleted.
- **User-generated content sharing**: the "Share" button exports a world as JSON through the native share sheet; anyone can paste that JSON back in via "Import a shared world" to get their own editable copy.
- **Co-op / social play**: tap "Co-op" in a world, enter a server URL + room code + your name to connect. Everyone in the same room sees each other's block edits and movement live.

## Running the app

```bash
cd app
npm start
```

Then scan the QR code with Expo Go on your phone, or press `i` / `a` for the iOS/Android simulator (requires Xcode / Android Studio respectively).

## Running the co-op server

```bash
cd server
npm start
```

This starts a Socket.IO server on port 3001 (override with `PORT=xxxx npm start`). When testing on a real device, use your computer's LAN IP (e.g. `http://192.168.1.23:3001`) instead of `localhost` as the server URL in the app, since the phone is a separate device on the network.

## Architecture notes

- The game world is a 2D grid of block cells (`app/src/game/blocks.ts`), rendered as a `View` grid (`app/src/game/GameGrid.tsx`) — simple and fast to iterate on for an MVP; a large open world would want a virtualized/canvas renderer instead (e.g. `react-native-skia` or a WebGL view).
- Worlds are plain JSON (`app/src/types/index.ts`), which is what makes local save/load, export/import, and server sync all trivial — the same shape flows through all three.
- The co-op server (`server/index.js`) keeps room state in memory only (no database) — good enough for a live session, but state is lost on server restart. A production version would persist rooms and add auth, moderation for shared content, and reconnect/resync handling.

## Honest scope note

"Open-world + user-generated content + social/co-op" is normally a multi-year, multi-engine effort (think Roblox/Minecraft). This build is a real, working slice of all three pillars — build, save/share, and live co-op — on a small fixed-size grid, meant as a foundation to grow from rather than a finished product. Natural next steps: bigger/scrollable worlds, more block types and crafting, persistent server-side worlds with accounts, moderation for shared content, and a richer renderer for smoother visuals.
