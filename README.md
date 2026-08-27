# Drift Loop

A 3D driving/racing mobile game (iOS/Android) built with Unity.

## What's here

- **`unity/`** - the Unity project source (currently `Assets/Scripts/` only -
  see `unity/README.md` for why, and for full setup/build instructions).
- **`erp/`** - a material planning web app (React + Firebase/Firestore) for
  tracking per-material lead time, warehouse stock, outstanding purchase
  orders and the production plan - see `erp/README.md` for setup.

The game is a single-player time trial: drive a placeholder car around a
procedurally-built oval track for 3 laps, with a live speed/lap/best-lap HUD
and on-screen touch controls for mobile.

## Getting started

See [`unity/README.md`](unity/README.md) - it covers Unity installation,
project setup, a required input-settings check, controls, and building to a
phone.

## History

An earlier prototype in this repo's history was a React Native/Expo sandbox
building game with local co-op multiplayer. That was replaced with this
Unity 3D racing game per a later request; it's still visible in the git
history if useful for reference (co-op networking pattern, etc.).
